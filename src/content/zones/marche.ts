import type { Evidence, JournalPage, Lexeme, Picture, SceneObject, Zone } from '../types';

/** Stock, customer hand-offs and sellers' tills share one working market. */
const scene: SceneObject[] = [];
const evidence: Evidence[] = [];
const add = (object: SceneObject) => { scene.push(object); return object.id; };
const prop = (id: string, kind: string, position: [number, number], extra: Partial<SceneObject> = {}) => add({id,kind,position,...extra});
function line(id: string, anchor: string, text: string, picture: Picture, surface: Evidence['surface'] = 'top', extra: Partial<Evidence> = {}) {
 const object = scene.find(item => item.id === anchor)!;
 const entry: Evidence = {id:`marche-v2-e-${id}`,title:`marche-v2-e-${id}`,anchor,text,picture,words:[],position:[...object.position],surface,kind:surface==='speech'?'person':surface==='note'?'note':'object',...extra};
 evidence.push(entry); return entry.id;
}
const say = (id: string, actor: string, text: string, picture: Picture, target?: string, extra: Partial<Evidence> = {}) => line(id,actor,text,picture,'speech',{...(target?{pose:{pointsTo:target}}:{}),...extra});
const p = (kind: string, detail?: string): Picture => ({kind,...(detail?{detail}:{})});

