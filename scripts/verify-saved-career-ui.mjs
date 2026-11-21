// Render the production route modules in a disposable, loopback-only Next.js application.
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright-core';
import { walkthrough } from './saved-career-render/checks.mjs';
import { localPort, prepareWeb, processWithLog, waitFor } from './saved-career-render/server.mjs';

const { values } = parseArgs({ options: {
  fixture: { type: 'string' }, api: { type: 'string' }, output: { type: 'string' }, chrome: { type: 'string' },
} });
assert(values.fixture && values.output, 'Use --fixture <API export.json> --output <new evidence directory> [--api <loopback gateway>/api/v1] [--chrome <binary>]');
const root = fileURLToPath(new URL('../', import.meta.url));
const fixturePath = path.resolve(values.fixture);
const output = path.resolve(values.output);
await mkdir(output, { recursive: true });
assert.equal((await readdir(output)).length, 0, 'Choose an empty evidence directory.');
const bytes = await readFile(fixturePath);
const fixture = JSON.parse(bytes);
assert.equal(fixture.uid, 'render-learner');
const temp = await mkdtemp(path.join(os.tmpdir(), 'xtara-career-chrome-'));
const manifest = {
  schemaVersion: 1, surface: 'web', passed: false, fixtureSha256: createHash('sha256').update(bytes).digest('hex'),
  offeringId: 'offering-0ba28dd20f42330f', institutionId: 'institution:56930', tabSections: {}, captures: [], checks: {}, measurements: [],
  source: 'Production Next.js route modules and CSS, isolated synthetic identity, local API fixture, self-hosted Inter, installed Chrome.',
};
const children = [];
let browser;
let finished = false;
async function cleanup() {
  if (finished) return;
  finished = true;
  await browser?.close();
  for (const child of children.reverse()) {
    if (child.pid && child.exitCode === null && !child.signalCode) {
      const exited = once(child, 'exit');
      try { process.kill(-child.pid, 'SIGTERM'); await exited; } catch (error) { if (error.code !== 'ESRCH') throw error; }
    }
  }
  await rm(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 160 });
}
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await cleanup(); process.exit(1); });
try {
  let apiAddress = values.api;
  // Only start the companion API when a shared gateway was not supplied by the orchestrator.
  if (!apiAddress) {
    const ready = path.join(temp, 'fixture-ready.json');
    const fixtureServer = processWithLog('npm', ['run', 'render:fixture', '--', '--serve', '--input', fixturePath, '--port', '0', '--ready-file', ready],
      path.resolve(root, '../xtara-api'), process.env, path.join(output, 'fixture-server.log'));
    children.push(fixtureServer);
    apiAddress = (await waitFor(fixtureServer, 'API fixture', async () => JSON.parse(await readFile(ready, 'utf8')))).apiBaseUrl;
  }
  const api = new URL(apiAddress);
  assert(api.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(api.hostname)
    && !api.username && !api.password && api.pathname.replace(/\/$/, '') === '/api/v1', 'Expected the local fixture gateway');
  const bootstrap = await fetch(api.origin + '/__fixture/session', { method: 'POST', redirect: 'error' });
  assert(bootstrap.ok, 'The fixture session bootstrap failed.');
  const session = await bootstrap.json();
  assert(session.uid === fixture.uid && typeof session.token === 'string' && session.token, 'Expected a synthetic fixture session.');
  const dir = await prepareWeb(root, temp);
  const port = await localPort();
  const origin = 'http://127.0.0.1:' + port;
  const next = processWithLog(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', String(port)],
    dir, { PATH: process.env.PATH, HOME: temp, TMPDIR: temp, NEXT_TELEMETRY_DISABLED: '1', XTARA_API_PROXY_TARGET: api.origin,
      NEXT_PUBLIC_XTARA_API_BASE_URL: '/xtara-service' }, path.join(output, 'web-server.log'));
  children.push(next);
  await waitFor(next, 'Next development server', async () => (await fetch(origin)).ok);
  browser = await chromium.launch(values.chrome ? { executablePath: values.chrome, headless: true } : { channel: 'chrome', headless: true });
  manifest.browser = await browser.version();
  const languages = new Set(Object.keys(fixture.routes).filter(key => key.includes('/student-context?')).map(key => new URL(key.split(' ')[1], api.origin).searchParams.get('locale')));
  const translated = ['ml', 'hi', 'ta'].find(locale => languages.has(locale));
  for (const [viewport, width, locale, screenshots] of [['desktop', 1512, 'en', true], ['compact-390', 390, 'en', true], ['compact-320', 320, 'en', false], ['compact-390', 390, translated, false]]) {
    assert(locale, 'Fixture needs one translated career screen.');
    await walkthrough({ browser, origin, fixture, session, manifest, output, viewport, width, locale, screenshots });
  }
  manifest.checks = { sectionOrder: true, tabSelection: true, studyTabReturn: true, offeringIdentity: true, sparseCoverage: true, keyboardOfferingReturn: true, keyboardStudyResultsReturn: true,
    currentGradePhase: true, selectedProgrammeTitle: true, dashboardReturnLabel: true, publicGutters: true, translatedWidth: true, darkStylePreview: true, noHorizontalOverflow: true };
  manifest.passed = true;
} catch (error) {
  console.error(error);
  manifest.error = error.message;
  process.exitCode = 1;
} finally {
  await cleanup();
  await writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
}
