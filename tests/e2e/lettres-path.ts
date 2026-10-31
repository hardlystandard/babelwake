import type { SceneObject, WorldAction, Zone } from '../../src/content/types';

/** Read the dated papers, address and physical relationships. This deliberately
 * never inspects the authored answer sequence or assumes opaque object IDs. */
export function inferLettresActions(zone:Zone):WorldAction[] {
 const scene=zone.scene??[];
 const clues=(zone.puzzle.world?.clues??[]).map(id=>zone.evidence.find(e=>e.id===id));
 if(clues.length!==7||clues.some(clue=>!clue))throw Error('Missing correspondence instructions');
 const unique=(predicate:(object:SceneObject)=>boolean,description:string):SceneObject=>{
  const found=scene.filter(predicate);if(found.length!==1)throw Error(`${description}: ${found.length} physical referents`);return found[0];
 };
 const text=(index:number)=>clues[index]!.text;
 const hue=(index:number,noun:string)=>{
  const match=new RegExp(`${noun} ([\\p{L}]+)`,'u').exec(text(index));
  if(!match)throw Error(`Missing ${noun} attribute`);return match[1].replace(/^bleue$/,'bleu').replace(/^verte$/,'vert');
 };
 const color=(object:SceneObject)=>object.color?.replace(/^bleue$/,'bleu').replace(/^verte$/,'vert');
 const book=unique(object=>object.kind==='book'&&color(object)===hue(0,'livre'),'described book');
 if(!/clé sous le livre/u.test(text(0)))throw Error('Missing key/book spatial relation');
 const key=unique(object=>object.kind==='key'&&object.portable===true&&object.placement?.target===book.id&&object.placement.relation==='under','key under that book');
 if(!/grande porte/u.test(text(1)))throw Error('Missing gate size contrast');
 const height=(object:SceneObject)=>typeof object.size==='number'?object.size:Array.isArray(object.size)?object.size[1]:1;
 const gates=scene.filter(object=>object.kind==='door');
 const gate=unique(object=>object.kind==='door'&&height(object)===Math.max(...gates.map(height)),'largest gate');
 const todayValues=new Set(scene.filter(object=>object.kind==='calendar'&&zone.evidence.some(e=>e.anchor===object.id&&/Aujourd’hui/u.test(e.text))).map(object=>object.value));
 if(todayValues.size!==1)throw Error('No stable current calendar day');
 const today=[...todayValues][0];if(typeof today!=='number')throw Error('Current day is not rendered numerically');
 if(!/lettre d’hier/u.test(text(2)))throw Error('Missing yesterday relation');
 const letter=unique(object=>object.kind==='letter'&&object.portable===true&&Number(object.label)===today-1,'paper dated yesterday');
 const addressBook=unique(object=>object.kind==='book'&&color(object)===hue(3,'livre'),'book containing the recovered address');
 const address=unique(object=>object.kind==='address'&&object.placement?.target===addressBook.id&&object.placement.relation==='in','address inside that book');
 const street=(object:SceneObject)=>(object.labels??[]).map(label=>label.text).join(' ');
 const envelope=unique(object=>object.kind==='envelope'&&object.label===address.label&&street(object)===street(address),'envelope matching the recovered street and house number');
 if(!/lettre d’hier/u.test(text(4))||!/pas l’enveloppe rouge/u.test(text(4))||color(envelope)==='rouge')throw Error('Envelope retrieval does not preserve the selected original letter');
 const named=/photo de ([\p{L}]+)/u.exec(text(5));if(!named)throw Error('No named photograph in postage instruction');
 const photograph=unique(object=>object.kind==='photo'&&object.label===`photo de ${named[1]}`,'named photograph');
 const stamp=unique(object=>object.kind==='stamp'&&object.portable===true&&object.placement?.target===photograph.id&&object.placement.relation==='under','stamp beneath that photograph');
 if(!/Pour ma sœur/u.test(text(6))||!/Elle a la photo/u.test(text(6)))throw Error('Missing final social referent');
 const recipient=unique(object=>{
  const held=(clues[6]!.actorPoses?.[object.id]??object.pose)?.holds;
  return object.recipient===true&&/female|woman/u.test(object.kind)&&scene.some(prop=>prop.id===held&&prop.kind==='photo');
 },'woman visibly holding the photograph');
 return [
  {kind:'take',object:key.id},
  {kind:'operate',object:gate.id,operation:'open',tool:key.id},
  {kind:'take',object:letter.id},
  {kind:'place',object:letter.id,target:envelope.id,relation:'in'},
  {kind:'take',object:envelope.id},
  {kind:'combine',object:envelope.id,target:stamp.id},
  {kind:'deliver',object:envelope.id,target:recipient.id},
 ];
}
