import { expect, test, type Page } from '@playwright/test';
import type { Content, WorldAction, Zone, ZoneId } from '../../src/content/types';
import type { GameState } from '../../src/game/state';
import { inferCafeActions } from './cafe-path';
import { inferGareActions } from './gare-path';

type Vector = [number,number,number];
interface RenderedObject {
  id:string;kind:string;position:Vector;visible:boolean;pieces:number;meshes:number;
  bounds:{min:Vector;max:Vector};hinge?:Vector;
}
interface RenderGame {
  content():Promise<Content>;getState():GameState;encounter(id:string):void;
  act(action:WorldAction):boolean;physicalState():RenderedObject[];
  view():{player:{x:number;z:number};focused:boolean};
}
type RenderWindow = {__BABELWAKE__:RenderGame};
const distance=(a:Vector,b:Vector)=>Math.hypot(...a.map((n,i)=>n-b[i]));
const object=(objects:RenderedObject[],id:string):RenderedObject=>{
  const found=objects.find(entry=>entry.id===id);if(!found)throw Error(`Missing rendered object ${id}`);return found;
};
const state=(page:Page)=>page.evaluate(()=>(window as unknown as RenderWindow).__BABELWAKE__.physicalState());
async function importZone(page:Page,id:ZoneId,touch=false):Promise<Zone>{
  await page.goto('/?debug=1');
  await page.waitForFunction(()=>Boolean((window as unknown as RenderWindow).__BABELWAKE__));
  if(touch)await page.getByTestId('start').tap();else await page.getByTestId('start').click();
  await expect(page.locator('.world-labels')).toHaveCSS('visibility','visible');
  const save=await page.evaluate(()=>(window as unknown as RenderWindow).__BABELWAKE__.getState());
  save.zone=id;save.settings.volume=0;
  // A real supported save import sets up the scene; progression inference has
  // separate end-to-end coverage and is not claimed by this render regression.
  if(touch)await page.locator('#menu').tap();else await page.locator('#menu').click();
  await page.locator('#import').setInputFiles({name:'render-scene.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(save))});
  await expect(page.locator('#overlay')).toBeHidden();
  await expect.poll(()=>page.evaluate(()=>(window as unknown as RenderWindow).__BABELWAKE__.getState().zone)).toBe(id);
  await expect.poll(async()=>(await state(page)).length).toBeGreaterThan(0);
  return page.evaluate(async id=>(await(window as unknown as RenderWindow).__BABELWAKE__.content()).zones.find(zone=>zone.id===id)!,id);
}
async function apply(page:Page,actions:WorldAction[]):Promise<void>{
  await page.evaluate(actions=>{
    const game=(window as unknown as RenderWindow).__BABELWAKE__;
    for(const action of actions)if(!game.act(action))throw Error(`Unavailable inferred action ${JSON.stringify(action)}`);
  },actions);
}
function separateFootprints(a:RenderedObject,b:RenderedObject):boolean{
  // Contents resting on one tray must have separate horizontal silhouettes,
  // rather than merely different centers or vertically overlapping meshes.
  return [0,2].some(axis=>a.bounds.max[axis]+.01<=b.bounds.min[axis]||b.bounds.max[axis]+.01<=a.bounds.min[axis]);
}

test('market quantities generate complete food groups and physical money denominations',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  const zone=await importZone(page,'marche'),rendered=await state(page);
  for(const kind of ['apple','egg']){
    const groups=zone.scene!.filter(item=>item.kind===kind&&item.quantity!==undefined&&item.quantity>=2&&item.quantity<=20);
    expect(groups.length,`real ${kind} quantity groups`).toBeGreaterThanOrEqual(3);
    const meshCounts=new Set<number>();
    for(const group of groups){
      const actual=object(rendered,group.id),count=group.quantity!;
      expect(actual.visible).toBe(true);
      expect(actual.pieces,`${group.id} rendered pieces`).toBe(count);
      // Traverse-counted Mesh instances catch a renderer that only changes a
      // numeric quantity tag while leaving one visual unit on the counter.
      expect(actual.meshes,`${group.id} actual scene meshes`).toBeGreaterThanOrEqual(count);
      expect(actual.meshes%count).toBe(0);
      meshCounts.add(actual.meshes);
      expect(actual.bounds.max[0]-actual.bounds.min[0]).toBeGreaterThan(.15);
      expect(actual.bounds.max[2]-actual.bounds.min[2]).toBeGreaterThan(.15);
    }
    expect(meshCounts.size,`${kind} geometry grows with quantity`).toBeGreaterThanOrEqual(3);
  }
  // Arithmetic expectations are independent of the renderer's denomination
  // algorithm: 21 = 20+1, 80 = 4×20, and 90 = 4×20+10.
  for(const [value,pieces,style]of [[21,2,'standard'],[80,4,'twenties'],[90,5,'twenties']] as const){
    const cash=zone.scene!.find(item=>item.kind==='money'&&item.value===value&&item.detail===style);
    if(!cash)throw Error(`Missing ${value} euro denomination evidence`);
    const actual=object(rendered,cash.id);
    expect(actual.visible).toBe(true);expect(actual.pieces).toBe(pieces);
    expect(actual.meshes).toBeGreaterThanOrEqual(pieces*2);
    expect(actual.bounds.max[0]-actual.bounds.min[0]).toBeGreaterThan(.5);
  }
  expect(errors).toEqual([]);
});

test('a focused household word stays clickable beside nearby conversation controls',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await importZone(page,'maison');
  await page.evaluate(()=>(window as unknown as RenderWindow).__BABELWAKE__.encounter('maison-v2-e-label-letter-a'));
  const word=page.locator('[data-evidence="maison-v2-e-label-letter-a"] [data-word="lettre"]');
  await expect(word).toBeVisible();
  await expect.poll(()=>word.evaluate(element=>{
    const rect=element.getBoundingClientRect();
    const hit=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2);
    return !!hit&&element.contains(hit);
  })).toBe(true);
  await word.click();await page.getByTestId('guess-input').fill('letter?');await page.getByTestId('guess-input').press('Enter');
  await expect(word.locator('small')).toHaveText('letter?');
  expect(errors).toEqual([]);
});

