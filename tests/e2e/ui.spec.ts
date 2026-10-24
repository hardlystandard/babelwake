import { expect, test } from '@playwright/test';
import type { Content, JournalPage } from '../../src/content/types';
import type { GameState } from '../../src/game/state';
interface DebugGame { content(): Promise<Content>; encounter(id: string): void; getState(): GameState; }
test('journal supports personal guesses, drag and click matching, and settings', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('/?debug=1');
  await page.waitForFunction(() => Boolean((window as unknown as { __BABELWAKE__?: unknown }).__BABELWAKE__));
  await page.getByTestId('start').click();
  const journalPage: JournalPage = await page.evaluate(async () => {
    const game = (window as unknown as { __BABELWAKE__: DebugGame }).__BABELWAKE__;
    const zone = (await game.content()).zones[0];
    for (const evidence of zone.evidence) game.encounter(evidence.id);
    return zone.pages[0];
  });
  await page.keyboard.press('Escape');
  await page.getByTestId('journal').click();
  await page.locator('[data-tab="words"]').click();
  await page.locator(`[data-word="${journalPage.words[0]}"]`).click();
  const expectedForm = await page.evaluate(async wordId => (await (window as unknown as { __BABELWAKE__: DebugGame }).__BABELWAKE__.content()).lexicon.find(word => word.id === wordId)?.forms[0] ?? wordId, journalPage.words[0]);
  await expect(page.locator('label[for="guess"]')).toHaveText(expectedForm);
  await page.getByTestId('guess-input').fill('my own hypothesis');
  await page.getByTestId('guess-input').press('Enter');
  await page.getByTestId('journal-search').fill('my own hypothesis');
  await expect(page.locator('.vocabulary-row')).toHaveCount(1);
  await page.locator('[data-tab="pages"]').click();
  await page.getByTestId(`journal-page-${journalPage.id}`).click();
  const first = journalPage.slots[0];
  await page.locator(`[data-tile="${first.answer}"]`).dragTo(page.locator(`[data-slot="${first.id}"]`));
  expect(await page.evaluate(id => (window as unknown as { __BABELWAKE__: DebugGame }).__BABELWAKE__.getState().confirmed.includes(id), journalPage.id)).toBe(false);
  for (const slot of journalPage.slots.slice(1)) {
    await page.locator(`[data-tile="${slot.answer}"]`).click();
    await page.locator(`[data-slot="${slot.id}"]`).click();
  }
  await expect(page.locator('.confirmed-seal')).toBeVisible();
  await expect(page.locator('.word-tile')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.locator('#menu').click();
  await page.getByTestId('settings-toggle').click();
  await page.locator('#contrast').check();
  await expect(page.locator('body')).toHaveClass(/high-contrast/);
  await page.getByTestId('settings-text-size').focus();
  await page.keyboard.press('ArrowRight');
  expect(await page.evaluate(() => (window as unknown as { __BABELWAKE__: DebugGame }).__BABELWAKE__.getState().settings.textSize)).toBeGreaterThan(1);
  expect(pageErrors).toEqual([]);
});
