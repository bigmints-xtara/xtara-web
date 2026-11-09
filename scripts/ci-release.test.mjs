import assert from 'node:assert/strict';
import { test } from 'node:test';
import { release, smoke } from './ci-release.mjs';

const sha = 'a'.repeat(40);
const revision = `xtara-web-ci-${sha.slice(0, 10)}-123-1`;
const prior = 'xtara-web-prior';
const input = { sha, runId: '123', attempt: '1', environment: {
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'bigmints-xtara', NEXT_PUBLIC_FIREBASE_API_KEY: 'public-key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'bigmints-xtara.firebaseapp.com', NEXT_PUBLIC_FIREBASE_APP_ID: 'public-app',
} };
function harness(options = {}) {
  let traffic = prior;
  let candidate = false;
  let calls = 0;
  let saved;
  const commands = [];
  return {
    commands, get saved() { return saved; },
    ops: {
      remoteHead: () => options.stale ? 'b'.repeat(40) : sha,
      execute(command, args) {
        commands.push([command, ...args]);
        if (args[0] === 'artifacts') return `sha256:${'b'.repeat(64)}`;
        if (args[0] === 'run' && args[1] === 'deploy') candidate = true;
        if (args.includes('update-traffic')) {
          traffic = args.at(-1).split('=')[0];
          if (options.commitThenFail && traffic === revision) throw new Error('network lost after commit');
        }
        return '';
      },
      describe: () => ({ status: { traffic: [
        { revisionName: traffic, percent: 100 },
        ...(candidate ? [{ revisionName: revision, tag: 'ci-candidate', url: 'https://candidate.example' }] : []),
      ] } }),
      async smoke() {
        calls++;
        if (options.failCandidate && calls === 1) throw new Error('bad candidate');
        if (options.failLive && calls === 2) throw new Error('bad live release');
        return [{ passed: true }];
      },
      save: (evidence) => { saved = evidence; },
    },
  };
}
test('promotes a checked immutable image and records the exact rollback revision', async () => {
  const h = harness();
  const result = await release(input, h.ops);
  assert.equal(result.status, 'live-verified');
  assert.equal(result.previousTraffic, `${prior}=100`);
  assert.ok(h.commands.some((args) => args.includes('--image') && args.some((arg) => arg.includes('@sha256:'))));
});
test('a failed candidate never receives production traffic', async () => {
  const h = harness({ failCandidate: true });
  await assert.rejects(release(input, h.ops), /bad candidate/);
  assert.ok(!h.commands.some((args) => args.includes('update-traffic')));
  assert.equal(h.saved.status, 'failed');
});
for (const option of ['failLive', 'commitThenFail']) {
  test(`restores prior traffic after ${option}`, async () => {
    const h = harness({ [option]: true });
    await assert.rejects(release(input, h.ops));
    assert.equal(h.saved.rollback, 'restored-and-verified');
    assert.equal(h.commands.at(-1).at(-1), `${prior}=100`);
  });
}
test('a superseded branch head cannot build or deploy', async () => {
  const h = harness({ stale: true });
  await assert.rejects(release(input, h.ops), /superseded/);
  assert.equal(h.commands.length, 0);
});
test('smoke requires database assessment authority and denies anonymous Admin access', async () => {
  const requested = [];
  const fetcher = async (url) => {
    requested.push(url);
    const status = /\/me$|\/admin\/users$/.test(url) ? 401 : 200;
    return { status, text: async () => '<html lang="en">', json: async () => ({
      success: true, data: { status: 'ok', source: 'database', version: '3.1.0' },
    }) };
  };
  assert.equal((await smoke('https://test.example', fetcher)).length, 26);
  assert.equal(requested.filter((url) => url.includes('/assessment/definition')).length, 20);
  await assert.rejects(smoke('https://test.example', async (url) => ({
    ...await fetcher(url), json: async () => ({ success: true, data: { status: 'ok', source: 'bundled' } }),
  })), /database/);
});