test('a physically spaced café order follows its tray while carried and delivered',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  const zone=await importZone(page,'cafe'),actions=inferCafeActions(zone);
  const placements=actions.filter((action):action is Extract<WorldAction,{kind:'place'}>=>action.kind==='place');
  expect(placements).toHaveLength(3);
  const trayId=placements[0].target,contents=placements.map(action=>action.object);
  expect(new Set(placements.map(action=>action.target))).toEqual(new Set([trayId]));
  await apply(page,actions.slice(0,6));
  await expect.poll(async()=>{
    const actual=await state(page);
    return contents.every((id,i)=>contents.slice(i+1).every(other=>separateFootprints(object(actual,id),object(actual,other))));
  }).toBe(true);
  const loaded=await state(page),tray=object(loaded,trayId);
  for(const id of contents){
    const item=object(loaded,id);
    expect(item.visible).toBe(true);expect(item.meshes).toBeGreaterThan(0);
    expect(item.position[1]).toBeGreaterThan(tray.position[1]);
    for(const axis of [0,2]){
      expect(item.bounds.min[axis]).toBeGreaterThanOrEqual(tray.bounds.min[axis]-.04);
      expect(item.bounds.max[axis]).toBeLessThanOrEqual(tray.bounds.max[axis]+.04);
    }
  }
  const offsets=contents.map(id=>object(loaded,id).position.map((n,i)=>n-tray.position[i]) as Vector);
  await apply(page,[actions[6]]);
  await page.locator('#leave-focus').click();
  const carried=await state(page),before=object(carried,trayId).position;
  const playerBefore=await page.evaluate(()=>(window as unknown as RenderWindow).__BABELWAKE__.view().player);
  await page.keyboard.down('ArrowRight');
  try{
    await expect.poll(async()=>{
      const after=await page.evaluate(()=>(window as unknown as RenderWindow).__BABELWAKE__.view().player);
      return Math.hypot(after.x-playerBefore.x,after.z-playerBefore.z);
    }).toBeGreaterThan(.5);
  }finally{await page.keyboard.up('ArrowRight');}
  const walked=await state(page);
  expect(distance(object(walked,trayId).position,before)).toBeGreaterThan(.4);
  for(const [index,id]of contents.entries()){
    const item=object(walked,id),support=object(walked,trayId);
    expect(item.visible).toBe(true);
    const relative=item.position.map((n,i)=>n-support.position[i]) as Vector;
    expect(distance(relative,offsets[index])).toBeLessThan(.03);
  }
  await apply(page,[actions[7]]);
  const delivered=await state(page),target=actions[7];
  if(target.kind!=='deliver')throw Error('Expected inferred serving hand-off');
  expect(distance(object(delivered,trayId).position,object(delivered,target.target).position)).toBeLessThan(1.6);
  expect(distance(object(delivered,trayId).position,object(walked,trayId).position)).toBeGreaterThan(1);
  for(const [index,id]of contents.entries()){
    const item=object(delivered,id),support=object(delivered,trayId);
    expect(item.visible).toBe(true);
    expect(distance(item.position.map((n,i)=>n-support.position[i]) as Vector,offsets[index])).toBeLessThan(.03);
    for(const other of contents.slice(index+1))expect(separateFootprints(item,object(delivered,other))).toBe(true);
  }
  expect(errors).toEqual([]);
});

