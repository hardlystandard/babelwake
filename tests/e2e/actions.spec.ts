import { expect, test, type Page } from '@playwright/test';
import type { Content, WorldAction, ZoneId } from '../../src/content/types';
import type { GameState } from '../../src/game/state';
import { actionKey } from '../../src/game/interactions';
import { inferLettresActions } from './lettres-path';

interface DebugGame {
  content():Promise<Content>;getState():GameState;loadZone(id:ZoneId):Promise<void>;
  encounter(id:string):void;confirm(id:string,assignments:Record<string,string>):boolean;
  actions():WorldAction[];interact(id:string):void;act(action:WorldAction):boolean;
  interactions():{held:string|null;history:WorldAction[];opened:string[];placements:Record<string,{target:string;relation:string}>};
}
async function start(page:Page):Promise<void> {
  await page.goto('/?debug=1');
  await page.getByTestId('start').click();
  await expect(page.locator('.world-labels')).toHaveCSS('visibility','visible');
}
/** Reach a chosen affordance through the regular entity callback and buttons,
 * without using debug.act to perform it. */
async function choose(page:Page,action:WorldAction,input:'mouse'|'keyboard'|'gamepad'='mouse'):Promise<void> {
  const id='target'in action?action.target:action.object;
  const {candidates,before}=await page.evaluate(id=>{
    const game=(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__;
    return {candidates:game.actions().filter(candidate=>'target'in candidate?candidate.target===id:candidate.object===id),before:game.interactions().history.length};
  },id);
  const index=candidates.findIndex(candidate=>actionKey(candidate)===actionKey(action));
  expect(index).toBeGreaterThanOrEqual(0);
  await page.evaluate(id=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.interact(id),id);
  if(await page.locator('[data-physical-action]').count()===0&&await page.evaluate(()=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.interactions().history.length)===before){
    await page.evaluate(id=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.interact(id),id);
  }
  const options=page.locator('[data-physical-action]');
  if(await options.count()){
    await expect(options).toHaveCount(candidates.length);
    const button=page.locator(`[data-physical-action="${index}"]`);
    // The panel sets initial focus on the next animation frame. Let that finish
    // before keyboard/gamepad input chooses a different control.
    if(input!=='mouse')await expect(page.locator('.physical-action-panel .close')).toBeFocused();
    if(input==='keyboard'){await button.focus();await page.keyboard.press('Enter');}
    else if(input==='gamepad'){
      await page.evaluate(()=>{
        const pad={axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false}))};
        Object.assign(window,{__ACTION_PAD__:pad});
        Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[pad]});
      });
      for(let n=0;n<=index;n++){
        // Release in the browser's focus event. Holding DOWN while Playwright
        // polls across process boundaries can repeat past an observed option.
        await options.nth(n).evaluate(element=>new Promise<void>((resolve,reject)=>{
          const pad=(window as unknown as {__ACTION_PAD__:{buttons:{pressed:boolean}[]}}).__ACTION_PAD__;
          const finish=()=>{pad.buttons[13].pressed=false;clearTimeout(timeout);resolve();};
          const timeout=setTimeout(()=>{pad.buttons[13].pressed=false;element.removeEventListener('focus',finish);reject(new Error('Gamepad did not focus the next action'));},10_000);
          element.addEventListener('focus',finish,{once:true});
          pad.buttons[13].pressed=true;
        }));
        // Assert only after the synthetic input is neutral, so this stays true
        // even if the driver takes longer than the menu's held-repeat interval.
        await expect(options.nth(n)).toBeFocused();
      }
      await page.evaluate(()=>{(window as unknown as {__ACTION_PAD__:{buttons:{pressed:boolean}[]}}).__ACTION_PAD__.buttons[0].pressed=true;});
      await expect(page.locator('.physical-action-panel')).toHaveCount(0);
      await page.evaluate(()=>{Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[]});});
    }else await button.click();
  }
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.interactions().history.length)).toBe(before+1);
  const actual=await page.evaluate(()=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.interactions().history.at(-1)!);
  expect(actionKey(actual)).toBe(actionKey(action));
}

