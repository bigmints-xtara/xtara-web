import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const PROJECT = 'bigmints-xtara';
const REGION = 'us-central1';
const SERVICE = 'xtara-web';
const IMAGE = `us-docker.pkg.dev/${PROJECT}/cloud-run-source-deploy/${SERVICE}`;
const PUBLIC_BUILD_KEYS = [
  'NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', 'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID', 'NEXT_PUBLIC_GA_ID',
  'NEXT_PUBLIC_ALGOLIA_APP_ID', 'NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY',
  'NEXT_PUBLIC_ALGOLIA_INDEX_NAME', 'NEXT_PUBLIC_XTARA_API_BASE_URL',
  'XTARA_API_PROXY_TARGET',
];
const CLOUD_FLAGS = ['--project', PROJECT, '--region', REGION, '--quiet'];
const execute = (command, args, inherit = false) => execFileSync(command, args, {
  encoding: 'utf8', stdio: inherit ? 'inherit' : ['ignore', 'pipe', 'inherit'],
});
const describe = () => JSON.parse(execute('gcloud', [
  'run', 'services', 'describe', SERVICE, ...CLOUD_FLAGS, '--format=json',
]));

export function trafficTargets(service) {
  const traffic = service.status.traffic.filter((entry) => entry.percent > 0);
  assert(traffic.length > 0, 'Current production traffic is missing');
  assert(traffic.reduce((sum, entry) => sum + entry.percent, 0) === 100, 'Traffic must total 100%');
  return traffic.map(({ revisionName, percent }) => {
    assert(revisionName && !revisionName.includes(','), 'Expected a named rollback revision');
    return `${revisionName}=${percent}`;
  }).sort().join(',');
}

export async function smoke(base, fetcher = fetch) {
  const checks = [];
  async function check(path, status, validate) {
    const response = await fetcher(`${base}${path}`, { signal: AbortSignal.timeout(30000) });
    assert.equal(response.status, status, `${path}: unexpected HTTP status`);
    if (validate) await validate(response);
    checks.push({ path, status, passed: true });
  }
  await check('/', 200, async (response) => {
    assert.match(await response.text(), /<html[\s>]/i, 'Homepage must render HTML');
  });
  await check('/login', 200);
  await check('/xtara-service/api/v1/health', 200, async (response) => {
    const body = await response.json();
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'ok');
  });
  await check('/xtara-service/api/v1/dream-careers?limit=1', 200);
  for (const grade of [8, 9, 10, 11, 12]) {
    for (const locale of ['en', 'ml', 'hi', 'ta']) {
      await check(`/xtara-service/api/v1/assessment/definition?stage=grade${grade}&locale=${locale}`, 200, async (response) => {
        const body = await response.json();
        assert.equal(body.success, true);
        assert.equal(body.data.source, 'database', 'Published assessment must come from the database');
        assert.ok(body.data.version, 'Published assessment needs a version');
      });
    }
  }
  await check('/xtara-service/api/v1/me', 401);
  await check('/xtara-service/api/v1/admin/users', 401);
  return checks;
}

