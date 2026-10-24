import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
await mkdir('artifacts', { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.BABELWAKE_PREVIEW ?? 'http://127.0.0.1:4173/?debug=1');
  await page.waitForFunction(() => Boolean(window.__BABELWAKE__));
  await page.screenshot({ animations: 'disabled', path: 'artifacts/title.png' });
  await page.getByTestId('start').click();
  await page.locator('#toast.visible').waitFor({ state: 'visible', timeout: 20000 });
  await page.screenshot({ animations: 'disabled', path: 'artifacts/world.png' });
  await page.evaluate(async () => {
    const zone = (await window.__BABELWAKE__.content()).zones[0];
    window.__BABELWAKE__.encounter(zone.evidence[0].id);
  });
  await page.locator('.evidence-panel').waitFor({ state: 'visible' });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ animations: 'disabled', path: 'artifacts/evidence.png' });
  const pageId = await page.evaluate(async () => {
    const zone = (await window.__BABELWAKE__.content()).zones[0];
    for (const evidence of zone.evidence) window.__BABELWAKE__.encounter(evidence.id);
    return zone.pages[0].id;
  });
  await page.keyboard.press('Escape');
  await page.getByTestId('journal').click();
  await page.getByTestId(`journal-page-${pageId}`).click();
  await page.locator('.matching-slots').waitFor({ state: 'visible' });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ animations: 'disabled', path: 'artifacts/journal.png' });
  await page.evaluate(async () => {
    const zone = (await window.__BABELWAKE__.content()).zones[0];
    const first = zone.evidence.find(e => e.station && zone.evidence.filter(other => other.station === e.station).length === 3);
    if (!first) throw new Error('No three-scene station');
    window.__BABELWAKE__.encounter(first.id);
  });
  await page.locator('.context-tabs [data-context]').first().waitFor({ state: 'visible' });
  await page.locator('#next-context').click();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ animations: 'disabled', path: 'artifacts/station.png' });
  await page.close();
  const tabletContext = await browser.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true, deviceScaleFactor: 1 });
  const tablet = await tabletContext.newPage();
  tablet.on('pageerror', error => errors.push(`Tablet: ${error.message}`));
  await tablet.goto(process.env.BABELWAKE_PREVIEW ?? 'http://127.0.0.1:4173/?debug=1');
  await tablet.waitForFunction(() => Boolean(window.__BABELWAKE__));
  await tablet.getByTestId('start').click();
  await tablet.locator('#sound').click();
  await tablet.locator('#toast.visible').waitFor({ state: 'visible' });
  const tabletImage = await tablet.locator('canvas').screenshot({ animations: 'disabled', path: 'artifacts/tablet-world.png' });
  if (tabletImage.byteLength < 15000) throw new Error('Tablet canvas appears empty');
  await tablet.getByTestId('journal').click();
  await tablet.locator('.journal-panel').waitFor({ state: 'visible' });
  await tablet.screenshot({ animations: 'disabled', path: 'artifacts/tablet-journal.png' });
  await tablet.keyboard.press('Escape');
  await tablet.evaluate(async () => {
    const zone = (await window.__BABELWAKE__.content()).zones[0];
    window.__BABELWAKE__.encounter(zone.evidence[0].id);
  });
  await tablet.locator('.evidence-panel').waitFor({ state: 'visible' });
  await tabletContext.close();
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('Captured title, world, evidence, journal, station, tablet world/journal. Tablet start, journal and evidence pass. No browser page errors.');
} finally { await browser.close(); }
