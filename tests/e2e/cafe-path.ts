import type { SceneObject, WorldAction, Zone } from '../../src/content/types';

/** Reads the actual service request, object attributes and the seating plan.
 * It deliberately does not inspect the authored answer/action sequence. */
export function inferCafeActions(zone:Zone):WorldAction[]{
 const scene=zone.scene??[];
 const clue=(i:number)=>zone.evidence.find(e=>e.id===zone.puzzle.world?.clues[i])?.text??'';
 const one=(predicate:(object:SceneObject)=>boolean,context:string)=>{
  const matches=scene.filter(predicate); if(matches.length!==1)throw new Error(`${context}: ${matches.length} physical referents`); return matches[0];
 };
 if(!/tasse bleue sans lait/u.test(clue(0)))throw new Error('Missing milk/blue-cup contrast');
 const tea=one(o=>o.kind==='tea'&&o.color==='bleue'&&o.detail!=='milk','blue cup without milk');
 const windows=scene.filter(o=>o.kind==='window');if(!windows.length)throw new Error('No window locating the service tray');
 const trays=scene.filter(o=>o.kind==='tray'&&o.portable);
 const distance=(o:SceneObject)=>Math.min(...windows.map(window=>Math.hypot(o.position[0]-window.position[0],o.position[1]-window.position[1])));
 if(![1,3,5,6].every(i=>/plateau sous la fenêtre/u.test(clue(i))))throw new Error('Missing common tray destination');
 const tray=one(o=>trays.includes(o)&&distance(o)===Math.min(...trays.map(distance)),'tray directly under the window');
 if(!/pain sans lait/u.test(clue(2)))throw new Error('Missing bread request');
 const bread=one(o=>o.kind==='bread'&&o.portable===true&&o.detail!=='milk','bread without milk');
 const plate=one(o=>o.kind==='plate'&&o.label==='assiette de thé','tea plate');
 if(!/cuillère sous l’assiette de thé/u.test(clue(4)))throw new Error('Missing spoon location');
 const spoon=one(o=>o.kind==='spoon'&&o.placement?.target===plate.id&&o.placement.relation==='under','spoon under that plate');
 const bookColor=/livre (rouge|bleu|vert|jaune)/u.exec(clue(7))?.[1];
 const book=one(o=>o.kind==='book'&&o.color===bookColor,'book identifying the customer');
 const guest=one(o=>o.recipient===true&&(o.pose?.holds===book.id||book.containedBy===o.id),'customer holding that book');
 const numerals:Record<string,number>={un:1,deux:2,trois:3,quatre:4,cinq:5};
 const prices=[...clue(8).matchAll(/coûte (un|deux|trois|quatre|cinq) euro/gu)].map(m=>numerals[m[1]]);
 if(prices.length!==2)throw new Error('Two item prices must be readable');
 const payment=one(o=>o.kind==='money'&&o.value===prices.reduce((n,v)=>n+v,0),'payment equal to tea plus bread');
 const keyColor=/clé (jaune|rouge|bleue|verte)/u.exec(clue(9))?.[1];
 const key=one(o=>o.kind==='key'&&o.color===keyColor,'key identifying the server');
 const server=one(o=>o.recipient===true&&(o.pose?.holds===key.id||key.containedBy===o.id),'server holding that key');
 if(clue(9)!==clue(11))throw new Error('Payment and letter name different servers');
 const receiptColor=/addition (verte|rouge|bleue|jaune)/u.exec(clue(10))?.[1];
 const receipt=one(o=>o.kind==='receipt'&&o.color===receiptColor,'receipt covering the letter');
 const letter=one(o=>o.kind==='letter'&&o.placement?.target===receipt.id&&o.placement.relation==='under','letter below that receipt');
 return[
  {kind:'take',object:tea.id},{kind:'place',object:tea.id,target:tray.id,relation:'on'},
  {kind:'take',object:bread.id},{kind:'place',object:bread.id,target:tray.id,relation:'on'},
  {kind:'take',object:spoon.id},{kind:'place',object:spoon.id,target:tray.id,relation:'on'},
  {kind:'take',object:tray.id},{kind:'deliver',object:tray.id,target:guest.id},
  {kind:'take',object:payment.id},{kind:'deliver',object:payment.id,target:server.id},
  {kind:'take',object:letter.id},{kind:'deliver',object:letter.id,target:server.id},
 ];
}