// Three sellers work around the square. Counted lots sit in their stock
// crates; buyers request those lots and sellers actually hand them over.
// Higher numbers are prices, counted payments and incoming money at the tills.
const numbers: [string,string,number][] = [
 ['deux','deux',2],['trois','trois',3],['quatre','quatre',4],['cinq','cinq',5],['six','six',6],['sept','sept',7],['huit','huit',8],['neuf','neuf',9],['dix','dix',10],['onze','onze',11],['douze','douze',12],['treize','treize',13],['quatorze','quatorze',14],['quinze','quinze',15],['seize','seize',16],['vingt','vingt',20],['vingt-et-un','vingt et un',21],['trente','trente',30],['quarante','quarante',40],['cinquante','cinquante',50],['soixante','soixante',60],['soixante-et-onze','soixante et onze',71],['quatre-vingts','quatre-vingts',80],['quatre-vingt-dix','quatre-vingt-dix',90],['cent','cent',100],
];
const vendorX=[-12,0,12];
for(const [i,x]of vendorX.entries()) {
 prop(`vendor-${i}`,'npc-male',[x-1.6,-5],{recipient:true,color:['#927346','#65877b','#9c745c'][i],label:['Marc','Émile','Hugo'][i]});
 prop(`buyer-${i}`,'npc-female',[x+1.5,-5],{recipient:true,color:['#8f715f','#779264','#8c839e'][i],label:['Léa','Rose','Eva'][i]});
 prop(`wares-${i}`,'counter',[x,-17],{size:[2.2,1,.9]});
 prop(`till-${i}`,'counter',[x,-7],{size:[1.1,1,.8]});
 prop(`till-drawer-${i}`,'box',[x,-7],{size:.55,open:true,container:true,placement:{target:`till-${i}`,relation:'on'}});
}
const numberContexts:[string,string,string][]=[];
for(const [i,[id,form,value]]of numbers.entries()) {
 const stall=i%3,x=vendorX[stall],seller=`vendor-${stall}`,buyer=`buyer-${stall}`;
 const small=value<=20;
 if(small){
  const local=Math.floor(i/3),stock=`stock-${id}`,crate=`crate-${id}`;
  const position:[number,number]=[x+(local%3-1)*2.5,-13.8+Math.floor(local/3)*3.4];
  const kind=['apple','egg','bread'][stall],noun=['pommes','œufs','pains'][stall];
  prop(crate,'tray',position,{size:1.1,accepts:['on']});
  prop(stock,kind,position,{quantity:value,size:.52,placement:{target:crate,relation:'on'}});
  const picture:Picture={kind:'quantity',detail:kind,count:value,label:String(value)};
  const first=line(`number-${id}-0`,crate,`${form} ${noun}`,picture,'top',{offset:[0,0,.6]});
  const second=say(`number-${id}-1`,buyer,`${form} ${noun} ?`,picture,stock);
  const third=say(`number-${id}-2`,seller,`${form} ${noun}.`,picture,buyer,{actorPoses:{[seller]:{holds:crate}},demonstration:{actor:seller,action:{kind:'deliver',object:crate,target:buyer}}});
  numberContexts.push([first,second,third]);
 }else{
  const local=Math.floor((i-16)/3),ware=`priced-${id}`,cash=`cash-${id}`;
  const kind=['cheese','basket','fish','bag','cheese','book','basket','bag','book'][i-16];
  prop(ware,kind,[x,-17],{size:.85,placement:{target:`wares-${stall}`,relation:'on',offset:[(local-1)*1.9,0,0]}});
  const cashDetail=value===80||value===90?'twenties':'standard';
  let remainder=value;const groups:string[]=[];
  for(const unit of(cashDetail==='twenties'?[20,10,5,2,1]:[100,50,20,10,5,2,1])){const count=Math.floor(remainder/unit);if(count)groups.push(count>1?`${count} × ${unit}`:String(unit));remainder%=unit;}
  prop(cash,'money',[x,-7],{value,detail:cashDetail,size:1,placement:{target:`till-drawer-${stall}`,relation:'in',offset:[(local-1)*.45,0,0]},labels:[{text:groups.join(' + '),surface:'note',offset:[0,0,.65]}]});
  const picture:Picture={kind:'price',detail:kind,count:value,label:`${value} €`};
  const first=line(`number-${id}-0`,ware,`${form} · ${value} €`,picture,'top',{offset:[0,0,.6]});
  const second=say(`number-${id}-1`,buyer,`${form} euros.`,{kind:'quantity',detail:'money',count:value,label:String(value)},undefined,{actorPoses:{[buyer]:{holds:cash}}});
  const third=say(`number-${id}-2`,seller,`${form} euros.`,{kind:'concept',detail:'payer:0'},buyer,{actorPoses:{[buyer]:{holds:cash}},demonstration:{actor:buyer,action:{kind:'deliver',object:cash,target:seller}}});
  numberContexts.push([first,second,third]);
 }
}
// The front work area is where the player packs and pays for Claire's order.
prop('table-r','table',[-10,10],{size:[1.5,1,1.5],color:'rouge',accepts:['on','under']});
prop('table-g','table',[0,10],{size:[1.5,1,1.5],color:'verte',accepts:['on','under']});
prop('table-b','table',[10,10],{size:[1.5,1,1.5],color:'bleue',accepts:['on','under']});
prop('basket-r','basket',[-10,10],{color:'rouge',portable:true,container:true,open:true,accepts:['in','on','under'],label:'panier rouge',placement:{target:'table-r',relation:'on'}});
prop('basket-b','basket',[0,10],{color:'bleue',portable:true,container:true,open:true,accepts:['in','on','under'],label:'panier bleu',placement:{target:'table-g',relation:'on'}});
prop('basket-y','basket',[10,10],{color:'jaune',portable:true,container:true,open:true,accepts:['in','on','under'],label:'panier jaune',placement:{target:'table-b',relation:'on'}});
prop('bag-b','bag',[-10,10],{color:'bleu',portable:true,container:true,open:true,accepts:['in','on'],label:'sac bleu',placement:{target:'basket-r',relation:'under',offset:[.7,0,.25]}});
prop('bag-r','bag',[0,10],{color:'rouge',portable:true,container:true,open:true,accepts:['in','on'],label:'sac rouge',placement:{target:'table-g',relation:'under'}});
prop('bag-g','bag',[10,10],{color:'vert',portable:true,container:true,open:true,accepts:['in','on'],label:'sac vert',placement:{target:'table-b',relation:'under'}});
prop('order-bread','bread',[-10,10],{quantity:2,value:2,portable:true,size:.7,label:'deux pains',placement:{target:'basket-r',relation:'in'}});
prop('order-apples','apple',[0,10],{quantity:5,value:1,portable:true,size:.7,label:'cinq pommes',placement:{target:'basket-b',relation:'in'}});
prop('decoy-cheese','cheese',[-10,10],{color:'rouge',portable:true,size:.8,label:'fromage rouge',placement:{target:'table-r',relation:'on',offset:[-1,0,0]}});
prop('order-cheese','cheese',[-10,10],{value:11,portable:true,size:.8,label:'fromage',placement:{target:'table-r',relation:'under',offset:[-.65,0,.15]}});
prop('other-bread','bread',[10,10],{quantity:5,portable:true,size:.7,label:'cinq pains',placement:{target:'basket-y',relation:'in'}});
prop('other-apples','apple',[10,10],{quantity:2,portable:true,size:.65,label:'deux pommes',placement:{target:'table-b',relation:'on',offset:[1,0,.4]}});
prop('pay-20','money',[4,13],{value:20,portable:true,label:'vingt euros',size:.8});
prop('pay-10','money',[7,13],{value:10,portable:true,label:'dix euros',size:.8});
prop('pay-5','money',[10,13],{value:5,portable:true,label:'cinq euros',size:.8});
prop('letter-blue','letter',[10,10],{color:'bleue',portable:true,label:'lettre bleue',placement:{target:'basket-y',relation:'under',offset:[.7,0,.2]}});
prop('letter-red','letter',[0,10],{color:'rouge',portable:true,label:'lettre rouge',placement:{target:'table-g',relation:'on',offset:[.9,0,.4]}});
prop('bottle-green','bottle-water',[4,17],{color:'verte',size:.65,label:'eau',portable:true,containedBy:'luc'});
prop('water-on-table','bottle-water',[0,10],{color:'verte',size:.65,label:'bouteille',placement:{target:'table-g',relation:'on',offset:[-.9,0,.4]}});
prop('water-in-basket','bottle-water',[10,10],{color:'bleue',size:.65,label:'bouteille',placement:{target:'basket-y',relation:'in',offset:[.4,0,0]}});
prop('key-green','key',[-4,17],{color:'verte',size:.6,label:'clé verte',portable:true,containedBy:'claire'});
prop('luc','npc-male',[4,17],{recipient:true,color:'#9c8557',label:'Luc',pose:{holds:'bottle-green'}});
prop('claire','npc-female',[-4,17],{recipient:true,color:'#a87559',label:'Claire',pose:{holds:'key-green'}});
prop('paul','npc-male',[0,15],{recipient:true,color:'#718778',label:'Paul'});
prop('anne','npc-female',[-8,16],{recipient:true,color:'#889261',label:'Anne'});
prop('reject-a','npc-female',[-17,10],{recipient:true,detail:'refuse',color:'#90705f'});
prop('reject-b','npc-male',[17,10],{recipient:true,detail:'refuse',color:'#7a8892'});
prop('reject-c','npc-female',[17,16],{recipient:true,detail:'refuse',color:'#a28655'});
prop('order','notice',[0,5]);

