import { expect, test } from '@playwright/test';
import type { Content, WorldAction } from '../../src/content/types';
import type { GameState } from '../../src/game/state';
import { inferAtelierActions } from './atelier-path';
import {tokenOverlap} from '../../src/game/interactions';
interface DebugGame { content():Promise<Content>;encounter(id:string):void;confirm(pageId:string,assignments:Record<string,string>):void;getState():GameState;interact(id:string):void;interactions():{held:string|null;history:WorldAction[]};commit():boolean; }

test('atelier physical objects can be used, placed and delivered without a quiz panel',async({page})=>{
  await page.goto('/?debug=1');
  await page.getByTestId('start').click();
  await expect(page.locator('.world-labels')).toHaveCSS('visibility','visible');
  const zone=await page.evaluate(async()=>{
    const game=(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__;
    const zone=(await game.content()).zones[0];
    for(const id of zone.encounterOrder??[])game.encounter(id);
    for(const p of zone.pages)game.confirm(p.id,Object.fromEntries(p.slots.map(s=>[s.id,s.answer])));
    return zone;
  });
  const actions=inferAtelierActions(zone);
  await expect(page.locator('.evidence-panel,#mechanism,.puzzle-panel')).toHaveCount(0);
  for(const [index,action]of actions.entries()){
    const entity='target'in action?action.target:action.object;
    if(index===actions.length-1){
      await page.locator('[data-talk="paul"]').click();
      const clue=zone.evidence.find(e=>e.id===zone.puzzle.world!.clues[index])!;
      await expect(page.locator(`.situated-speech[data-evidence="${clue.id}"]`)).toBeVisible();
      expect(await page.evaluate(()=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.interactions().held)).toBe(action.object);
      const scores=[];
      for(const actor of zone.scene!.filter(o=>o.recipient)){
        const visible=(await page.locator(`.situated-text[data-anchor="${actor.id}"]:visible .situated-words`).allTextContents()).join(' ');
        scores.push({id:actor.id,score:tokenOverlap(clue.text,visible)});
      }
      const best=Math.max(...scores.map(s=>s.score));
      expect(scores.filter(s=>s.score===best).map(s=>s.id)).not.toContain(entity);
    }
    // The same entity callback used by mouse, keyboard and gamepad input.
    await page.evaluate(id=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.interact(id),entity);
    if(index!==actions.length-1)await page.evaluate(id=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.interact(id),entity);
    await expect.poll(()=>page.evaluate(()=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.interactions().history.length)).toBe(index+1);
    if(index<actions.length-1)expect(await page.evaluate(()=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.getState().solved)).toEqual([]);
  }
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.getState().solved)).toContain(zone.puzzle.id);
  await expect(page.locator('.evidence-panel,#mechanism,.puzzle-panel')).toHaveCount(0);
  await page.evaluate(id=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.interact(id),zone.puzzle.world!.exit!);
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.getState().zone)).toBe('marche');
});
