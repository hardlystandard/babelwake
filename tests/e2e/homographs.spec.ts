import {expect,test} from '@playwright/test';
import type {GameState} from '../../src/game/state';
interface DebugGame{getState():GameState;loadZone(id:'cafe'):Promise<void>;encounter(id:string):void;}

test('door and carrying homographs retain separate notes after annotation refreshes',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?debug=1');await page.getByTestId('start').click();
 await expect(page.locator('.world-labels')).toHaveCSS('visibility','visible');
 const save=await page.evaluate(()=>(window as unknown as{__BABELWAKE__:DebugGame}).__BABELWAKE__.getState());
 // Importing prior chapter completion is fixture preparation, then annotations
 // use the actual word-entry UI and trigger the normal HUD renderer refresh.
 save.solved=['atelier-sortie','marche-panier'];
 await page.locator('#menu').click();
 await page.locator('#import').setInputFiles({name:'homograph-fixture.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(save))});
 await expect(page.locator('#overlay')).toBeHidden();
 await page.evaluate(async()=>(window as unknown as{__BABELWAKE__:DebugGame}).__BABELWAKE__.loadZone('cafe'));
 const focus=async(id:string)=>page.evaluate(id=>(window as unknown as{__BABELWAKE__:DebugGame}).__BABELWAKE__.encounter(id),id);
 const context=(id:string)=>page.locator(`.situated-text[data-evidence="${id}"]`);
 const annotate=async(id:string,word:string,guess:string)=>{
  await focus(id);const target=context(id).locator(`[data-word="${word}"]`);
  await expect(target).toBeVisible();await target.click();
  await page.getByTestId('guess-input').fill(guess);await page.getByTestId('guess-input').press('Enter');
  await expect(page.locator('#word-entry')).toHaveCount(0);
 };
 await focus('cafe-v2-e-carry-0');
 await expect(context('cafe-v2-e-carry-0').locator('[data-word="porter"]')).toHaveText('porte');
 await annotate('cafe-v2-e-fixture-door','porte','door?');
 await focus('cafe-v2-e-carry-0');
 await expect(context('cafe-v2-e-carry-0').locator('[data-word="porter"]')).toHaveText('porte');
 await expect(context('cafe-v2-e-carry-0').locator('[data-word="porte"]')).toHaveCount(0);
 await annotate('cafe-v2-e-carry-0','porter','carry?');
 for(const [id,form]of [['cafe-v2-e-carry-0','porte'],['cafe-v2-e-well-0','portes'],['cafe-v2-e-well-1','portez']]as const){
  await focus(id);const word=context(id).locator('[data-word="porter"]');
  await expect(word).toContainText(form);await expect(word.locator('small')).toHaveText('carry?');
 }
 await focus('cafe-v2-e-fixture-door');
 await expect(context('cafe-v2-e-fixture-door').locator('[data-word="porte"] small')).toHaveText('door?');
 expect(await page.evaluate(()=>(window as unknown as{__BABELWAKE__:DebugGame}).__BABELWAKE__.getState().guesses)).toMatchObject({porte:'door?',porter:'carry?'});
 expect(errors).toEqual([]);
});