// An actual food item appears as stall stock, packed provision and something
// held at the tasting counter. Different pictures alone never create contexts.
const foods: [string,string,Picture][] = [
 ['pain','bread',p('bread')],['pomme','apple',p('apple')],['fromage','cheese',p('cheese')],['eau','bottle-water',p('water')],['œuf','egg',p('egg')],['lait','bottle-milk',p('milk')],['poisson','fish',p('fish')],['fruit','fruit',p('fruit')],['légume','vegetable',p('vegetable')],
];
const foodIds: Record<string,string[]> = {};
for(const [i,x]of[-10,0,10].entries())prop(`reserve-${i}`,'crate',[x-3.2,11.5],{size:.8,open:true,container:true});
for(const [i,[word,kind,picture]] of foods.entries()) {
 foodIds[word]=[];
 const stall=Math.floor(i/3), support=['table-r','table-g','table-b'][stall];
 for(let c=0;c<2;c++) {
  const object=`food-${i}-${c}`;
  prop(object,kind,[-10+stall*10,10],{size:c===0?.55:.4,placement:{target:c===0?support:`reserve-${stall}`,relation:c===0?'on':'in',offset:[(i%3-1)*(c===0?1.1:.4),0,c===0?-.85:0]},label:word});
  foodIds[word].push(line(`food-${i}-${c}`,object,word,picture,'top',{offset:[0,0,.35]}));
 }
 const actor=['anne','paul','luc'][stall],object=`food-${i}-0`;
 foodIds[word].push(say(`food-${i}-2`,actor,word,picture,undefined,{actorPoses:{[actor]:{holds:object}}}));
}
for(const id of ['basket-r','basket-b','basket-y'])line(`label-${id}`,id,'panier',p('basket'));
for(const id of ['bag-b','bag-r','bag-g'])line(`label-${id}`,id,'sac',p('bag'));
for(const [i,anchor]of['table-r','table-g','table-b'].entries()) {
 line(`market-${i}`,anchor,'marché',{kind:'concept',detail:`marché:${i}`},'awning',{offset:[0,1.7,0]});
 line(`euro-${i}`,`pay-${[20,10,5][i]}`,'euro',{kind:'concept',detail:`euro:${i}`},'top',{offset:[0,0,.8]});
}
for(const id of ['table-r','table-g','table-b','basket-r','basket-b','basket-y','bag-b','bag-r','bag-g','order-bread','order-apples','other-bread','other-apples','letter-blue','letter-red','key-green']) {
 const object=scene.find(item=>item.id===id)!;
 line(`prop-${id}`,id,object.label??(id==='table-r'?'table rouge':id==='table-g'?'table verte':'table bleue'),p(object.kind),'top',{offset:[0,0,.3]});
}

