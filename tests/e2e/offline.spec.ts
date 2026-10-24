import { expect, test } from '@playwright/test';
import type { Content } from '../../src/content/types';
test('installed game reloads and loads every zone offline', async ({ page, context }) => {
  test.skip(!process.env.BABELWAKE_PRODUCTION, 'Service workers are emitted only in production builds.');
  await page.goto('/?debug=1');
  await page.waitForFunction(() => Boolean((window as unknown as { __BABELWAKE__?: unknown }).__BABELWAKE__), undefined, { timeout: 20_000 });
  await page.getByTestId('start').click();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), undefined, { timeout: 30_000 });
  await context.setOffline(true);
  await page.reload();
  await page.waitForFunction(() => Boolean((window as unknown as { __BABELWAKE__?: unknown }).__BABELWAKE__), undefined, { timeout: 20_000 });
  await page.getByTestId('start').click();
  const zones = await page.evaluate(async () => {
    const game = (window as unknown as { __BABELWAKE__: { content(): Promise<Content> } }).__BABELWAKE__;
    return (await game.content()).zones.map(zone => ({ id: zone.id, evidence: zone.evidence.length }));
  });
  expect(zones).toHaveLength(6);
  expect(zones.every(zone => zone.evidence > 0)).toBe(true);
  await expect(page.locator('canvas')).toBeVisible();
});
