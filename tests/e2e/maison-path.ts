import type { SceneObject, WorldAction, Zone } from '../../src/content/types';

/** Read household instructions and relationships, never the expected sequence. */
export function inferMaisonActions(zone:Zone):WorldAction[]{
 const scene=zone.scene??[];
 const clues=(zone.puzzle.world?.clues??[]).map(id=>zone.evidence.find(e=>e.id===id)?.text??'');
 if(clues.length!==10)throw new Error('Missing household instructions');
 const only=(objects:SceneObject[],description:string)=>{if(objects.length!==1)throw new Error(`${description}: ${objects.length} referents`);return objects[0];};
 const hue=(text:string,noun:string)=>{
  const result=new RegExp(`${noun} ([\\p{L}]+)`,'u').exec(text);if(!result)throw new Error(`Missing ${noun} colour`);return result[1].replace(/e$/u,'');
 };
 const color=(o:SceneObject)=>o.color?.replace(/e$/u,'');
 const size=(o:SceneObject)=>typeof o.size==='number'?o.size:Array.isArray(o.size)?o.size[1]:1;
 const coat=only(scene.filter(o=>o.kind==='coat'&&color(o)===hue(clues[0],'manteau')),'described coat');
 const letter=only(scene.filter(o=>o.kind==='letter'&&o.placement?.target===coat.id&&o.placement.relation==='under'),'letter under the described coat');
 if(!/petit livre rouge/u.test(clues[1])||!/petit livre rouge/u.test(clues[2]))throw new Error('Missing household book contrast');
 const redBooks=scene.filter(o=>o.kind==='book'&&o.color==='rouge'&&o.portable);
 const book=only(redBooks.filter(o=>size(o)===Math.min(...redBooks.map(size))),'small red book');
 if(!/table de la cuisine/u.test(clues[3])||!/table avec le livre/u.test(clues[5]))throw new Error('Missing shared table relation');
 const tables=scene.filter(o=>o.kind==='table');
 const kitchen=only(scene.filter(o=>o.kind==='room'&&o.label==='cuisine'),'furnished kitchen');
 const distance=(o:SceneObject)=>Math.hypot(o.position[0]-kitchen.position[0],o.position[1]-kitchen.position[1]);
 const table=only(tables.filter(t=>distance(t)===Math.min(...tables.map(distance))),'kitchen table');
 const chairs=scene.filter(o=>o.kind==='chair');
 const smallChair=only(chairs.filter(o=>size(o)===Math.min(...chairs.map(size))),'small chair');
 const cup=only(scene.filter(o=>o.kind==='cup'&&o.portable&&o.placement?.target===smallChair.id&&o.placement.relation==='on'),'cup on the small chair');
 const flowerIds=new Set(scene.filter(o=>o.kind==='flower').map(o=>o.id));
 const key=only(scene.filter(o=>o.kind==='key'&&o.portable&&color(o)===hue(clues[6],'clé')&&o.placement?.relation==='under'&&flowerIds.has(o.placement.target)),'yellow key under flowers');
 const doors=scene.filter(o=>o.kind==='door');
 const door=only(doors.filter(o=>size(o)===Math.max(...doors.map(size))),'large door');
 const source=zone.evidence.find(e=>e.text===clues[9]);
 if(!source?.anchor||!/mon frère/u.test(clues[9]))throw new Error('Missing addressed brother relationship');
 const relation=zone.evidence.find(e=>e.anchor===source.anchor&&/^[\p{L}]+ est mon frère\./u.test(e.text));
 const name=/^([\p{L}]+) est mon frère\./u.exec(relation?.text??'')?.[1];
 const brother=only(scene.filter(o=>o.recipient&&o.label===name),'requester’s brother');
 const ownership=zone.evidence.find(e=>e.anchor===brother.id&&/^Mon manteau /u.test(e.text));
 const ownedCoat=only(scene.filter(o=>o.kind==='coat'&&o.portable&&color(o)===hue(ownership?.text??'','manteau')),'brother’s coat');
 return[
  {kind:'take',object:letter.id},
  {kind:'place',object:letter.id,target:book.id,relation:'in'},
  {kind:'take',object:book.id},
  {kind:'place',object:book.id,target:table.id,relation:'on'},
  {kind:'take',object:cup.id},
  {kind:'place',object:cup.id,target:table.id,relation:'on'},
  {kind:'take',object:key.id},
  {kind:'operate',object:door.id,operation:'open',tool:key.id},
  {kind:'take',object:ownedCoat.id},
  {kind:'deliver',object:ownedCoat.id,target:brother.id},
 ];
}