for(const [i,id]of['water-on-table','water-in-basket','bottle-green'].entries())line(`bottle-${i}`,id,'bouteille',p('bottle'));

// Unit prices are attached to the goods; a separate packing note names the
// quantities. The player must calculate 2×2 + 5×1 + 11 = 20, not copy a total.
for(const [id,amount,word]of[['order-bread',2,'pain'],['order-apples',1,'pomme'],['order-cheese',11,'fromage']] as [string,number,string][]) {
 const object=scene.find(o=>o.id===id)!;
 object.labels=[{text:`1 → ${amount} €`,surface:'top',offset:[0,0,-.7]}];
 line(`price-${id}`,id,`${word} · ${amount} €`,{kind:'price',detail:object.kind,label:`${amount} €`},'top',{offset:[0,0,-.7]});
}

line('water-partitive','food-3-0','De l’eau.',p('water'));

// Requests point towards an available item while the requester has empty hands.
// Ownership uses a held item; exchanges animate food and money separately.
const exchangeObjects=['food-0-0','food-1-0','food-2-0'];
for(const [i,object]of exchangeObjects.entries()) {
 const noun=['pain','pomme','fromage'][i], actor=['anne','claire','paul'][i];
 const payment=prop(`demo-pay-${i}`,'money',[-6+i*5,13],{value:[2,1,11][i],size:.6,label:`${[2,1,11][i]} €`});
 say(`want-${i}`,actor,`Je veux ${i===1?'une':'du'} ${noun}.`,p('action','vouloir'),object);
 say(`buy-${i}`,actor,`J’achète ${i===1?'une':'du'} ${noun}.`,p('action','acheter'),'luc',{actorPoses:{luc:{holds:object}},demonstration:{actor:'luc',action:{kind:'deliver',object,target:actor}}});
 say(`pay-${i}`,actor,`Je paie ${['deux euros','un euro','onze euros'][i]}.`,{kind:'concept',detail:`payer:${i}`},'luc',{actorPoses:{[actor]:{holds:payment}},demonstration:{actor,action:{kind:'deliver',object:payment,target:'luc'}}});
 say(`give-${i}`,'luc',`Je donne ${i===1?'une':'du'} ${noun}.`,p('action','donner'),actor,{demonstration:{actor:'luc',action:{kind:'deliver',object,target:actor}}});
 say(`take-${i}`,actor,`Je prends ${i===1?'la':'le'} ${noun}.`,p('action','prendre'),object,{demonstration:{actor,action:{kind:'take',object}}});
 say(`cost-${i}`,'luc',`${i===1?'La':'Le'} ${noun} coûte ${['deux euros','un euro','onze euros'][i]}.`,{kind:'concept',detail:`coûter:${i}`},object);
}
// Conversational persons recur independently, with desired goods remaining
// on the stall. Pointing towards a desired item contrasts with actually holding
// one; the third-person speaker indicates the person making that request.
for(const [i,object]of exchangeObjects.entries()) {
 const noun=['du pain','une pomme','du fromage'][i];
 say(`want-third-${i}`,'paul',`Elle veut ${noun}.`,p('grammar','elle'),'anne',{actorPoses:{anne:{pointsTo:object}}});
 say(`want-group-${i}`,'anne',`Nous voulons ${noun}.`,p('grammar','nous'),object,{actorPoses:{claire:{pointsTo:object}}});
 say(`want-address-${i}`,'luc',`Vous voulez ${noun} ?`,p('grammar','vous'),'claire',{actorPoses:{claire:{pointsTo:object},anne:{pointsTo:object}}});
}
for(const [i,actor]of['reject-a','reject-b','reject-c'].entries()) {
 const object=['food-1-0','food-0-1','food-2-0'][i];
 say(`negative-${i}`,actor,`Je ne veux pas de ${['pomme','pain','fromage'][i]}.`,p('grammar','negative'),object);
}
for(const [i,object]of exchangeObjects.entries())say(`male-recipient-${i}`,'anne','Pour lui.',p('grammar','il'),'luc',{demonstration:{actor:'anne',action:{kind:'deliver',object,target:'luc'}}});
for(const [i,actor]of['anne','claire','paul'].entries()) {
 const object=['basket-r','basket-b','basket-y'][i];
 say(`with-${i}`,actor,`Avec ${i===1?'les pommes':'le pain'}.`,{kind:'basket',detail:'full'},object,{actorPoses:{[actor]:{holds:object}}});
 say(`without-${i}`,actor,`Sans ${i===1?'pomme':'pain'}.`,{kind:'basket',detail:'empty'},['bag-b','bag-r','bag-g'][i],{actorPoses:{[actor]:{holds:['bag-b','bag-r','bag-g'][i]}}});
}

