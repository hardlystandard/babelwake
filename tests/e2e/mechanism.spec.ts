import { expect, test } from '@playwright/test';
import type { Content, WorldAction } from '../../src/content/types';
import type { GameState } from '../../src/game/state';
import { inferAtelierActions } from './atelier-path';
import {actionKey,tokenOverlap} from '../../src/game/interactions';
interface DebugGame { content():Promise<Content>;encounter(id:string):void;confirm(pageId:string,assignments:Record<string,string>):void;getState():GameState;interact(id:string):void;interactions():{held:string|null;history:WorldAction[]};actions():WorldAction[];commit():boolean; }

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
    const candidates=await page.evaluate(id=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.actions().filter(candidate=>'target'in candidate?candidate.target===id:candidate.object===id),entity);
    const choice=candidates.findIndex(candidate=>actionKey(candidate)===actionKey(action));
    expect(choice).toBeGreaterThanOrEqual(0);
    // Entity callbacks are shared by mouse, keyboard and gamepad input. The
    // player then chooses an actual diagram button when a prop has alternatives.
    await page.evaluate(id=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.interact(id),entity);
    const afterFirst=await page.evaluate(()=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.interactions().history.length);
    if(afterFirst===index&&await page.locator('[data-physical-action]').count()===0)await page.evaluate(id=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.interact(id),entity);
    if(await page.locator('[data-physical-action]').count())await page.locator(`[data-physical-action="${choice}"]`).click();
    await expect.poll(()=>page.evaluate(()=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.interactions().history.length)).toBe(index+1);
    if(index<actions.length-1)expect(await page.evaluate(()=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.getState().solved)).toEqual([]);
  }
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.getState().solved)).toContain(zone.puzzle.id);
  await expect(page.locator('.evidence-panel,#mechanism,.puzzle-panel')).toHaveCount(0);
  await page.evaluate(id=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.interact(id),zone.puzzle.world!.exit!);
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.getState().zone)).toBe('marche');
});