test.describe('tablet station renderer',()=>{
  test.use({viewport:{width:1024,height:768},hasTouch:true});
  test('travel demonstrations move real NPCs, restore them, and ticket use opens a real train door',async({page})=>{
    const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
    const zone=await importZone(page,'gare',true),actions=inferGareActions(zone);
    const travel=zone.evidence.find(e=>e.travel?.companions?.length&&e.text.startsWith('Nous allons'));
    if(!travel?.travel)throw Error('Missing first-person group travel demonstration');
    const actor=travel.travel.actor,companion=travel.travel.companions![0],original=await state(page);
    const player=await page.evaluate(()=>(window as unknown as RenderWindow).__BABELWAKE__.view().player);
    const focus=()=>page.evaluate(id=>(window as unknown as RenderWindow).__BABELWAKE__.encounter(id),travel.id);
    const moved=()=>expect.poll(async()=>distance(object(await state(page),actor).position,object(original,actor).position)).toBeGreaterThan(.5);
    await focus();await moved();
    const travelling=await state(page),delta=object(travelling,actor).position.map((n,i)=>n-object(original,actor).position[i]) as Vector;
    const companionDelta=object(travelling,companion).position.map((n,i)=>n-object(original,companion).position[i]) as Vector;
    expect(distance(delta,companionDelta)).toBeLessThan(.03);
    expect(await page.evaluate(()=>(window as unknown as RenderWindow).__BABELWAKE__.view().player)).toEqual(player);
    const other=zone.evidence.find(e=>!e.travel&&!e.demonstration&&!e.actorPoses&&e.surface==='top')!;
    await page.evaluate(id=>(window as unknown as RenderWindow).__BABELWAKE__.encounter(id),other.id);
    for(const id of [actor,companion])await expect.poll(async()=>distance(object(await state(page),id).position,object(original,id).position)).toBeLessThan(.03);
    await focus();await moved();await page.locator('#leave-focus').tap();
    for(const id of [actor,companion])await expect.poll(async()=>distance(object(await state(page),id).position,object(original,id).position)).toBeLessThan(.03);
    const open=actions[1];if(open.kind!=='operate')throw Error('Missing inferred train-opening action');
    const closed=object(await state(page),open.object);
    expect(closed.hinge).toBeDefined();expect(Math.abs(closed.hinge![1])).toBeLessThan(.01);
    await apply(page,actions.slice(0,2));
    await expect.poll(async()=>Math.abs(object(await state(page),open.object).hinge![1])).toBeGreaterThan(.8);
    await page.getByTestId('journal').tap();await expect(page.locator('.journal-panel')).toBeVisible();
    await page.locator('.journal-panel [data-close]').tap();
    await expect(page.locator('#overlay')).toBeHidden();
    const controls=await page.locator('#physical-controls').boundingBox();
    expect(controls).not.toBeNull();expect(controls!.x).toBeGreaterThanOrEqual(0);expect(controls!.x+controls!.width).toBeLessThanOrEqual(1024);
    expect(controls!.y+controls!.height).toBeLessThanOrEqual(768);
    expect((await page.locator('canvas').screenshot()).byteLength).toBeGreaterThan(15_000);
    expect(errors).toEqual([]);
  });
});