// Visible freshness, tasting reactions and matched price contrasts give these
// adjectives evidence beyond their occurrence in a sentence.
for(const [i,word]of['pain','fromage','poisson'].entries()) {
 const object=`quality-${i}`, old=`quality-old-${i}`, actor=`taster-${i}`;
 prop(object,['bread','cheese','fish'][i],[-15+i*12,19],{size:.75,detail:'fresh',label:word});
 prop(old,['bread','cheese','fish'][i],[-12+i*12,19],{size:.75,detail:'stale',label:word});
 prop(actor,'npc-female',[-14+i*12,17],{detail:'pleased',color:['#a8785c','#88926e','#798ea0'][i],pose:{holds:object}});
 say(`fresh-${i}`,actor,`${i===0?'Pain':i===1?'Fromage':'Poisson'} frais.`,{kind:'concept',detail:`frais:${i}`},object);
 say(`good-${i}`,actor,`${i===0?'Pain':i===1?'Fromage':'Poisson'} bon !`,{kind:'concept',detail:`bon:${i}`},object,{actorPoses:{[actor]:{holds:object}}});
 const expensive=`expensive-${i}`, cheap=`cheap-${i}`;
 prop(expensive,['bread','cheese','bag'][i],[-17+i*12,4],{label:`${[10,50,100][i]} €`,size:.7});
 prop(cheap,['bread','cheese','bag'][i],[-14+i*12,4],{label:`${[1,5,10][i]} €`,size:.7});
 line(`dear-${i}`,expensive,'cher',{kind:'concept',detail:`cher:${i}`});
 // Whole collections vary their objects and supports: groceries, a complete
 // breakfast tray, then a stack of correspondence and tools.
 const all=`all-${i}`;
 prop(all,['basket','tray','shelf'][i],[-15+i*12,1],{size:.8,...(i===0?{container:true,open:true}:{})});
 for(let n=0;n<3;n++)prop(`${all}-${n}`,[['bread','apple','cheese'],['egg','bottle-milk','fish'],['book','key','letter']][i][n],[-15+i*12,1],{size:.35,placement:{target:all,relation:i===0?'in':'on',offset:[(n-1)*.4,0,0]}});
 line(`all-${i}`,all,'tout',{kind:'concept',detail:`tout:${i}`});
}
// Replace the former vague "avec le panier" bottle line by a real placement.
line('water-location','bottle-green','Eau.',p('water'));
say('bottle-location','luc','La bouteille verte est sur la table.',p('position','sur:bottle-table'),'water-on-table');

