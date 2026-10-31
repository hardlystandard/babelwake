import type { SceneObject, WorldAction, Zone } from '../../src/content/types';
const hue=(value:string|undefined)=>value?.replace(/^bleue$/,'bleu').replace(/^verte$/,'vert');
/** Read the packing instructions, real container relations and visible unit tags.
 * This reader never consults the authored answer actions or opaque object IDs. */
export function inferMarcheActions(zone:Zone):WorldAction[] {
 const scene=zone.scene??[];
 const clues=(zone.puzzle.world?.clues??[]).map(id=>zone.evidence.find(entry=>entry.id===id)?.text??'');
 if(clues.length!==12)throw new Error('Missing shopping/packing/payment instructions');
 const unique=(test:(item:SceneObject)=>boolean,why:string):SceneObject=>{
  const matches=scene.filter(test);if(matches.length!==1)throw new Error(`${why}: ${matches.length} referents`);return matches[0];
 };
 const container=(clue:string,noun:string,kind:string)=>{
  const color=new RegExp(`${noun} ([\\p{L}]+)`,'u').exec(clue)?.[1];
  if(!color)throw new Error(`Missing ${noun} color`);
  return unique(item=>item.kind===kind&&hue(item.color)===hue(color),`${noun} ${color}`);
 };
 const redBasket=container(clues[0],'panier','basket');
 const bread=unique(item=>item.kind==='bread'&&item.portable===true&&item.placement?.target===redBasket.id&&item.placement.relation==='in','bread in the described basket');
 const bag=unique(item=>item.kind==='bag'&&item.placement?.target===redBasket.id&&item.placement.relation==='under','bag under the basket');
 const blueBasket=container(clues[2],'panier','basket');
 const apples=unique(item=>item.kind==='apple'&&item.portable===true&&item.placement?.target===blueBasket.id&&item.placement.relation==='in','apples in the second basket');
 const redTable=container(clues[4],'table','table');
 const cheese=unique(item=>item.kind==='cheese'&&item.portable===true&&item.placement?.target===redTable.id&&item.placement.relation==='under','cheese below the described table');
 if(!/Deux pains, cinq pommes, un fromage/u.test(clues[6])||bread.quantity!==2||apples.quantity!==5)throw new Error('Packed quantities disagree with the visible order');
 const unitPrice=(item:SceneObject)=>{
  const tag=item.labels?.map(label=>label.text).find(text=>/^1 → \d+ €$/u.test(text));
  if(!tag)throw new Error('Missing visible per-unit price tag');return Number(/→ (\d+)/u.exec(tag)![1]);
 };
 const total=[bread,apples,cheese].reduce((sum,item)=>sum+(item.quantity??1)*unitPrice(item),0);
 const payment=unique(item=>item.kind==='money'&&item.portable===true&&item.value===total,'payment reconstructed from physical quantities and visible unit prices');
 const greenBottle=unique(item=>item.kind==='bottle-water'&&item.portable===true&&hue(item.color)==='vert','held green bottle');
 const merchant=unique(item=>item.recipient===true&&item.pose?.holds===greenBottle.id,'person holding the described bottle');
 const key=unique(item=>item.kind==='key'&&hue(item.color)==='vert','green key');
 const courier=unique(item=>item.recipient===true&&item.pose?.holds===key.id,'courier identified by what she holds');
 const yellowBasket=container(clues[10],'panier','basket');
 const letter=unique(item=>item.kind==='letter'&&item.portable===true&&item.placement?.target===yellowBasket.id&&item.placement.relation==='under','letter beneath the yellow basket');
 return [
  {kind:'take',object:bread.id},{kind:'place',object:bread.id,target:bag.id,relation:'in'},
  {kind:'take',object:apples.id},{kind:'place',object:apples.id,target:bag.id,relation:'in'},
  {kind:'take',object:cheese.id},{kind:'place',object:cheese.id,target:bag.id,relation:'in'},
  {kind:'take',object:payment.id},{kind:'deliver',object:payment.id,target:merchant.id},
  {kind:'take',object:bag.id},{kind:'deliver',object:bag.id,target:courier.id},
  {kind:'take',object:letter.id},{kind:'deliver',object:letter.id,target:courier.id},
 ];
}
