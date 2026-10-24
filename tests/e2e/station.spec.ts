import { expect, test } from '@playwright/test';
import type { Content } from '../../src/content/types';
import type { GameState } from '../../src/game/state';
interface ViewState { mode: 'top-down'; player: { x: number; z: number }; }
interface DebugGame { content(): Promise<Content>; encounter(id: string): void; getState(): GameState; view(): ViewState; }
interface TestWindow { __BABELWAKE__: DebugGame; __TEST_PAD_AXES__: number[]; __RESTORE_GAMEPADS__: () => void; }
test('top-down avatar supports keyboard, mouse and gamepad; station scenes reveal individually', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    const axes = [0, 0, 0, 0];
    const original = navigator.getGamepads.bind(navigator);
    const pad = { connected: true, index: 0, mapping: 'standard', axes, buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })) };
    Object.assign(window, { __TEST_PAD_AXES__: axes, __RESTORE_GAMEPADS__: () => Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: original }) });
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [pad] });
  });
  await page.goto('/?debug=1');
  await page.waitForFunction(() => Boolean((window as unknown as TestWindow).__BABELWAKE__));
  await page.getByTestId('start').click();
  await page.locator('#sound').click();
  await page.locator('#toast.visible').waitFor({ state: 'visible' });
  await expect(page.locator('canvas')).toHaveAttribute('data-view', 'top-down');
  await expect(page.locator('canvas')).toHaveAttribute('data-camera', 'orthographic');
  expect(await page.evaluate(() => (window as unknown as TestWindow).__BABELWAKE__.view().mode)).toBe('top-down');
  const worldImage = await page.locator('canvas').screenshot();
  expect(worldImage.byteLength).toBeGreaterThan(15_000);
  const position = () => page.evaluate(() => (window as unknown as TestWindow).__BABELWAKE__.view().player);
  const expectMovement = async (before: { x: number; z: number }) => {
    await expect.poll(async () => { const after = await position(); return Math.hypot(after.x - before.x, after.z - before.z); }).toBeGreaterThan(0.2);
  };
  const keyboardStart = await position();
  await page.keyboard.down('w');
  try { await expectMovement(keyboardStart); } finally { await page.keyboard.up('w'); }
  const gamepadStart = await position();
  await page.evaluate(() => { (window as unknown as TestWindow).__TEST_PAD_AXES__[0] = 0.9; });
  try { await expectMovement(gamepadStart); } finally {
    await page.evaluate(() => { const test = window as unknown as TestWindow; test.__TEST_PAD_AXES__.fill(0); test.__RESTORE_GAMEPADS__(); });
  }
  const mouseStart = await position();
  const canvas = await page.locator('canvas').boundingBox();
  if (!canvas) throw new Error('Missing game canvas');
  await page.locator('canvas').click({ position: { x: canvas.width / 2, y: canvas.height * 2 / 3 } });
  await expectMovement(mouseStart);
  const ids = await page.evaluate(async () => {
    const game = (window as unknown as TestWindow).__BABELWAKE__;
    const zone = (await game.content()).zones[0];
    const station = zone.evidence.find(evidence => evidence.station && zone.evidence.filter(other => other.station === evidence.station).length === 3)?.station;
    if (!station) throw new Error('No three-scene physical station');
    const ids = zone.evidence.filter(evidence => evidence.station === station).map(evidence => evidence.id);
    game.encounter(ids[0]);
    return ids;
  });
  const seenCount = () => page.evaluate(siblings => (window as unknown as TestWindow).__BABELWAKE__.getState().encountered.filter(id => siblings.includes(id)).length, ids);
  await expect(page.locator('.context-tabs [data-context]')).toHaveCount(3);
  expect(await seenCount()).toBe(1);
  await expect(page.locator('.context-tabs .current')).toHaveAttribute('data-context', ids[0]);
  await page.locator('#next-context').click();
  expect(await seenCount()).toBe(2);
  await expect(page.locator('.context-tabs .current')).toHaveAttribute('data-context', ids[1]);
  await page.locator('#next-context').click();
  expect(await seenCount()).toBe(3);
  await expect(page.locator('.context-tabs .current')).toHaveAttribute('data-context', ids[2]);
  await page.locator('#previous-context').click();
  expect(await seenCount()).toBe(3);
  await expect(page.locator('.context-tabs .current')).toHaveAttribute('data-context', ids[1]);
  expect(errors).toEqual([]);
});