const clues=[
 line('task-bread','order','Prends les pains dans le panier rouge.',p('basket'),'note'),
 line('task-pack-bread','order','Dans le sac sous le panier rouge.',p('bag'),'note'),
 line('task-apples','order','Prends les pommes dans le panier bleu.',p('basket'),'note'),
 line('task-pack-apples','order','Dans le sac sous le panier rouge.',p('bag'),'note'),
 line('task-cheese','order','Prends le fromage sous la table rouge.',p('cheese'),'note'),
 line('task-pack-cheese','order','Dans le sac sous le panier rouge.',p('bag'),'note'),
 line('task-payment','order','Paie tout. Deux pains, cinq pommes, un fromage.',p('money'),'note'),
 say('task-pay-person','paul','Pour lui. Il a la bouteille verte.',p('grammar','il')),
 line('task-bag','order','Prends le sac sous le panier rouge.',p('bag'),'note'),
 say('task-bag-person','paul','Pour elle. Elle a la clé verte.',p('grammar','elle')),
 line('task-letter','order','Prends la lettre sous le panier jaune.',p('letter'),'note'),
 say('task-letter-person','paul','Pour elle. Elle a la clé verte.',p('letter')),
];
// The addressed people identify themselves without restating the descriptive clue.
say('reply-luc','luc','J’ai de l’eau.',p('water'));
say('reply-claire','claire','J’ai la clé.',p('key'));
say('courier-destination','claire','Au café.',p('letter'));

