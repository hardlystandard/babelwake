import type { Zone, Lexeme, Evidence, JournalPage, Picture, SceneObject, WorldAction } from '../types';

/** Three working tables share a counter, a terrace and a little reading corner.
 * Labels name actual things; the dialogue never becomes a conjugation list. */
const scene:SceneObject[]=[
 {id:'counter',kind:'counter',position:[0,-7],size:[3.5,1,1],label:'café',accepts:['on','under']},
 {id:'terrace',kind:'table',position:[-8,3],label:'table rouge',color:'rouge',accepts:['on','under']},
 {id:'reading',kind:'table',position:[8,3],label:'table verte',color:'verte',accepts:['on','under']},
 {id:'service-wing',kind:'table',position:[8,-7],accepts:['on','under']},
 {id:'window',kind:'window',position:[8,-9],label:'fenêtre'},
 {id:'door',kind:'door',position:[-10,-8],label:'porte',operations:['open','close'],open:true},
 {id:'paul',kind:'npc-male',position:[-4,-2],label:'Paul',recipient:true,detail:'talk'},
 {id:'emile',kind:'npc-male',position:[1,-5],label:'Émile',recipient:true,detail:'server talk'},
 {id:'lea',kind:'npc-female',position:[-6,0],label:'Léa',recipient:true,detail:'server request'},
 {id:'marie',kind:'npc-female',position:[6,0],label:'Marie',recipient:true,detail:'server thanks'},
 {id:'claire',kind:'npc-female',position:[10,3],label:'Claire',recipient:true,detail:'drink:tea',pose:{holds:'book-red'}},
 {id:'anne',kind:'npc-female',position:[-10,3],label:'Anne',recipient:true,detail:'eat:bread'},
 {id:'luc',kind:'npc-male',position:[0,5],label:'Luc',recipient:true,detail:'drink:coffee'},
 {id:'book-red',kind:'book',position:[10,3],color:'rouge',label:'livre rouge',containedBy:'claire'},
 {id:'key-yellow',kind:'key',position:[1,-5],color:'jaune',label:'clé jaune',containedBy:'emile'},
 {id:'jeanne',kind:'npc-female',position:[1,6],label:'Jeanne',detail:'drink:water'},
 {id:'hugo',kind:'npc-male',position:[3,3],label:'Hugo',detail:'eat:cheese'},
 {id:'iris',kind:'npc-female',position:[-3,3],label:'Iris',detail:'eat:apple'},
 {id:'milk-hot',kind:'milk',position:[2,-7],label:'lait chaud',detail:'hot'},
 {id:'milk-cold',kind:'milk',position:[7,3],label:'lait froid',detail:'cold'},
 {id:'coffee-very-hot',kind:'coffee',position:[-3,-7],label:'café',detail:'very-hot'},
 {id:'tea-very-hot',kind:'tea',position:[-8,4],label:'thé',detail:'very-hot'},
 {id:'milk-very-cold',kind:'milk',position:[8,4],label:'lait',detail:'very-cold'},
 {id:'service',kind:'notice',position:[0,-10]},
];
const evidence:Evidence[]=[];
const line=(id:string,anchor:string,text:string,picture:Picture,surface:Evidence['surface']='top',extra:Partial<Evidence>={}):string=>{
 const object=scene.find(o=>o.id===anchor)!; const key=`cafe-v2-e-${id}`;
 evidence.push({id:key,title:key,anchor,text,words:[],picture,position:[...object.position],kind:surface==='speech'?'person':surface==='note'?'note':'object',surface,...extra}); return key;
};
const speech=(id:string,actor:string,text:string,picture:Picture,pointsTo?:string,extra:Partial<Evidence>={})=>{
 const carrying=/(?:je|tu|il|elle|nous|vous)\s+(porte|portes|portez|portons|portent)\b/iu.exec(text)?.[1].toLocaleLowerCase('fr');
 return line(id,actor,text,picture,'speech',{...(pointsTo?{pose:{pointsTo}}:{}),...(carrying?{senses:{[carrying]:'porter'}}:{}),...extra});
};
const pic=(name:string,v=0):Picture=>({kind:'concept',detail:`${name}:${v}`});
const places=['counter','terrace','reading'];
const staff=['emile','lea','marie']; const guests=['luc','anne','claire'];
const items:[string,string,string,Picture][]=[
 ['coffee','coffee','café',{kind:'coffee'}],['tea','tea','thé',{kind:'tea'}],['cup','cup','tasse',{kind:'cup'}],['glass','glass','verre',{kind:'glass'}],
 ['plate','plate','assiette',{kind:'plate'}],['spoon','spoon','cuillère',{kind:'spoon'}],['sugar','sugar','sucre',{kind:'sugar'}],['menu','menu','menu',{kind:'book',detail:'menu'}],['receipt','receipt','addition',pic('addition')],
];
// The three settings differ physically: loose stock, a meal in progress, then
// the table where a reader has finished. Small props are kept on real surfaces.
for(const [p,parent]of places.entries()){
 const [x,z]=scene.find(o=>o.id===parent)!.position;
 for(const [i,[id,kind,label,picture]]of items.entries()){
  const key=`${id}-${p}`; const dx=(i%3-1)*.8,dz=(Math.floor(i/3)-1)*.6;
  scene.push({id:key,kind,position:[x+dx,z+dz],label,detail:kind==='coffee'||kind==='tea'?(p===2?'cold':'hot'):kind==='cup'?'empty':undefined,portable:['coffee','tea','spoon','menu'].includes(id),placement:{target:parent,relation:'on',offset:[dx,0,dz]},size:kind==='menu'?.55:.6});
  line(`label-${key}`,key,label,{...picture,...(id==='receipt'?{label:`${p+2} € + 1 € = ${p+3} €`}:{})},'top',{offset:[.3,0,.3]});
 }
}
for(const id of ['coffee-very-hot','tea-very-hot','milk-very-cold']){const object=scene.find(o=>o.id===id)!;line(`intense-${id}`,id,object.label!,{kind:object.kind});}
// Early words name the actors' observable roles. The same person requests,
// receives and eats/drinks; the apron and tray distinguish a server from a guest.
for(const [i,actor]of staff.entries())speech(`role-server-${i}`,actor,'serveur',pic('serveur',i),undefined,{demonstration:{actor,action:{kind:'deliver',object:`coffee-${i}`,target:guests[i]}}});
for(const [i,actor]of guests.entries())speech(`role-client-${i}`,staff[i],'client',pic('client',i),actor,{actorPoses:{[actor]:{holds:`menu-${i}`}}});
scene.push({id:'tray-held',kind:'tray',position:[1,-5],label:'plateau',containedBy:'emile'});
line('tray-introduction','tray-held','plateau',{kind:'tray'});
line('table-introduction','counter','La table.',{kind:'table'});
line('price-introduction','receipt-0','deux euros',{kind:'price',label:'2 €'});
speech('drink-introduction','luc','Je bois.',{kind:'action',detail:'boire'});
speech('drink-together-introduction','paul','Nous buvons.',pic('ensemble'));
speech('you-want-introduction','emile','Vous voulez ?', {kind:'grammar',detail:'wish'},'luc');
// Ground articles and ordinary connective forms through already familiar props.
for(const [i,actor]of staff.entries()){
 speech(`cup-reference-${i}`,actor,'La tasse est sur la table.',{kind:'position',detail:'sur:cup-table'},`cup-${i}`);
 speech(`tea-reference-${i}`,actor,'Le thé est dans la tasse.',{kind:'tea'},`tea-${i}`);
}
const language:[string,string[],Picture][]=[
 ['bonjour',['Bonjour !','Bonjour, Anne !','Bonjour, Claire !'],{kind:'person',detail:'greeting'}],
 ['wish',['Je voudrais du café.','Je voudrais du thé.','Je voudrais une cuillère.'],{kind:'grammar',detail:'wish'}],
 ['please',['Un café, s’il vous plaît.','Du thé, s’il vous plaît.','Une cuillère, s’il vous plaît.'],{kind:'grammar',detail:'please'}],
 ['thanks',['Merci pour le café.','Merci pour le thé.','Merci pour la cuillère.'],{kind:'person',detail:'thanks'}],
 ['where',['Où est la tasse ?','Où est le verre ?','Où est le menu ?'],{kind:'grammar',detail:'où'}],
 ['how-much',['Combien coûte le café ?','Combien coûte le thé ?','Combien coûte le pain ?'],{kind:'grammar',detail:'combien'}],
 ['identify',['Qu’est-ce que c’est ?','Qu’est-ce que tu veux ?','Qu’est-ce que vous avez ?'],{kind:'grammar',detail:"qu'est-ce que"}],
 ['yes-no',['Est-ce que tu veux du café ?','Est-ce que vous voulez du thé ?','Est-ce que vous voulez une cuillère ?'],{kind:'grammar',detail:'est-ce que'}],
 ['drinks',['Il boit du café.','Elle boit du thé.','Elle boit de l’eau.'],{kind:'action',detail:'boire'}],
 ['eats',['Elle mange du pain.','Il mange du fromage.','Elle mange une pomme.'],{kind:'action',detail:'manger'}],
 ['talks',['Il parle avec Anne.','Elle parle avec Paul.','Elle parle avec Luc.'],{kind:'cafe-vignette',detail:'talk'}],
 ['hot',['Le café est chaud.','Le thé est chaud.','Le lait est chaud.'],pic('chaud')],
 ['cold',['Le café est froid.','Le thé est froid.','Le lait est froid.'],pic('froid')],
 ['again',['Encore du café, s’il vous plaît.','Encore du thé, s’il vous plaît.','Encore du pain, s’il vous plaît.'],pic('encore')],
 ['also',['Paul a aussi du café.','Anne a aussi du thé.','Claire a aussi du pain.'],pic('aussi')],
 ['well',['Tu portes bien le plateau.','Vous portez bien le plateau.','Elle porte bien le plateau.'],pic('bien')],
 ['very',['Le café est très chaud.','Le thé est très chaud.','Le lait est très froid.'],pic('très')],
 ['bye',['À bientôt, Paul !','À bientôt, Anne !','À bientôt, Claire !'],pic('à bientôt')],
 ['evening',['Bonsoir, Paul !','Bonsoir, Anne !','Bonsoir, Claire !'],pic('bonsoir')],
 ['sorry',['Pardon, Paul !','Pardon, Anne !','Pardon, Claire !'],pic('pardon')],
 ['excuse',['Excusez-moi pour le café.','Excusez-moi pour le thé.','Excusez-moi pour le verre.'],pic('excuser')],
 ['wait',['Attendez ici, s’il vous plaît.','Attendez devant la porte.','Attendez devant la table.'],pic('attendre')],
 ['reply',['Réponds : du café ?','Réponds : du thé ?','Réponds : une cuillère ?'],pic('répondre')],
 ['hours',['Une heure.','Deux heures. Une heure après.','Trois heures. Une heure après.'],{kind:'clock',label:'01:00'}],
 ['now',['Maintenant, je bois du café.','Maintenant, je prends le pain.','Maintenant, je lis le menu.'],pic('maintenant')],
 ['before',['Avant, la tasse est sur la table.','Avant, le pain est sur l’assiette.','Avant, la porte est fermée.'],pic('avant')],
 ['after',['Après, la tasse est sur la table.','Après, l’assiette est sur la table.','Après, la porte est ouverte.'],pic('après')],
 ['then',['Je prends la tasse, puis je bois.','Je prends le pain, puis je mange.','Je prends le menu, puis je lis.'],pic('puis')],
 ['together',['Nous buvons ensemble.','Nous mangeons ensemble.','Nous lisons ensemble.'],pic('ensemble')],
];
for(const [i,parent]of places.entries()){
 const [x,z]=scene.find(o=>o.id===parent)!.position;
 scene.push({id:`spill-${i}`,kind:i===1?'npc-female':'npc-male',detail:'spill',position:[x+2,z+1],color:['#87999b','#bd876e','#a392a7'][i]});
}
const witnesses:Record<string,string[]>={};
// Real service counterparts and reference objects vary with the exchange.
const references=['coffee-0','tea-1','spoon-2'];
for(let i=0;i<3;i++)scene.push({id:`clock-${i}`,kind:'clock',position:[-7+i*7,-10],value:(i+1)*100});
for(const [lesson,texts,picture]of language){
 if(['before','now','after','then'].includes(lesson))continue;
 witnesses[lesson]=texts.map((text,i)=>{
  const actor=['sorry','excuse'].includes(lesson)?`spill-${i}`:['thanks','wish','please','again','where','how-much','identify','yes-no','sorry','excuse'].includes(lesson)?guests[i]:staff[i];
  const target=lesson==='very'?['coffee-very-hot','tea-very-hot','milk-very-cold'][i]:lesson==='where'?['cup-0','glass-1','menu-2'][i]:lesson==='how-much'?['coffee-0','tea-1','bread-plain'][i]:lesson==='identify'?['cup-0','tea-1','sugar-2'][i]:lesson==='again'?['coffee-0','tea-1','bread-plain'][i]:lesson==='hours'?`clock-${i}`:lesson==='drinks'?['luc','claire','jeanne'][i]:lesson==='eats'?['anne','hugo','iris'][i]:lesson==='hot'?['coffee-0','tea-0','milk-hot'][i]:lesson==='cold'?['coffee-2','tea-2','milk-cold'][i]:lesson==='talks'?['anne','paul','luc'][i]:references[i];
  return speech(`${lesson}-${i}`,actor,text,{...picture,...(picture.kind==='concept'?{detail:`${picture.detail!.split(':')[0]}:${i}`}:{})},target,lesson==='well'?{actorPoses:{[actor]:{holds:['tray-window','tray-terrace','tray-reading'][i]}}}:lesson==='also'?{actorPoses:{[['paul','anne','claire'][i]]:{holds:['coffee-0','tea-1','bread-plain'][i]}}}:{});
 });
}
// A sideboard carries three small service histories. Each one depicts the
// same item before, during and after its use, with a clock and a directional
// arrow; no hidden picture field is used as evidence of time.
for(const [phaseIndex,phase]of ['before','now','after'].entries()){
 const key=phase==='before'?'before':phase==='now'?'now':'after'; witnesses[key]=[];
 for(const [i,action]of ['drink:coffee','eat:bread','open:door'].entries()){
  const id=`history-${action.split(':')[0]}-${phase}`;
  scene.push({id,kind:'timeline',detail:`${action}:${phase}`,position:[-9+i*7,8+phaseIndex*3],size:.9});
  const text=phase==='before'?['Avant, la tasse est pleine.','Avant, le pain est sur l’assiette.','Avant, la porte est fermée.'][i]:phase==='now'?['Maintenant, il boit.','Maintenant, il mange.','Maintenant, il ouvre la porte.'][i]:['Après, la tasse est vide.','Après, l’assiette est vide.','Après, la porte est ouverte.'][i];
  witnesses[key].push(line(`chronology-${phase}-${i}`,id,text,pic(phase==='now'?'maintenant':phase==='before'?'avant':'après',i),'note',{offset:[0,0,.9]}));
 }
}
witnesses.then=[];
for(const [i,id]of ['history-drink-now','history-eat-now','history-open-now'].entries())witnesses.then.push(line(`chronology-then-${i}`,id,['Il prend la tasse, puis il boit.','Il prend le pain, puis il mange.','Il prend la clé, puis il ouvre.'][i],pic('puis',i),'note',{offset:[0,0,.9]}));
// Evening greetings come from late windows and clocks, not a daytime wave.
for(const [i,name]of ['Paul','Anne','Claire'].entries()){
 const id=`night-window-${i}`;
 scene.push({id,kind:'window',detail:'night',position:[-10+i*7,-12],size:.7});
 speech(`evening-context-${i}`,staff[i],`Bonsoir, ${name} !`,pic('bonsoir',i),id);
}
// Replies refer to the same cup, location, price or offer as the question.
for(const [i,actor]of staff.entries()){
 speech(`answer-where-${i}`,actor,['Sur la table.','Sous le menu.','Dans le café.'][i],{kind:'position',detail:'sur:cup-table'},['cup-0','glass-1','menu-2'][i]);
 speech(`answer-price-${i}`,actor,['Deux euros.','Trois euros.','Un euro.'][i],{kind:'price',label:["2 €","3 €","1 €"][i]},['coffee-0','tea-1','bread-plain'][i]);
 speech(`answer-what-${i}`,actor,['C’est une tasse.','Je veux du thé.','Nous avons du sucre.'][i],{kind:'cup'},['cup-0','tea-1','sugar-2'][i]);
 speech(`answer-yes-${i}`,actor,i===1?'Non, merci.':'Oui, merci.',{kind:'grammar',detail:'yes-no'},references[i]);
}
// Familiar friends and unfamiliar service encounters use the same subject matter,
// so the learner cannot mistake tu/vous for a particular drink or action.
for(const [i,noun]of ['café','thé','pain'].entries()){
 speech(`familiar-${i}`,guests[i],`Tu veux du ${noun} ?`,{kind:'grammar',detail:'tu-polite'},guests[(i+1)%3]);
 speech(`formal-${i}`,staff[i],`Vous voulez du ${noun} ?`,{kind:'grammar',detail:'vous-polite'},guests[i]);
 speech(`inversion-want-${i}`,staff[i],`Voulez-vous du ${noun} ?`,{kind:'grammar',detail:'inversion'},guests[i]);
 speech(`inversion-have-${i}`,staff[i],['Avez-vous une tasse ?','Avez-vous une cuillère ?','Avez-vous le menu ?'][i],{kind:'grammar',detail:'possession'},guests[i]);
 speech(`inversion-are-${i}`,staff[i],['Êtes-vous avec Paul ?','Êtes-vous avec Anne ?','Êtes-vous avec Claire ?'][i],{kind:'grammar',detail:'inversion'},guests[i]);
}

