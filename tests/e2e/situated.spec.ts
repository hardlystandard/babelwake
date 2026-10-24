import {expect,test} from '@playwright/test';
import type {Content} from '../../src/content/types';
import type {GameState} from '../../src/game/state';
import {frenchFormOccurs} from '../../src/content/forms';
interface DebugGame {content():Promise<Content>;encounter(id:string):void;getState():GameState;interactions():unknown;view():{zoom:number;focused:boolean;player:{x:number;z:number}};}

test('physical French and personal subscripts remain readable at default zoom',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/?debug=1');await page.getByTestId('start').click();
  await expect(page.locator('.world-labels')).toHaveCSS('visibility','visible');
  const before=await page.evaluate(()=>{const game=(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__;return{physical:game.interactions(),player:game.view().player};});
  const word=page.locator('.situated-text [data-word="clé"]:visible').first();
  await expect(word).toBeVisible();await word.click();
  await page.getByTestId('guess-input').fill('key?');await page.getByTestId('guess-input').press('Enter');
  await page.locator('#leave-focus').click();
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.view().zoom)).toBeCloseTo(1,2);
  const notes=page.locator('.situated-text [data-word="clé"] small:visible');
  await expect.poll(()=>notes.count()).toBeGreaterThan(0);
  await expect(notes.first()).toHaveText('key?');
  expect(await page.evaluate(()=>{const game=(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__;return{physical:game.interactions(),player:game.view().player};})).toEqual(before);
  const metrics=await notes.first().evaluate(note=>({size:parseFloat(getComputedStyle(note).fontSize),ink:getComputedStyle(note).color,paper:getComputedStyle(note).backgroundColor,word:parseFloat(getComputedStyle(note.parentElement!).fontSize)}));
  expect(metrics.size).toBeGreaterThanOrEqual(12);expect(metrics.word).toBeGreaterThanOrEqual(18);
  expect(metrics.ink).toBe('rgb(37, 60, 49)');expect(metrics.paper).toBe('rgb(222, 209, 178)');
  await expect(page.locator('.evidence-panel,.world-label,.context-tabs')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('grammar matching chrome supplies no answer forms or blanks',async({page})=>{
  await page.goto('/?debug=1');await page.getByTestId('start').click();
  await expect(page.locator('.world-labels')).toHaveCSS('visibility','visible');
  const {p,words}=await page.evaluate(async()=>{
    const game=(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__;
    const c=await game.content(),zone=c.zones[0];
    for(const id of zone.encounterOrder??[])game.encounter(id);
    const p=zone.pages.find(p=>p.words.includes('les'))!;
    return{p,words:c.lexicon.filter(w=>p.words.includes(w.id))};
  });
  await page.getByTestId('journal').click();await page.getByTestId(`journal-page-${p.id}`).click();
  await expect(page.locator('.journal-tabs')).toBeHidden();
  const labels=(await page.locator('.journal-panel>.panel-header,.matching-heading,#back-pages').allTextContents()).join(' ');
  for(const word of words)for(const form of word.forms)expect(frenchFormOccurs(labels,form)).toBe(false);
  expect(labels).not.toMatch(/_{2,}/u);
  await expect(page.locator('.journal-panel')).toHaveAttribute('aria-label','▤');
  await expect(page.locator('.panel-header [data-close]')).toHaveAttribute('aria-label','×');
});

test('an old save keeps notes and onward travel without confirming the revised atelier',async({page})=>{
  await page.goto('/?debug=1');await page.getByTestId('start').click();
  await expect(page.locator('.world-labels')).toHaveCSS('visibility','visible');
  const old=await page.evaluate(()=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.getState());
  old.solved=['atelier-sortie'];old.confirmed=['atelier-objets'];old.guesses={'clé':'old personal note'};
  await page.locator('#menu').click();
  await page.locator('#import').setInputFiles({name:'old-babelwake.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(old))});
  await expect(page.locator('#overlay')).toBeHidden();
  await expect(page.locator('#page-count')).toHaveText('0/8');
  expect(await page.evaluate(()=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.getState().guesses['clé'])).toBe('old personal note');
  await page.getByTestId('journal').click();
  await expect(page.locator('.journal-intro>span')).toHaveText('0 / 8');
  await page.keyboard.press('Escape');await page.locator('#route').click();
  await expect(page.locator('[data-route="marche"]')).toBeEnabled();
  await page.locator('[data-route="marche"]').click();
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.getState().zone)).toBe('marche');
});
