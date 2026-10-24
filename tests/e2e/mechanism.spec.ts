import { expect, test } from '@playwright/test';
import {zoneIds} from '../../src/content';
import type { Content, Puzzle } from '../../src/content/types';
import type { GameState } from '../../src/game/state';
interface DebugGame { content(): Promise<Content>; encounter(id: string): void; confirm(pageId: string, assignments: Record<string, string>): void; getState(): GameState; }
test('atelier mechanism can be operated in the world and opens the market', async ({ page }) => {
  await page.goto('/?debug=1');
  await page.waitForFunction(() => Boolean((window as unknown as { __BABELWAKE__?: unknown }).__BABELWAKE__));
  await page.getByTestId('start').click();
  const puzzle: Puzzle = await page.evaluate(async () => {
    const game = (window as unknown as { __BABELWAKE__: DebugGame }).__BABELWAKE__;
    const zone = (await game.content()).zones[0];
    for (const evidence of zone.evidence) game.encounter(evidence.id);
    for (const journalPage of zone.pages) game.confirm(journalPage.id, Object.fromEntries(journalPage.slots.map(slot => [slot.id, slot.answer])));
    return zone.puzzle;
  });
  await page.keyboard.press('Escape');
  await page.locator('#puzzle').click();
  await page.locator('#begin-mechanism').click();
  await expect(page.locator('#apply-mechanism')).toBeDisabled();
  for (const [stepIndex, step] of puzzle.steps.entries()) {
    await expect(page.locator('#mechanism .eyebrow')).toContainText(`${stepIndex + 1} / ${puzzle.steps.length}`);
    const choiceIndex = step.choices.indexOf(step.answer);
    await page.locator(`[data-evidence="__action:${choiceIndex}"] [data-inspect]`).click();
  }
  await expect(page.locator('#apply-mechanism')).toBeEnabled();
  expect(await page.evaluate(() => (window as unknown as { __BABELWAKE__: DebugGame }).__BABELWAKE__.getState().solved)).toEqual([]);
  await page.locator('#apply-mechanism').click();
  await expect(page.locator('#next-zone')).toBeVisible();
  await page.locator('#next-zone').click();
  if(zoneIds.length>1)await expect.poll(async () => page.evaluate(() => (window as unknown as { __BABELWAKE__: DebugGame }).__BABELWAKE__.getState().zone)).toBe('marche');else await expect(page.locator('.ending-panel')).toBeVisible();
});
