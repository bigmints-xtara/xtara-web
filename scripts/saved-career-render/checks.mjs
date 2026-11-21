import assert from 'node:assert/strict';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';

const populated = 'data-scientist';
const sparse = 'ai-governance-specialist';

function screenFor(fixture, career, locale) {
  for (const [key, envelope] of Object.entries(fixture.routes)) {
    const [method, href] = key.split(' ');
    const url = new URL(href, 'http://127.0.0.1');
    if (method === 'GET' && url.pathname === '/api/v1/me/dream-careers/' + career + '/student-context'
        && url.searchParams.get('screen') === '1' && url.searchParams.get('locale') === locale) {
      const screen = envelope.data.screen;
      assert.equal(screen.careerId, career);
      assert.equal(screen.locale, locale);
      return screen;
    }
  }
  throw new Error('Fixture lacks saved screen ' + career + ' in ' + locale);
}

export async function walkthrough({ browser, origin, fixture, session, manifest, output, viewport, width, locale, screenshots }) {
  const colorScheme = locale === 'en' ? 'light' : 'dark';
  const context = await browser.newContext({ colorScheme, viewport: { width, height: width < 600 ? 844 : 900 }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
  let page;
  const diagnostics = [];
  try {
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      return ['data:', 'blob:'].includes(url.protocol) || url.origin === origin ? route.continue() : route.abort();
    });
    await context.addCookies([{ name: 'xtara_locale', value: locale, url: origin }]);
    page = await context.newPage();
    page.on('pageerror', error => diagnostics.push(error.message));
    page.on('response', response => { if (response.status() >= 400) diagnostics.push(response.status() + ' ' + new URL(response.url()).pathname); });
    page.setDefaultTimeout(25000);
    await page.goto(origin);
    await page.locator('#hero h1').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const gutter = await page.locator('#hero h1').evaluate(el => el.getBoundingClientRect().left);
    if (colorScheme === 'dark') {
      await page.waitForFunction(() => ['light', 'dark'].includes(document.documentElement.style.colorScheme));
      manifest.darkAppearance = {
        chromePreference: colorScheme,
        effectiveAtPublicLoad: await page.evaluate(() => document.documentElement.style.colorScheme),
      };
    }
    const measurements = [];
    let usesThemePreview = false;
    const capture = async (scenario, step, selector, shoot = screenshots) => {
      await page.evaluate(() => document.fonts.ready);
      if (colorScheme === 'dark') {
        const preview = await page.evaluate(() => {
          if (!matchMedia('(prefers-color-scheme: dark)').matches) throw new Error('Chrome did not emulate dark preference.');
          const needsPreview = !document.documentElement.classList.contains('dark');
          // The release switch can pin light mode. Preview the shipped dark tokens in this disposable document.
          if (needsPreview) document.documentElement.classList.add('dark');
          document.documentElement.style.colorScheme = 'dark';
          return needsPreview;
        });
        usesThemePreview ||= preview;
      }
      const layout = await page.locator(selector).first().evaluate(el => ({
        left: el.getBoundingClientRect().left,
        width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      }));
      assert(layout.scrollWidth <= width + 1, `${scenario}/${step} horizontally overflows ${width}px`);
      assert(Math.abs(layout.left - gutter) <= 1, `${scenario}/${step} left edge ${layout.left} differs from public edge ${gutter}`);
      measurements.push({ scenario, step, ...layout });
      if (!shoot) return;
      const image = [locale, viewport, scenario, step].join('-') + '.png';
      await page.screenshot({ path: path.join(output, image), animations: 'disabled' });
      manifest.captures.push({ scenario, step, viewport, locale, width, image, route: new URL(page.url()).pathname });
    };
    await capture(populated, 'public', '#hero h1');
    await context.addInitScript(({ uid, token }) => sessionStorage.setItem('xtara-render-session', JSON.stringify({ uid, token })), session);
    for (const career of [populated, sparse]) {
      const screen = screenFor(fixture, career, locale);
      await page.goto(origin + '/dashboard');
      const saved = page.locator('a[href="/dream-careers/' + career + '?from=dashboard"]').first();
      await saved.waitFor();
      await capture(career, 'dashboard', 'main h1');
      await saved.focus();
      await saved.press('Enter');
      await page.getByRole('heading', { level: 1, name: screen.title, exact: true }).waitFor();
      const backLabel = await page.locator('main header a[href="/dashboard"]').innerText();
      const navLabels = await page.locator('nav a[href="/dashboard"]').allTextContents();
      assert(navLabels.some(label => label.trim() === backLabel.trim()), 'Career return label must name the dashboard navigation destination.');
      const reader = page.locator('[data-testid="saved-career-reader"]');
      await reader.locator('[data-section]').first().waitFor();
      const overviewTab = reader.locator('[data-career-tab="overview"]');
      const studyTab = reader.locator('[data-career-tab="study"]');
      const panel = reader.getByRole('tabpanel');
      const readSections = () => panel.locator('[data-section]').evaluateAll(nodes => nodes.map(node => node.dataset.section));
      assert.equal(await overviewTab.getAttribute('aria-selected'), 'true');
      assert.equal(await panel.count(), 1);
      const overview = await readSections();
      assert.equal(await overviewTab.getAttribute('aria-controls'), await panel.getAttribute('id'));
      await capture(career, 'career', 'main h1');
      await overviewTab.focus();
      const scrollY = await page.evaluate(() => window.scrollY);
      await overviewTab.press('ArrowRight');
      await page.waitForFunction(() => document.activeElement?.getAttribute('data-career-tab') === 'study'
        && document.activeElement.getAttribute('aria-selected') === 'true');
      assert.equal(await page.evaluate(() => window.scrollY), scrollY, 'Switching tabs scrolled the page.');
      assert.equal(await panel.count(), 1);
      await page.goBack();
      assert.equal(await overviewTab.getAttribute('aria-selected'), 'true');
      await page.goForward();
      assert.equal(await studyTab.getAttribute('aria-selected'), 'true');
      const study = await readSections();
      assert.deepEqual([...overview, ...study].sort(), screen.sections.map(section => section.id).sort());
      if (screen.tabs) {
        for (const tab of screen.tabs) {
          assert.deepEqual(tab.id === 'study' ? study : overview, tab.sectionIds);
          assert.equal(await reader.locator('[data-career-tab="' + tab.id + '"]').innerText(), tab.title);
        }
      } else {
        assert.deepEqual(overview, screen.sections.filter(section => !['study', 'colleges'].includes(section.id)).map(section => section.id));
        assert.deepEqual(study, screen.sections.filter(section => ['study', 'colleges'].includes(section.id)).map(section => section.id));
      }
      if (locale === 'en') manifest.tabSections[career] = { overview, study };
      if (career === populated) {
        const current = screen.sections.find(section => section.id === 'study').blocks.filter(block => block.kind === 'heading' && block.current);
        assert.equal(screen.grade, 'grade12');
        assert.deepEqual(current.map(block => block.phase), ['afterGrade12']);
        const marked = reader.locator('[data-section="study"] [aria-current="step"]');
        assert.equal(await marked.count(), 1);
        assert.equal(await marked.innerText(), current[0].text);
        assert.equal(await marked.getAttribute('id'), 'study-afterGrade12');
      }
      const collegeSection = reader.locator('[data-section="colleges"]');
      const blocks = screen.sections.find(section => section.id === 'colleges').blocks;
      if (career === sparse) {
        await collegeSection.evaluate(el => el.scrollIntoView({ block: 'start' }));
        await capture(career, 'study', 'main h1');
        assert.equal(blocks.filter(block => block.kind === 'offering').length, 0);
        assert.equal(await collegeSection.locator('a[href*="/colleges/"]').count(), 0);
        for (const block of blocks.filter(block => block.kind === 'text')) await collegeSection.getByText(block.text, { exact: true }).waitFor();
        continue;
      }
      await capture(career, 'study', 'main h1');
      const offering = blocks.find(block => block.kind === 'offering').offering;
      assert.equal(offering.offeringId, manifest.offeringId);
      assert.equal(offering.institutionId, manifest.institutionId);
      const anchor = 'study-offering-' + offering.offeringId;
      const link = collegeSection.locator('a[id="' + anchor + '"]');
      await link.focus();
      await link.press('Enter');
      await page.waitForURL(url => url.pathname.startsWith('/colleges/') && url.searchParams.get('offeringId') === offering.offeringId);
      assert.equal(decodeURIComponent(new URL(page.url()).pathname.split('/').at(-1)), offering.institutionId);
      await page.getByRole('heading', { level: 1, name: offering.institutionName, exact: true }).waitFor();
      await page.getByRole('heading', { level: 3, name: offering.title, exact: true }).waitFor();
      assert.equal(await page.locator('main article').count(), 1);
      await capture(career, 'college', 'main h1');
      await page.goBack();
      await page.waitForFunction(id => document.activeElement?.id === id && location.hash === '#' + id, anchor);
      assert.equal(await studyTab.getAttribute('aria-selected'), 'true');
      await link.press('Enter');
      await page.waitForURL(url => url.pathname.startsWith('/colleges/'));
      const back = page.locator('a[href*="from=dashboard#study-offering-"]').first();
      await back.press('Enter');
      await page.waitForFunction(id => location.hash === '#' + id && document.activeElement?.id === id, anchor);
      assert.equal(await studyTab.getAttribute('aria-selected'), 'true');
      await capture(career, 'return', 'main h1');
      const browse = collegeSection.locator('a[href*="/study-options?"]').first();
      await browse.press('Enter');
      await page.waitForURL(url => url.pathname.endsWith('/' + career + '/study-options'));
      const listed = page.locator('li[id="' + anchor + '"] a[href*="offeringId=' + offering.offeringId + '"]');
      await listed.waitFor();
      await capture(career, 'options', 'main h1');
      assert(new URL(await listed.getAttribute('href'), origin).searchParams.get('returnTo').startsWith('/explore/roles/' + career + '/study-options?'));
      await listed.press('Enter');
      await page.waitForURL(url => url.pathname.startsWith('/colleges/') && url.searchParams.get('offeringId') === offering.offeringId);
      await page.getByRole('heading', { level: 1, name: offering.institutionName, exact: true }).waitFor();
      const resultsBack = page.locator('main a[href*="/study-options?"]').first();
      await resultsBack.press('Enter');
      await page.waitForFunction(id => location.hash === '#' + id && document.activeElement?.closest('li')?.id === id, anchor);
      await page.locator('main a[href*="from=dashboard#career-study"]').first().press('Enter');
      await reader.getByRole('tab', { selected: true }).waitFor();
      assert.equal(await studyTab.getAttribute('aria-selected'), 'true');
    }
    if (colorScheme === 'dark') manifest.darkAppearance.previewClassApplied = usesThemePreview;
    manifest.measurements.push({ viewport, locale, width, colorScheme, usesThemePreview, publicGutter: gutter, pages: measurements });
  } catch (error) {
    if (page) {
      await page.screenshot({ path: path.join(output, 'failed-' + locale + '-' + viewport + '.png') }).catch(() => {});
      diagnostics.push(page.url(), await page.locator('body').innerText().catch(() => 'Document unavailable'));
      await writeFile(path.join(output, 'browser-diagnostic.log'), diagnostics.join('\n'));
    }
    throw error;
  } finally {
    await context.close();
  }
}