// Inject external operations so promotion and rollback behavior can be tested offline.
export async function release({ sha, runId, attempt, environment = process.env }, overrides = {}) {
  assert.match(sha, /^[a-f0-9]{40}$/);
  assert.match(runId, /^\d+$/);
  assert.match(attempt, /^\d+$/);
  const ops = {
    execute, describe, smoke,
    remoteHead: () => execute('git', ['ls-remote', 'origin', 'refs/heads/xtara-mvp']).split(/\s/)[0],
    save: (record) => writeFileSync('release-evidence.json', `${JSON.stringify(record, null, 2)}\n`),
    ...overrides,
  };
  const evidence = { source: sha, runId, attempt, project: PROJECT, region: REGION, service: SERVICE, status: 'started' };
  let promoted = false;
  let previousTraffic;
  let revision;
  try {
    assert.equal(ops.remoteHead(), sha, 'Refusing to deploy a superseded commit');
    assert.equal(environment.NEXT_PUBLIC_FIREBASE_PROJECT_ID, PROJECT, 'Production Firebase project must match');
    for (const key of ['NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'NEXT_PUBLIC_FIREBASE_APP_ID']) {
      assert.ok(environment[key], `Missing public Firebase build configuration: ${key}`);
    }
    previousTraffic = trafficTargets(ops.describe());
    evidence.previousTraffic = previousTraffic;
    const tag = `${sha}-${runId}-${attempt}`;
    const image = `${IMAGE}:${tag}`;
    evidence.image = image;
    const args = ['build', '--platform=linux/amd64', '--tag', image];
    for (const key of PUBLIC_BUILD_KEYS) {
      if (environment[key]) args.push('--build-arg', `${key}=${environment[key]}`);
    }
    ops.execute('docker', [...args, '.'], true);
    ops.execute('docker', ['push', image], true);
    // A pushed image digest is immutable; never promote a mutable latest tag.
    const digest = ops.execute('gcloud', ['artifacts', 'docker', 'images', 'describe', image,
      '--project', PROJECT, '--format=value(image_summary.digest)']).trim();
    assert.match(digest, /^sha256:[a-f0-9]{64}$/);
    evidence.imageDigest = digest;
    ops.execute('gcloud', ['run', 'deploy', SERVICE, ...CLOUD_FLAGS,
      '--image', `${IMAGE}@${digest}`, '--no-traffic', '--tag', 'ci-candidate',
      '--revision-suffix', `ci-${sha.slice(0, 10)}-${runId}-${attempt}`], true);
    const candidateService = ops.describe();
    const candidate = candidateService.status.traffic.find((entry) => entry.tag === 'ci-candidate');
    assert.ok(candidate?.url && candidate?.revisionName, 'Candidate revision and URL are required');
    revision = candidate.revisionName;
    assert.equal(revision, `${SERVICE}-ci-${sha.slice(0, 10)}-${runId}-${attempt}`);
    assert.equal(trafficTargets(candidateService), previousTraffic, 'Candidate changed production traffic');
    evidence.candidate = { revision, url: candidate.url };
    evidence.candidateChecks = await ops.smoke(candidate.url);
    assert.equal(ops.remoteHead(), sha, 'Branch advanced during build; newer commit must deploy instead');
    assert.equal(trafficTargets(ops.describe()), previousTraffic, 'Production changed during candidate checks');
    // Set before the request: a CLI/network failure may occur after the server commits traffic.
    promoted = true;
    ops.execute('gcloud', ['run', 'services', 'update-traffic', SERVICE, ...CLOUD_FLAGS,
      '--to-revisions', `${revision}=100`], true);
    assert.equal(trafficTargets(ops.describe()), `${revision}=100`, 'Production traffic readback failed');
    evidence.liveChecks = await ops.smoke('https://xtara.ai');
    evidence.status = 'live-verified';
    return evidence;
  } catch (error) {
    evidence.status = 'failed';
    evidence.error = error.message;
    if (promoted) {
      try {
        const currentTraffic = trafficTargets(ops.describe());
        if (currentTraffic === `${revision}=100`) {
          ops.execute('gcloud', ['run', 'services', 'update-traffic', SERVICE, ...CLOUD_FLAGS,
            '--to-revisions', previousTraffic], true);
          assert.equal(trafficTargets(ops.describe()), previousTraffic, 'Rollback traffic readback failed');
          evidence.rollback = 'restored-and-verified';
        } else if (currentTraffic === previousTraffic) {
          evidence.rollback = 'previous-traffic-already-restored';
        } else {
          evidence.rollback = 'skipped-concurrent-production-change';
        }
      } catch (rollbackError) {
        evidence.rollback = 'failed';
        evidence.rollbackError = rollbackError.message;
      }
    }
    throw error;
  } finally {
    ops.save(evidence);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  assert.equal(process.env.GITHUB_REF, 'refs/heads/xtara-mvp');
  assert.ok(['push', 'workflow_dispatch'].includes(process.env.GITHUB_EVENT_NAME));
  await release({ sha: process.env.GITHUB_SHA, runId: process.env.GITHUB_RUN_ID, attempt: process.env.GITHUB_RUN_ATTEMPT });
}
