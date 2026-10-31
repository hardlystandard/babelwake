import type { SceneObject, WorldAction, Zone } from '../../src/content/types';

/** Reads the station's request, timetable and scene. No authored answer sequence is consulted. */
export function inferGareActions(zone:Zone):WorldAction[]{
 const scene=zone.scene??[];
 const clues=(zone.puzzle.world?.clues??[]).map(id=>zone.evidence.find(e=>e.id===id)?.text??'');
 if(clues.length!==6||clues.some(text=>!text))throw new Error('Missing railway requests');
 const unique=(matches:SceneObject[],label:string)=>{if(matches.length!==1)throw new Error(`${label}: ${matches.length} candidates`);return matches[0];};
 const hue=(value:string|undefined)=>value?.replace('bleue','bleu').replace('verte','vert');
 const boxColor=/boîte (\p{L}+)/u.exec(clues[0])?.[1];
 const box=unique(scene.filter(o=>o.kind==='box'&&hue(o.color)===hue(boxColor)),'ticket container');
 const ticket=unique(scene.filter(o=>o.kind==='ticket'&&o.portable&&o.placement?.target===box.id&&o.placement.relation==='in'),'ticket inside described box');
 const direction=/pour la gare du (nord|sud)/iu.exec(clues[1])?.[1];
 const rows=zone.evidence.filter(e=>e.surface==='note'&&/Départ/u.test(e.text)&&new RegExp(`${direction}\\.`,'iu').test(e.text));
 if(rows.length!==1)throw new Error('Destination does not identify one service');
 const platformWord=/Quai (un|deux|trois)/u.exec(rows[0].text)?.[1];
 const platform=unique(scene.filter(o=>o.kind==='platform'&&o.label===`quai ${platformWord}`),'timetable platform');
 const distance=(a:SceneObject,b:SceneObject)=>Math.hypot(a.position[0]-b.position[0],a.position[1]-b.position[1]);
 const nearest=(objects:SceneObject[],target:SceneObject,label:string)=>{
  const scored=objects.map(o=>({o,d:distance(o,target)})).sort((a,b)=>a.d-b.d);
  if(!scored.length||scored.length>1&&Math.abs(scored[0].d-scored[1].d)<.01)throw new Error(`${label}: ambiguous distance`);
  return scored[0].o;
 };
 const train=nearest(scene.filter(o=>o.kind==='train'&&o.operations?.includes('open')),platform,'platform carriage');
 if(ticket.value!==1200||!/midi/u.test(rows[0].text))throw new Error('Ticket time does not match the selected noon service');
 const benchColor=/banc (\p{L}+)/u.exec(clues[2])?.[1];
 const sourceBench=unique(scene.filter(o=>o.kind==='bench'&&hue(o.color)===hue(benchColor)),'source bench');
 const bag=unique(scene.filter(o=>o.kind==='bag'&&o.portable&&o.placement?.target===sourceBench.id&&o.placement.relation==='under'),'bag under source bench');
 if(!/Sous le banc du quai trois/u.test(clues[3]))throw new Error('Missing baggage stow instruction');
 const targetBench=nearest(scene.filter(o=>o.kind==='bench'),platform,'destination platform bench');
 const height=(o:SceneObject)=>typeof o.size==='number'?o.size:Array.isArray(o.size)?o.size[1]:1;
 const clock=scene.filter(o=>o.kind==='clock').sort((a,b)=>height(b)-height(a))[0];
 if(!clock||!/derrière la grande horloge/u.test(clues[4]))throw new Error('Missing clock reference');
 const letter=unique(scene.filter(o=>o.kind==='letter'&&o.portable&&Math.abs(o.position[0]-clock.position[0])<.5&&o.position[1]<clock.position[1]),'letter behind largest clock');
 if(!/Elle attend sur le quai trois/u.test(clues[5]))throw new Error('Missing safe waiting recipient');
 const recipient=nearest(scene.filter(o=>o.kind==='npc-female'&&o.recipient),platform,'woman waiting on selected platform');
 return[
  {kind:'take',object:ticket.id},
  {kind:'operate',object:train.id,operation:'open',tool:ticket.id},
  {kind:'take',object:bag.id},
  {kind:'place',object:bag.id,target:targetBench.id,relation:'under'},
  {kind:'take',object:letter.id},
  {kind:'deliver',object:letter.id,target:recipient.id},
 ];
}
