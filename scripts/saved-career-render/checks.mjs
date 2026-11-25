import assert from 'node:assert/strict';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';

const populated = 'data-scientist';
const sparse = 'ai-governance-specialist';

function screenFor(fixture, career, locale, visual = false) {
  for (const [key, envelope] of Object.entries(fixture.routes)) {
    const [method, href] = key.split(' ');
    const url = new URL(href, 'http://127.0.0.1');
    if (method === 'GET' && url.pathname === '/api/v1/me/dream-careers/' + career + '/student-context'
        && (!visual || url.searchParams.get('visuals') === '1') && url.searchParams.get('screen') === '1' && url.searchParams.get('locale') === locale) {
      const screen = envelope.data.screen;
      assert.equal(screen.careerId, career);
      assert.equal(screen.locale, locale);
      return screen;
    }
  }
  throw new Error('Fixture lacks saved screen ' + career + ' in ' + locale);
}

export async function walkthrough({ browser, origin, mediaOrigin, fixture, session, manifest, output, viewport, width, locale, screenshots }) {
  const colorScheme = locale === 'en' ? 'light' : 'dark';
  const context = await browser.newContext({ colorScheme, viewport: { width, height: width < 600 ? 844 : 900 }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
  let page;
  const diagnostics = [];
  try {
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      const fixtureImage = url.origin === mediaOrigin && /^\/api\/v1\/media\/images\/[a-f0-9]{64}$/.test(url.pathname);
      return fixtureImage || ['data:', 'blob:'].includes(url.protocol) || url.origin === origin ? route.continue() : route.abort();
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
      const dashboardCareers = fixture.routes['GET /api/v1/me/direction?locale=' + locale].data.overview.careers;
      const offerings = dashboardCareers.flatMap(item => item.study?.offerings ?? []);
      assert(offerings.length > 0, 'Dashboard check needs a real reviewed offering in the signed learner response.');
      const savedList = page.getByTestId('dream-career-list');
      const rows = savedList.getByRole('listitem');
      assert.equal(await rows.count(), dashboardCareers.length);
      for (const [i, expected] of dashboardCareers.entries()) {
        const row = rows.nth(i);
        const links = row.getByRole('link');
        assert.equal(await links.count(), 1);
        assert.equal(await links.getAttribute('href'), '/dream-careers/' + expected.id + '?from=dashboard');
        assert.equal((await row.innerText()).trim(), (await links.innerText()).trim());
      }
      const section = savedList.locator('..');
      assert.equal(await section.locator('a[href*="/colleges/"], a[href*="/study-options"], a[href*="#courses-and-colleges"]').count(), 0);
      const content = await section.innerText();
      for (const offering of offerings) {
        assert(!content.includes(offering.title) && !content.includes(offering.institutionName), 'Saved careers unexpectedly include a programme preview.');
      }
      manifest.checks.dashboardCareersOnly = true;
      await capture(career, 'dashboard', 'main h1');
      if (career === populated) {
        const banner = page.locator('section[aria-labelledby="dashboard-explore-title"]');
        const action = banner.getByRole('link');
        await banner.scrollIntoViewIfNeeded();
        const arrangement = await banner.evaluate(async section => {
          const artwork = [...section.querySelectorAll('img')];
          await Promise.all(artwork.map(image => image.decode()));
          const rect = element => element.getBoundingClientRect();
          const images = artwork.map(image => ({ filename: new URL(image.currentSrc).pathname.split('/').at(-1),
            decoded: image.naturalWidth > 0, left: rect(image).left, right: rect(image).right, top: rect(image).top, width: rect(image).width }));
          const { right, bottom, height } = rect(section.querySelector('a'));
          return { images, action: { right, bottom, height }, width: rect(section).width, scroll: section.scrollWidth };
        });
        const [art, digital, science] = arrangement.images;
        assert.deepEqual(arrangement.images.map(image => image.filename), ['art.webp', 'digital.webp', 'science.webp']);
        assert(arrangement.images.every(image => image.decoded));
        assert(art.left < digital.left && digital.left < science.left && digital.width > art.width && digital.width > science.width);
        assert(arrangement.action.height >= 44 && arrangement.scroll <= arrangement.width + 1);
        assert(width <= 700 ? arrangement.images.every(image => image.top >= arrangement.action.bottom)
          : arrangement.images.every(image => image.left >= arrangement.action.right));
        assert.equal(await action.getAttribute('href'), '/explore');
        await action.focus();
        assert(await action.evaluate(link => link === document.activeElement));
        if (screenshots) {
          const image = [locale, viewport, 'dashboard-explore-banner'].join('-') + '.png';
          await banner.screenshot({ path: path.join(output, image), animations: 'disabled' });
          manifest.captures.push({ scenario: career, step: 'explore-banner', viewport, width, locale, image, route: '/dashboard' });
        }
        if (locale === 'en' && viewport === 'desktop') {
          await action.press('Enter');
          await page.waitForURL(url => url.pathname === '/explore');
          await page.goBack();
          await saved.waitFor();
        }
        await page.evaluate(() => window.scrollTo(0, 0));
        manifest.checks.dashboardExplorerBanner = true;
      }
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
    if (locale === 'en' && screenshots) {
      const heroSha256 = {};
      const publicRequests = [];
      const contextualRequests = [];
      page.on('request', request => {
        const url = new URL(request.url());
        if (/\/api\/v1\/(?:career-explorer|dream-careers\/[^/]+\/(?:overview|student-guide))$/.test(url.pathname)) publicRequests.push(url.pathname + url.search);
        if (url.pathname.endsWith('/student-context')) contextualRequests.push(url.pathname + url.search);
      });
      for (const careerId of ['art-therapist', 'doctor']) {
        const screen = screenFor(fixture, careerId, locale, true);
        const guideUrl = origin + '/dream-careers/' + careerId + '?from=dashboard';
        const captureLoader = careerId === 'art-therapist' && screenshots;
        if (captureLoader) {
          const { promise, resolve } = Promise.withResolvers();
          await page.exposeFunction('waitForGuideCapture', () => promise);
          await page.addInitScript(() => {
            if (location.pathname !== '/dream-careers/art-therapist') return;
            const fetch = window.fetch.bind(window);
            window.fetch = async (input, init) => {
              const url = new URL(input instanceof Request ? input.url : input, location.href);
              if (url.pathname.endsWith('/art-therapist/student-context')) await window.waitForGuideCapture();
              return fetch(input, init);
            };
          });
          try {
            await page.goto(guideUrl, { waitUntil: 'domcontentloaded' });
            await page.locator('nav a[href="/dashboard"]').first().waitFor({ state: 'attached' });
            const loader = page.getByRole('status').filter({ hasText: 'Loading career guide' });
            await loader.locator('.animate-pulse').first().waitFor();
            const image = [locale, viewport, careerId, 'loading'].join('-') + '.png';
            await page.screenshot({ path: path.join(output, image), animations: 'disabled' });
            manifest.captures.push({ scenario: careerId, step: 'loading', viewport, locale, width, image, route: '/dream-careers/' + careerId });
          } finally {
            resolve();
          }
        } else {
          await page.goto(guideUrl);
        }
        await page.getByRole('heading', { level: 1, name: screen.title, exact: true }).waitFor();
        const art = page.locator('[data-testid="saved-career-artwork"] img');
        await art.waitFor();
        const imageInfo = await art.evaluate(async img => { await img.decode(); return { src: img.currentSrc, size: img.naturalWidth }; });
        assert(imageInfo.size > 0);
        const assetHash = url => url.match(/[0-9a-f]{64}/)?.[0];
        heroSha256[careerId] = assetHash(imageInfo.src);
        assert(heroSha256[careerId] && heroSha256[careerId] === assetHash(screen.illustration.url), 'Hero did not render the reviewed image');
        if (careerId === 'art-therapist') {
          await capture(careerId, 'career', 'main h1');
          continue;
        }
        const tab = page.locator('[data-career-tab="specializations"]');
        await tab.click();
        const panel = page.getByRole('tabpanel');
        const cards = panel.locator('a[data-specialization-id]');
        const specializationIds = await cards.evaluateAll(links => links.map(link => link.dataset.specializationId));
        const expected = screen.sections.flatMap(section => section.blocks).find(block => block.kind === 'specializations').items;
        assert.deepEqual(specializationIds, expected.map(item => item.id));
        assert(specializationIds.length > 1);
        const illustrated = expected.find(item => item.illustration);
        assert(illustrated, 'Expected an illustrated medical specialty');
        const child = cards.filter({ has: page.getByRole('heading', { name: illustrated.title, exact: true }) });
        const childArt = child.locator('img');
        await childArt.waitFor();
        assert(await childArt.evaluate(async img => { await img.decode(); return img.naturalWidth > 0; }));
        assert.equal(assetHash(await childArt.getAttribute('src')), assetHash(illustrated.illustration.url));
        await tab.evaluate(trigger => {
          const top = trigger.getBoundingClientRect().top + window.scrollY;
          const headerHeight = document.querySelector('header')?.getBoundingClientRect().height ?? 0;
          window.scrollTo(0, top - headerHeight);
        });
        await capture(careerId, 'specializations', 'main h1');

        async function openChild() {
          await child.focus();
          await child.press('Enter');
          await page.waitForURL(url => url.pathname === '/explore' && url.searchParams.get('career') === illustrated.id && url.searchParams.get('step') === 'work');
          await page.locator('h1').filter({ hasText: illustrated.title }).waitFor();
        }
        await openChild();
        await page.goBack();
        await child.waitFor();
        const beforePublic = publicRequests.length;
        const beforeContext = contextualRequests.length;
        await openChild();
        await page.goBack();
        await child.waitFor();
        assert.equal(publicRequests.length, beforePublic, 'Second visit repeated a fresh public read');
        assert.equal(contextualRequests.length, beforeContext, 'Second visit repeated a fresh account career read');
        manifest.visuals = { heroSha256, specializationIds, openedCareerId: illustrated.id };
        (manifest.cacheReads ??= {})[viewport] = { publicKeys: [...new Set(publicRequests)], firstPublic: beforePublic, secondPublic: publicRequests.length - beforePublic,
          firstStudentContext: beforeContext, secondStudentContext: contextualRequests.length - beforeContext };

        await page.locator('[data-career-tab="study"]').click();
        const colleges = panel.locator('[data-section="colleges"]');
        const blocks = screen.sections.find(section => section.id === 'colleges').blocks;
        const preview = blocks.find(block => block.kind === 'offering')?.offering;
        const action = blocks.find(block => block.kind === 'action' && block.action === 'all_states')
          ?? blocks.find(block => block.kind === 'action' && block.action === 'browse_study');
        assert(action, 'Expected a reviewed Medicine study-options action');
        await colleges.evaluate(section => section.scrollIntoView({ block: 'start' }));
        await capture(careerId, 'study', 'main h1');
        const [response] = await Promise.all([
          page.waitForResponse(result => new URL(result.url()).pathname.endsWith('/study-options/doctor') && result.ok()),
          colleges.getByRole('link', { name: action.label, exact: true }).press('Enter'),
        ]);
        await page.waitForURL(url => url.pathname.endsWith('/doctor/study-options'));
        const resultUrl = new URL(response.url());
        const fixtureKey = Object.keys(fixture.routes).find(key => {
          const url = new URL(key.split(' ')[1], origin);
          return key.startsWith('GET ') && url.pathname === '/api/v1/study-options/doctor' && url.search === resultUrl.search;
        });
        assert(fixtureKey, 'Missing fixture record for rendered Doctor college results');
        const results = fixture.routes[fixtureKey].data;
        assert.equal(results.status, 'available');
        const offerings = results.programmes.flatMap(programme => programme.offerings);
        const offering = offerings.find(row => row.offeringId === preview?.offeringId) ?? offerings[0];
        assert.equal(offering.match, 'direct');
        const programme = results.programmes.find(group => group.offerings.some(row => row.offeringId === offering.offeringId));
        assert.equal(programme.level, 'undergraduate');
        const group = page.getByRole('article').filter({ has: page.getByRole('heading', { level: 2, name: programme.title, exact: true }) });
        await group.getByText('Undergraduate', { exact: false }).first().waitFor();
        const anchor = 'study-offering-' + offering.offeringId;
        const result = page.locator('li[id="' + anchor + '"] a');
        await result.getByText(offering.institutionName, { exact: true }).waitFor();
        await result.scrollIntoViewIfNeeded();
        await capture(careerId, 'options', 'main h1');
        await result.press('Enter');
        await page.waitForURL(url => decodeURIComponent(url.pathname) === '/colleges/' + offering.institutionId && url.searchParams.get('offeringId') === offering.offeringId);
        await page.getByRole('heading', { level: 1, name: offering.institutionName, exact: true }).waitFor();
        const selected = page.getByRole('heading', { level: 3, name: offering.title, exact: true });
        await selected.waitFor();
        await selected.scrollIntoViewIfNeeded();
        await capture(careerId, 'college', 'main h1');
        await page.locator('main a[href*="/study-options?"]').first().press('Enter');
        await page.waitForFunction(id => location.hash === '#' + id && document.activeElement?.closest('li')?.id === id, anchor);
        await page.locator('main a[href*="from=dashboard#career-study"]').first().press('Enter');
        await page.locator('[data-career-tab="study"][aria-selected="true"]').waitFor();
        const medicine = { careerId, programme: offering.title, offeringId: offering.offeringId, institutionId: offering.institutionId, institutionName: offering.institutionName };
        if (manifest.medicine) assert.deepEqual(medicine, manifest.medicine);
        manifest.medicine = medicine;
        Object.assign(manifest.checks, { medicineOffering: true, medicineReturn: true });
      }
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
