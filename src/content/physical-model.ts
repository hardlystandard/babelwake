import type { SceneObject } from './types';

/** Mirrors the shapes actually rendered by SituatedLayer. Unused metadata may
 * never turn two identical props into separate teaching situations. */
export function physicalModel(object:SceneObject):{family:string;height:number;features:unknown[]} {
  const kind=object.kind,detail=object.detail??'';
  const quantity=Math.max(1,Math.round(object.quantity??1));
  const family=(name:string,height:number,features:unknown[]=[])=>({family:name,height,features:[Math.min(quantity,/^(bread|apple|pear|fruit|cheese|egg|fish|carrot|vegetable|money|coin|flower)/.test(kind)?100:20),...features]});
  if(/^(bread|apple|pear|fruit|cheese|egg|fish|carrot|vegetable)(-|$)/.test(kind))return family(kind.split('-')[0],quantity>1?.55:.95,['half','fresh','stale'].map(flag=>detail.includes(flag)));
  if(/^(money|coin)(-|$)/.test(kind)){
    const pieces:number[]=[];
    if(object.quantity)pieces.push(...Array(Math.min(100,quantity)).fill(1));
    else {let left=Math.max(1,Math.round(object.value??1));for(const n of detail==='twenties'?[20,10,5,2,1]:detail==='tens'?[10,5,2,1]:[100,50,20,10,5,2,1])while(left>=n){pieces.push(n);left-=n;}}
    return family('money',.17,[pieces]);
  }
  if(/^(basket|bag)(-|$)/.test(kind))return family(kind.startsWith('basket')?'basket':'bag',1.35,[!detail.includes('empty')&&/food|full/.test(detail)]);
  if(/^(cup|tasse|glass|verre|coffee|tea)(-|$)/.test(kind))return family(/glass|verre/.test(kind)?'glass':'cup',detail.includes('very-hot')?1.75:detail.includes('hot')?1.25:detail.includes('very-cold')?1.1:/glass|verre/.test(kind)?.9:.7,[/tea/.test(kind)||detail.includes('tea'),detail.includes('milk'),...['empty','hot','cold','spill','very-hot','very-cold'].map(flag=>detail.includes(flag))]);
  if(/^(water|milk|bottle-water|bottle-milk)(-|$)/.test(kind))return family(kind.includes('milk')?'milk':'water',detail.includes('hot')?1.8:1.1,[detail.includes('hot')]);
  if(/^(plate|assiette|tray)(-|$)/.test(kind))return family(kind.startsWith('tray')?'tray':'plate',kind.startsWith('tray')?.24:.15);
  if(/^(spoon|cuillere|cuillère|sugar)(-|$)/.test(kind))return family(kind.startsWith('sugar')?'sugar':'spoon',kind.startsWith('sugar')?.3:.12);
  if(/^(stamp|timbre)(-|$)/.test(kind))return family('stamp',.1,[object.value??1]);
  if(/^(envelope|enveloppe|address|adresse)(-|$)/.test(kind))return family(/address|adresse/.test(kind)?'address':'envelope',object.open?.6:.1);
  if(/^(receipt|ticket)(-|$)/.test(kind))return family('receipt',.09,[detail||String(object.value??0)]);
  if(kind==='menu')return family('menu',.38,[object.value??2]);
  if(/^clock(-|$)/.test(kind))return family('clock',detail.startsWith('standing-')?3.4:.3,[detail.match(/^\d{1,2}:\d{2}$/)?.[0]??object.value??1200,['matin','soir','midi'].includes(detail.replace(/^standing-/,''))?detail.replace(/^standing-/,''):null,detail.startsWith('standing-')]);
  if(kind==='journey'||kind==='route')return family('journey',.85,[detail==='arrival']);
  if(/^(platform|train|station|bridge|street|plaza|direction|map|route-map|bed|coat|shirt|tree|flower|garden|calendar|family|timeline)(-|$)/.test(kind)){
    const name=kind.startsWith('route-map')?'map':kind.split('-')[0];
    const heights:Record<string,number>={platform:.43,train:2.1,station:2.2,bridge:1.1,street:.07,plaza:.07,direction:.15,map:.45,bed:1.3,coat:.18,shirt:.18,tree:4,flower:.9,garden:.9,calendar:.23,family:1,timeline:.95};
    let features:unknown[]=[];
    if(name==='platform')features=[detail];
    if(name==='direction')features=[['gauche','droite','sud'].includes(detail)?detail:'nord'];
    if(name==='map')features=[detail.includes('south')];
    if(name==='coat'||name==='shirt')features=[detail.includes('worn'),detail.includes('beautiful')];
    if(name==='calendar')features=[object.value??15,detail==='hier'?-1:detail==='demain'?1:0];
    if(name==='family')features=[['père','mère','fils','fille','famille','parent','enfant','frère','sœur'].includes(detail)?detail:null];
    if(name==='timeline'){
      const [action,item='letter',focus]=detail.split(':');
      features=[['take','find','give','lose','read','write','see','drink','eat','open'].includes(action)?action:null,['key','book','photo','train','house','ticket','envelope','coffee','bread'].includes(item)?item:'letter',['before','now','after'].includes(focus)?focus:null,object.value??15];
      if(['drink','eat','open'].includes(action))return family('timeline',1.4,features);
    }
    return family(name,heights[name],features);
  }
  if(/^(photo|picture-frame|frame)(-|$)/.test(kind)&&object.picture)return family('photo',.15);
  if(kind==='house')return family('house',3.1);
  if(kind==='room')return family('room',.09,[['cuisine','chambre','salon'].includes(detail)?detail:null]);
  if(kind==='stove'||kind==='sofa')return family(kind,kind==='stove'?1.3:1.4);
  if(kind==='pencil'||kind==='crayon')return family('pencil',.16);
  for(const [pattern,name,height]of [[/key/,'key',.25],[/box|crate|chest/,'box',1.55],[/door|gate/,'door',3.6],[/table|bench|counter|shelf/,/shelf/.test(kind)?'shelf':'table',1.3],[/book/,'book',.35],[/person|npc|guardian|neighbor/,/female|woman/.test(kind)?'npc-female':'npc-male',2.3],[/letter|note|paper/,'letter',.15],[/bottle|pot|paint/,'bottle',1.1],[/chair/,'chair',1.7],[/window/,'window',2.4],[/mat|floor/,'mat',.07],[/notice/,'notice',3.6]] as [RegExp,string,number][])if(pattern.test(kind))return family(name,height,name.startsWith('npc')?[detail.includes('server'),['drink','eat','talk','greet','thanks','request','spill','pleased','refuse'].find(action=>detail.includes(action))??null,detail.includes('tea'),detail.includes('milk'),detail.includes('apple')]:name==='book'||name==='box'?[detail.includes('worn'),detail.includes('beautiful')]:name==='window'?[detail==='night']:[]);
  return family('sign',2.1);
}

/** French printed by the mesh renderer, in addition to ordinary DOM labels. */
export function printedPropText(object:SceneObject):string[] {
  const kind=object.kind,detail=object.detail??'';
  if(/^(receipt|ticket)(-|$)/.test(kind))return[detail||String(object.value??0)];
  if(/^platform(-|$)/.test(kind))return[detail];
  if(/^direction(-|$)/.test(kind)&&['nord','sud'].includes(detail))return[detail==='nord'?'N':'S'];
  if(/^(map|route-map)(-|$)/.test(kind))return['N'];
  return[];
}
