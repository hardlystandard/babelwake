import type { SceneObject, WorldAction, Zone } from '../../src/content/types';

const color=(value:string|undefined)=>value?.replace(/^bleue$/,'bleu').replace(/^verte$/,'vert');

/** A French-aware reader of the actual clues and spatial scene, never the answer sequence. */
export function inferAtelierActions(zone:Zone):WorldAction[] {
  const scene=zone.scene??[];
  const clues=(zone.puzzle.world?.clues??[]).map(id=>zone.evidence.find(e=>e.id===id));
  if(clues.length!==6||clues.some(e=>!e))throw new Error('Missing workshop instructions');
  const requireObject=(predicate:(object:SceneObject)=>boolean,context:string):SceneObject=>{
    const matches=scene.filter(predicate);
    if(matches.length!==1)throw new Error(`${context}: ${matches.length} physical referents`);
    return matches[0];
  };
  const hueAfter=(index:number,noun:string)=>{
    const match=new RegExp(`${noun} ([\\p{L}]+)`,'u').exec(clues[index]!.text);
    if(!match)throw new Error(`Missing ${noun} attribute in actual instruction`);
    return color(match[1]);
  };
  const redBoxes=new Set(scene.filter(o=>o.kind==='box'&&color(o.color)===hueAfter(0,'boîte')).map(o=>o.id));
  const key=requireObject(o=>o.kind==='key'&&o.portable===true&&!!o.placement&&redBoxes.has(o.placement.target)&&o.placement.relation==='under','key under a box with the described color');
  if(!/grande porte/u.test(clues[1]!.text))throw new Error('Missing size contrast');
  const doors=scene.filter(o=>o.kind==='door');
  const height=(o:SceneObject)=>typeof o.size==='number'?o.size:Array.isArray(o.size)?o.size[1]:1;
  const door=requireObject(o=>o.kind==='door'&&height(o)===Math.max(...doors.map(height)),'largest visible door');
  const yellowBoxes=new Set(scene.filter(o=>o.kind==='box'&&color(o.color)===hueAfter(2,'boîte')).map(o=>o.id));
  const book=requireObject(o=>o.kind==='book'&&o.portable===true&&!!o.placement&&yellowBoxes.has(o.placement.target)&&o.placement.relation==='in','book inside a box with the described color');
  const redTable=requireObject(o=>o.kind==='table'&&color(o.color)===hueAfter(3,'table'),'reference table');
  const destination=requireObject(o=>o.kind==='box'&&o.placement?.target===redTable.id&&o.placement.relation==='under','box under that table');
  const greenChair=requireObject(o=>o.kind==='chair'&&color(o.color)===hueAfter(4,'chaise'),'reference chair');
  const letter=requireObject(o=>o.kind==='letter'&&o.portable===true&&o.placement?.target===greenChair.id&&o.placement.relation==='on','letter on that chair');
  const referentKey=requireObject(o=>o.kind==='key'&&o.portable===true&&color(o.color)===hueAfter(5,'clé'),'key identifying the recipient');
  const recipient=requireObject(o=>o.recipient===true&&(clues[5]?.actorPoses?.[o.id]??o.pose)?.holds===referentKey.id,'person actually holding that key');
  return [
    {kind:'take',object:key.id},
    {kind:'operate',object:door.id,operation:'open',tool:key.id},
    {kind:'take',object:book.id},
    {kind:'place',object:book.id,target:destination.id,relation:'in'},
    {kind:'take',object:letter.id},
    {kind:'deliver',object:letter.id,target:recipient.id},
  ];
}
