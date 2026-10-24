import { expect, test, type Page } from '@playwright/test';
import type { Content, ZoneId } from '../../src/content/types';
import type { GameState } from '../../src/game/state';
interface DebugGame {
  getState(): GameState;
  loadZone(id: ZoneId): Promise<void>;
  encounter(id: string): void;
  annotate(id: string, guess: string): void;
  confirm(pageId: string, assignments: Record<string, string>): void;
  solve(answers: string[]): Promise<void>;
  content(): Promise<Content>;
}
const order: ZoneId[] = ["atelier", "marche", "cafe"];
async function start(page: Page) {
  await page.goto('/?debug=1');
  await page.waitForFunction(() => Boolean((window as unknown as { __BABELWAKE__?: unknown }).__BABELWAKE__));
  await page.getByTestId('start').click();
  await page.locator('#sound').click();
}
async function solveZone(page: Page, id: ZoneId) {
  return page.evaluate(async zoneId => {
    const game = (window as unknown as { __BABELWAKE__: DebugGame }).__BABELWAKE__;
    await game.loadZone(zoneId);
    const content = await game.content();
    const zone = content.zones.find(candidate => candidate.id === zoneId)!;
    for (const evidence of zone.evidence) game.encounter(evidence.id);
    const problems: string[] = [];
    for (const journalPage of zone.pages) {
      for (const word of journalPage.words) {
        const evidence = zone.evidence.filter(context => context.words.includes(word));
        if (new Set(evidence.map(context => context.id)).size < 3) problems.push(`${word}: insufficient contexts`);
        if (new Set(evidence.map(context => JSON.stringify(context.picture))).size < 2) problems.push(`${word}: indistinguishable pictures`);
      }
      const assignments = Object.fromEntries(journalPage.slots.map(slot => [slot.id, slot.answer]));
      game.confirm(journalPage.id, assignments);
      if (!game.getState().confirmed.includes(journalPage.id)) problems.push(`${journalPage.id}: confirmation failed`);
    }
    await game.solve(zone.puzzle.steps.map(step => step.answer));
    return { problems, solved: game.getState().solved.includes(zone.puzzle.id), pageCount: zone.pages.length, choices: zone.puzzle.steps.reduce((n, step) => n * step.choices.length, 1) };
  }, id);
}
for (const [index, id] of order.entries()) {
  test(`${id}: evidence, pages, and applied sequence are reachable`, async ({ page }) => {
    await start(page);
    for (const required of order.slice(0, index)) expect((await solveZone(page, required)).solved).toBe(true);
    if (id === 'gare') {
      await page.evaluate(async () => {
        const game = (window as unknown as { __BABELWAKE__: DebugGame }).__BABELWAKE__;
        await game.loadZone('gare');
        const zone = (await game.content()).zones.find(candidate => candidate.id === 'gare')!;
        for (const evidence of zone.evidence) game.encounter(evidence.id);
      });
      await page.keyboard.press('Escape');
      await page.getByTestId('journal').click();
      await page.getByTestId('journal-page-gare-aller').click();
      await expect(page.locator('[data-tile]')).toHaveText(['vais', 'vas', 'allons', 'allez']);
    }
    const result = await solveZone(page, id);
    expect(result.problems).toEqual([]);
    expect(result.solved).toBe(true);
    expect(result.pageCount).toBeGreaterThan(0);
    expect(result.choices).toBeGreaterThanOrEqual(4096);
  });
}
test('incomplete and incorrect pages preserve state, annotations persist', async ({ page }) => {
  await start(page);
  const result = await page.evaluate(async () => {
    const game = (window as unknown as { __BABELWAKE__: DebugGame }).__BABELWAKE__;
    const zone = (await game.content()).zones[0];
    const journalPage = zone.pages[0];
    game.confirm(journalPage.id, Object.fromEntries(journalPage.slots.map(slot => [slot.id, slot.answer])));
    const unseenLocked = !game.getState().confirmed.includes(journalPage.id);
    for (const evidence of zone.evidence) game.encounter(evidence.id);
    game.confirm(journalPage.id, { [journalPage.slots[0].id]: journalPage.slots[0].answer });
    const incompleteLocked = !game.getState().confirmed.includes(journalPage.id);
    game.confirm(journalPage.id, Object.fromEntries(journalPage.slots.map(slot => [slot.id, 'incorrect-personal-guess'])));
    const wrongLocked = !game.getState().confirmed.includes(journalPage.id);
    game.annotate(journalPage.words[0], 'my own note');
    return { unseenLocked, incompleteLocked, wrongLocked, word: journalPage.words[0], guess: game.getState().guesses[journalPage.words[0]] };
  });
  expect(result).toMatchObject({ unseenLocked: true, incompleteLocked: true, wrongLocked: true, guess: 'my own note' });
  await expect.poll(async () => page.evaluate(word => new Promise<string | undefined>(resolve => {
    const request = indexedDB.open('babelwake', 1);
    request.onerror = () => resolve(undefined);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('saves')) { db.close(); resolve(undefined); return; }
      const get = db.transaction('saves', 'readonly').objectStore('saves').get('journey');
      get.onsuccess = () => { db.close(); resolve((get.result as GameState | undefined)?.guesses[word]); };
      get.onerror = () => { db.close(); resolve(undefined); };
    };
  }), result.word)).toBe('my own note');
  await page.reload();
  await page.getByTestId('start').click();
  await expect.poll(async () => page.evaluate(word => (window as unknown as { __BABELWAKE__: DebugGame }).__BABELWAKE__.getState().guesses[word], result.word)).toBe('my own note');
});
test('normal builds do not expose debug controls', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start').click();
  expect(await page.evaluate(() => '__BABELWAKE__' in window)).toBe(false);
});