// The service has three empty trays. The requested one is under the window.
scene.push(
 {id:'tray-window',kind:'tray',position:[8,-7],label:'①',portable:true,accepts:['on']},
 {id:'tray-terrace',kind:'tray',position:[-8,3],label:'plateau rouge',color:'rouge',portable:true,accepts:['on']},
 {id:'tray-reading',kind:'tray',position:[8,3],label:'plateau vert',color:'vert',portable:true,accepts:['on']},
 {id:'tea-plain',kind:'tea',position:[5,-7],size:.65,label:'tasse bleue',color:'bleue',detail:'hot',portable:true},
 {id:'tea-milk',kind:'tea',position:[3,-7],label:'tasse bleue au lait',color:'bleue',detail:'milk',portable:true},
 {id:'bread-plain',kind:'bread',position:[-3,-7],size:.65,label:'pain',portable:true},
 {id:'bread-milk',kind:'bread',position:[-5,-7],label:'pain au lait',detail:'milk',portable:true},
 {id:'spoon-service',kind:'spoon',position:[5,-7],size:.7,label:'cuillère',portable:true,placement:{target:'plate-service',relation:'under'}},
 {id:'plate-service',kind:'plate',position:[5,-7],label:'assiette de thé',accepts:['on','under'],placement:{target:'counter',relation:'on',offset:[2,0,0]}},
 {id:'spoon-decoy',kind:'spoon',position:[-8,3],label:'cuillère pour thé',portable:true},
 {id:'letter-service',kind:'letter',position:[0,-7],label:'lettre bleue',color:'bleue',portable:true,placement:{target:'receipt-green',relation:'under'}},
 {id:'letter-decoy',kind:'letter',position:[-8,3],label:'lettre verte',color:'verte',portable:true},
 {id:'receipt-green',kind:'receipt',position:[0,-7],label:'addition verte',color:'verte',accepts:['under']},
 {id:'payment-two',kind:'money',position:[-4,-5],label:'2 €',value:2,portable:true},
 {id:'payment-four',kind:'money',position:[-2,-5],label:'4 €',value:4,portable:true},
 {id:'payment-five',kind:'money',position:[0,-5],label:'5 €',value:5,portable:true},
);
// Food, crockery and money rest on working surfaces, never on the floor.
const stock:Record<string,[string,number,number]>={
 'milk-hot':['counter',1.8,.8],'milk-cold':['reading',-1.2,.7],
 'coffee-very-hot':['counter',-1.8,-.8],'tea-very-hot':['terrace',-1.3,.8],'milk-very-cold':['reading',.7,.8],
 'bread-plain':['counter',-3.4,.1],'bread-milk':['counter',-5,.1],
 'tea-milk':['counter',5,.2],'spoon-decoy':['terrace',1.3,.7],
 'receipt-green':['counter',4.5,-.6],
 'payment-two':['counter',-4,.7],'payment-four':['counter',-2,.7],'payment-five':['counter',0,.7],
 'tray-window':['service-wing',0,0],
};
for(const [id,[target,x,z]]of Object.entries(stock)){
 const object=scene.find(o=>o.id===id)!;object.placement={target,relation:'on',offset:[x,0,z]};
}
scene.find(o=>o.id==='tea-plain')!.placement={target:'plate-service',relation:'on'};
scene.find(o=>o.id==='letter-decoy')!.placement={target:'terrace',relation:'under'};
// Two narrow tray stands keep alternatives physically usable beside the tables.
for(const [trayId,parent,x,z]of [['tray-terrace','stand-terrace',-11,6],['tray-reading','stand-reading',11,6]] as [string,string,number,number][]){
 scene.push({id:parent,kind:'table',position:[x,z],size:.7,accepts:['on','under']});
 const tray=scene.find(o=>o.id===trayId)!;tray.position=[x,z];tray.placement={target:parent,relation:'on'};
}
// Each tray is a work surface whose load can be carried together.
for(const [i,id]of ['tray-window','tray-terrace','tray-reading'].entries()){
 line(`tray-label-${i}`,id,'plateau',{kind:'tray'});
 speech(`carry-${i}`,staff[i],'Je porte le plateau.',pic('bien',i),undefined,{actorPoses:{[staff[i]]:{holds:id}}});
}
// Ground the support words and attributes before the commission introduces them.
for(const object of scene.filter(o=>!evidence.some(e=>e.anchor===o.id)&&o.label))line(`fixture-${object.id}`,object.id,object.label!,{kind:object.kind});
line('menu-price-tea','menu-0','thé 3 €',{kind:'price',label:'3 €'});
line('menu-price-bread','menu-0','pain 1 €',{kind:'price',label:'1 €'});
const clues=[
 line('task-tea','service','Prends la tasse bleue sans lait.',{kind:'tea'},'note'),
 line('task-place-tea','service','Sur le plateau sous la fenêtre.',{kind:'position',detail:'sur:cup-table'},'note'),
 line('task-bread','service','Prends le pain sans lait.',{kind:'bread'},'note'),
 line('task-place-bread','service','Sur le plateau sous la fenêtre.',{kind:'position',detail:'sur:bread-table'},'note'),
 line('task-spoon','service','Prends la cuillère sous l’assiette de thé.',{kind:'spoon'},'note'),
 line('task-place-spoon','service','Sur le plateau sous la fenêtre.',{kind:'spoon'},'note'),
 line('task-tray','service','Prends le plateau sous la fenêtre.',{kind:'tray'},'note'),
 speech('task-guest','paul','Pour elle. Elle a le livre rouge.',{kind:'grammar',detail:'elle'}),
 line('task-payment','service','Le thé coûte trois euros. Le pain coûte un euro.',{kind:'price',label:'3 € + 1 €'},'note'),
 speech('task-payee','paul','Pour le serveur avec la clé jaune.',pic('serveur')),
 line('task-letter','service','Prends la lettre sous l’addition verte.',{kind:'letter'},'note'),
 speech('task-post','paul','Pour le serveur avec la clé jaune.',pic('serveur')),
];
speech('finish-claire','claire','Merci.',{kind:'person',detail:'thanks'});
speech('finish-emile','emile','La gare.',{kind:'train'});