function page(id:string,words:string[],pictures:Picture[],kind:JournalPage['kind']='vocabulary',requiresEvidence?:string[]):JournalPage {
 return {id:`marche-v2-${id}`,title:/^N/.test(id)?['Ⅷ','Ⅸ','Ⅹ','Ⅺ','Ⅻ'][Number(id.slice(1))-1]:id,zone:'marche',kind,words,slots:words.map((answer,i)=>({id:`marche-v2-${id}-${i}`,answer,picture:pictures[i]})),requiresEvidence:requiresEvidence??evidence.filter(entry=>words.some(word=>entry.text.toLocaleLowerCase('fr').includes(word))).map(entry=>entry.id)};
}
const pages:JournalPage[]=[
 page('Ⅰ',['pain','pomme','fromage','eau'],[p('bread'),p('apple'),p('cheese'),p('water')]),
 page('Ⅱ',['œuf','lait','poisson','fruit','légume'],['œuf','lait','poisson','fruit','légume'].map(word=>p('concept',`${word}:0`))),
 page('Ⅲ',['panier','sac','marché','euro','bouteille'],[p('concept','panier:0'),p('concept','sac:0'),p('concept','marché:0'),p('market-vignette','currency'),p('bottle')]),
 ...[0,5,10,15,20].map((start,i)=>page(`N${i+1}`,numbers.slice(start,start+5).map(([id])=>id),numbers.slice(start,start+5).map(([, ,count])=>({kind:'quantity',detail:'money',count,label:String(count)})),'grammar',numbers.slice(start,start+5).flatMap(([id])=>[0,1,2].map(c=>`marche-v2-e-number-${id}-${c}`)))),
 page('Ⅳ',['vouloir','acheter','payer'],[p('action','vouloir'),p('action','acheter'),p('concept','payer:0')],'grammar',exchangeObjects.flatMap((_,i)=>['want','buy','pay'].map(action=>`marche-v2-e-${action}-${i}`))),
 page('ⅩⅢ',['veux','veut','voulons','voulez'],['je','elle','nous','vous'].map(pronoun=>p('grammar',pronoun)),'grammar',[0,1,2].flatMap(i=>[`marche-v2-e-want-${i}`,`marche-v2-e-want-third-${i}`,`marche-v2-e-want-group-${i}`,`marche-v2-e-want-address-${i}`])),
 page('Ⅴ',['donner','prendre','coûter'],[p('action','donner'),p('action','prendre'),p('concept','coûter:0')],'grammar',exchangeObjects.flatMap((_,i)=>['give','take','cost'].map(action=>`marche-v2-e-${action}-${i}`))),
 page('Ⅵ',['ne…pas','avec','sans'],[p('grammar','negative'),p('basket','full'),p('basket','empty')],'grammar',[0,1,2].flatMap(i=>['negative','with','without'].map(action=>`marche-v2-e-${action}-${i}`))),
 page('Ⅶ',['tout','cher','frais','bon'],['tout','cher','frais','bon'].map(word=>p('concept',`${word}:0`)),'grammar',[0,1,2].flatMap(i=>['all','dear','fresh','good'].map(action=>`marche-v2-e-${action}-${i}`))),
];
const zone:Zone={id:'marche',design:'situated',title:'Le marché',subtitle:'',intro:'',color:'#d7b48a',accent:'#b94f36',scenery:['Luc','Claire','Paul','Anne','Marc','Émile','Hugo','Léa','Rose','Eva'],scene,evidence,pages,encounterOrder:evidence.map(entry=>entry.id),puzzle:{id:'marche-v2-commande',legacyIds:['marche-panier'],title:'✦',instruction:'',success:'Au café.',requiredPages:pages.map(entry=>entry.id),steps:[],world:{exit:'claire',clues,sequence:[
 {kind:'take',object:'order-bread'}, {kind:'place',object:'order-bread',target:'bag-b',relation:'in'},
 {kind:'take',object:'order-apples'}, {kind:'place',object:'order-apples',target:'bag-b',relation:'in'},
 {kind:'take',object:'order-cheese'}, {kind:'place',object:'order-cheese',target:'bag-b',relation:'in'},
 {kind:'take',object:'pay-20'}, {kind:'deliver',object:'pay-20',target:'luc'},
 {kind:'take',object:'bag-b'}, {kind:'deliver',object:'bag-b',target:'claire'},
 {kind:'take',object:'letter-blue'}, {kind:'deliver',object:'letter-blue',target:'claire'},
]}}};
export const zoneLexicon:Lexeme[]=[];
export default zone;
