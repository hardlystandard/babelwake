import { expect, type Page } from '@playwright/test';
import type { WorldAction } from '../../src/content/types';
import { actionKey } from '../../src/game/interactions';
interface PhysicalGame {actions():WorldAction[];interactions():{history:WorldAction[]};interact(id:string):void;}
declare global { interface Window {__BABELWAKE__:PhysicalGame;} }

/** Use the same entity callback as mouse/keyboard/gamepad and the actual
 * rendered action buttons. Debug is used to observe, never to apply actions. */
export async function playPhysicalActions(page:Page,actions:WorldAction[]):Promise<number>{
 let combinations=1;
 for(const action of actions){
  const id='target'in action?action.target:action.object;
  const before=await page.evaluate(id=>{
   const game=window.__BABELWAKE__;
   const all=game.actions() as WorldAction[];
   return {history:game.interactions().history.length,candidates:all.filter(candidate=>'target'in candidate?candidate.target===id:candidate.object===id)};
  },id);
  // Count all alternatives of this action's type, not just this target's menu.
  combinations*=await page.evaluate(kind=>window.__BABELWAKE__.actions().filter((candidate:WorldAction)=>candidate.kind===kind).length,action.kind);
  const index=before.candidates.findIndex(candidate=>actionKey(candidate)===actionKey(action));
  expect(index,`unavailable physical action ${actionKey(action)}`).toBeGreaterThanOrEqual(0);
  await page.evaluate(id=>window.__BABELWAKE__.interact(id),id);
  if(!await page.locator('[data-physical-action]').count()&&await page.evaluate(()=>window.__BABELWAKE__.interactions().history.length)===before.history)
   await page.evaluate(id=>window.__BABELWAKE__.interact(id),id);
  if(await page.locator('[data-physical-action]').count())await page.locator(`[data-physical-action="${index}"]`).click();
  await expect.poll(()=>page.evaluate(()=>window.__BABELWAKE__.interactions().history.length)).toBe(before.history+1);
  expect(actionKey(await page.evaluate(()=>window.__BABELWAKE__.interactions().history.at(-1)!))).toBe(actionKey(action));
 }
 return combinations;
}