const pages:JournalPage[]=[];
function page(key:string,words:string[],pictures:Picture[],kind:JournalPage['kind']='vocabulary',lessons:string[]=[]){
 const id=`cafe-v2-${key}`;
 const required=lessons.flatMap(lesson=>witnesses[lesson]??[]);
 pages.push({id,title:String(pages.length+1),zone:'cafe',kind,words,requiresEvidence:required.length?required:items.flatMap(([item])=>places.map((_,i)=>`cafe-v2-e-label-${item}-${i}`)).filter(id=>evidence.find(e=>e.id===id)?.text&&words.some(word=>evidence.find(e=>e.id===id)!.text.includes(word))),slots:words.map((answer,i)=>({id:`${id}-${i}`,answer,picture:pictures[i]}))});
}
page('drinks',['café','thé','tasse','verre'],[{kind:'coffee'},{kind:'tea'},{kind:'cup'},{kind:'glass'}]);
page('table',['assiette','cuillère','sucre','menu'],['assiette','cuillère','sucre','menu'].map(id=>pic(id)));
page('roles',['serveur','client','addition'],['serveur','client','addition'].map(id=>pic(id)));
page('courtesy',['bonjour','merci','s’il vous plaît','je voudrais'],[{kind:'person',detail:'greeting'},{kind:'person',detail:'thanks'},{kind:'grammar',detail:'please'},{kind:'grammar',detail:'wish'}],'grammar',['bonjour','thanks','please','wish']);
page('questions',['où','combien','qu’est-ce que','est-ce que'],['où','combien',"qu'est-ce que",'est-ce que'].map(detail=>({kind:'grammar',detail})),'grammar',['where','how-much','identify','yes-no']);
page('actions',['boire','manger','parler'],[{kind:'action',detail:'boire'},{kind:'action',detail:'manger'},{kind:'cafe-vignette',detail:'talk'}],'grammar',['drinks','eats','talks']);
page('sensation',['chaud','froid','très','bien'],['chaud','froid','très','bien'].map(id=>pic(id)),'grammar',['hot','cold','very','well']);
page('attention',['bonsoir','pardon','à bientôt'],['bonsoir','pardon','à bientôt'].map(id=>pic(id)),'grammar',['evening','sorry','bye']);
page('requests',['excuser','s’il vous plaît','répondre'],[pic('excuser'),{kind:'grammar',detail:'please'},pic('répondre')],'grammar',['excuse','please','reply']);
page('conversation',['attendre','répondre','encore','aussi','ensemble'],['attendre','répondre','encore','aussi','ensemble'].map(id=>pic(id)),'grammar',['wait','reply','again','also','together']);
page('moments',['avant','maintenant','après','puis','heure'],[pic('avant'),pic('maintenant'),pic('après'),pic('puis'),{kind:'clock',label:'01:00'}],'grammar',['before','now','after','then','hours']);
page('carrying',['plateau','porter','ensemble'],[{kind:'tray'},{kind:'cafe-vignette',detail:'carry'},pic('ensemble')],'grammar',['together','well']);
page('people',['tu','vous','je voudrais'],[{kind:'grammar',detail:'tu-polite'},{kind:'grammar',detail:'vous-polite'},{kind:'grammar',detail:'wish'}],'grammar',['wish','yes-no']);
page('inversions',['voulez-vous','avez-vous','êtes-vous'],[{kind:'grammar',detail:'wish'},{kind:'grammar',detail:'possession'},{kind:'grammar',detail:'vous-polite'}],'grammar',['yes-no','wish','identify']);