test('all placement relations on one prop are available through diagram buttons',async({page})=>{
  await start(page);
  for(const relation of ['on','under','in'] as const){
    await choose(page,{kind:'take',object:'key-y'});
    await choose(page,{kind:'place',object:'key-y',target:'box-r',relation},relation==='under'?'keyboard':relation==='in'?'gamepad':'mouse');
    expect(await page.evaluate(()=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.interactions().placements['key-y'])).toEqual({target:'box-r',relation});
  }
  expect(await page.evaluate(()=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.getState().solved)).toEqual([]);
});

test('labelled containers expose open and close through normal interaction',async({page})=>{
  await start(page);
  await choose(page,{kind:'operate',object:'box-r',operation:'close'},'keyboard');
  expect(await page.evaluate(()=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.interactions().opened)).not.toContain('box-r');
  await choose(page,{kind:'operate',object:'box-r',operation:'open'});
  expect(await page.evaluate(()=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.interactions().opened)).toContain('box-r');
  await expect(page.locator('.evidence-panel,#mechanism,.puzzle-panel')).toHaveCount(0);
});

test('all six completed physical chapters lead to the final ending',async({page})=>{
  await start(page);
  // This is a release smoke test using authored solutions, not a claim of
  // independent inference. The separate golden paths inspect clue semantics.
  const complete=await page.evaluate(async()=>{
    const game=(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__;
    const content=await game.content();
    for(const zone of content.zones){
      await game.loadZone(zone.id);
      for(const id of zone.encounterOrder??[])game.encounter(id);
      for(const p of zone.pages)if(!game.confirm(p.id,Object.fromEntries(p.slots.map(slot=>[slot.id,slot.answer]))))throw Error(`Page failed: ${p.id}`);
      if(!zone.puzzle.world?.exit)throw Error(`Missing physical exit: ${zone.id}`);
      for(const action of zone.puzzle.world.sequence)if(!game.act(action))throw Error(`Unavailable action in ${zone.id}`);
      if(!game.getState().solved.includes(zone.puzzle.id))throw Error(`Unsolved chapter: ${zone.id}`);
    }
    const final=content.zones.at(-1)!;
    game.interact(final.puzzle.world!.exit!);
    return game.getState().solved.length;
  });
  expect(complete).toBe(6);
  await expect(page.locator('.ending-panel')).toBeVisible();
  await expect(page.locator('.ending-panel h2')).toHaveText('Le fil retrouvé');
  await page.locator('#ending-route').click();
  await expect(page.locator('.route-item:disabled')).toHaveCount(0);
});

test('dated correspondence can be assembled and delivered through physical choices',async({page})=>{
  await start(page);
  const zone=await page.evaluate(async()=>{
    const game=(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__;
    const content=await game.content();
    // Earlier chapters are fixture preparation, not part of this UI inference
    // test. Les lettres below is solved from the papers and visible scene.
    for(const place of content.zones){
      await game.loadZone(place.id);
      for(const id of place.encounterOrder??[])game.encounter(id);
      for(const p of place.pages)if(!game.confirm(p.id,Object.fromEntries(p.slots.map(slot=>[slot.id,slot.answer]))))throw Error(`Fixture page failed: ${p.id}`);
      if(place.id==='lettres')return place;
      for(const action of place.puzzle.world!.sequence)if(!game.act(action))throw Error(`Fixture action failed: ${place.id}`);
    }
    throw Error('Missing final chapter');
  });
  const inferred=inferLettresActions(zone);
  for(const action of inferred)await choose(page,action);
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.getState().solved)).toContain(zone.puzzle.id);
  await expect(page.locator('.evidence-panel,#mechanism,.puzzle-panel')).toHaveCount(0);
  await page.evaluate(id=>(window as unknown as {__BABELWAKE__:DebugGame}).__BABELWAKE__.interact(id),zone.puzzle.world!.exit!);
  await expect(page.locator('.ending-panel')).toBeVisible();
});