const encounterOrder=evidence.map(e=>e.id);
for(const [question,reply]of [['where','answer-where'],['how-much','answer-price'],['identify','answer-what'],['yes-no','answer-yes']])for(let i=0;i<3;i++){
 const answer=`cafe-v2-e-${reply}-${i}`; encounterOrder.splice(encounterOrder.indexOf(answer),1);
 encounterOrder.splice(encounterOrder.indexOf(`cafe-v2-e-${question}-${i}`)+1,0,answer);
}
const zone:Zone={id:'cafe',design:'situated',title:'Le café',subtitle:'',intro:'',color:'#c0ad91',accent:'#446d61',scenery:['Paul','Claire','Anne','Luc','Jeanne','Hugo','Iris','Marie','Émile','Léa','moi','pleine','vide'],scene,evidence,pages,encounterOrder,puzzle:{id:'cafe-v2-service',legacyIds:['cafe-message'],title:'✦',instruction:'',success:'✧',steps:[],requiredPages:pages.map(p=>p.id),world:{exit:'door',clues,sequence:[
 {kind:'take',object:'tea-plain'},{kind:'place',object:'tea-plain',target:'tray-window',relation:'on'},
 {kind:'take',object:'bread-plain'},{kind:'place',object:'bread-plain',target:'tray-window',relation:'on'},
 {kind:'take',object:'spoon-service'},{kind:'place',object:'spoon-service',target:'tray-window',relation:'on'},
 {kind:'take',object:'tray-window'},{kind:'deliver',object:'tray-window',target:'claire'},
 {kind:'take',object:'payment-four'},{kind:'deliver',object:'payment-four',target:'emile'},
 {kind:'take',object:'letter-service'},{kind:'deliver',object:'letter-service',target:'emile'},
]}}};
export const zoneLexicon:Lexeme[]=[];
export default zone;
