import type { Zone, Lexeme, Evidence, JournalPage, Picture, SceneObject, WorldAction } from '../types';

/** The workshop teaches through these props; no sentence names an unseen object. */
const scene:SceneObject[]=[
 {id:'table-r',kind:'table',position:[-8,-2],color:'rouge',size:[1.25,1,1.1],label:'table rouge',accepts:['on','under']},
 {id:'table-b',kind:'table',position:[0,-3],color:'bleue',label:'table bleue',accepts:['on','under']},
 {id:'table-g',kind:'table',position:[8,-2],color:'verte',size:.9,label:'table verte',accepts:['on','under']},
 {id:'box-r',kind:'box',position:[-8,-2],color:'rouge',size:1.2,label:'boîte rouge',container:true,open:true,operations:['open','close'],accepts:['in','on','under'],placement:{target:'table-r',relation:'on'}},
 {id:'box-b',kind:'box',position:[-8,-2],color:'bleue',size:.56,label:'boîte bleue',container:true,open:true,operations:['open','close'],accepts:['in','on'],placement:{target:'table-r',relation:'under'}},
 {id:'box-y',kind:'box',position:[7,-6],color:'jaune',size:.9,label:'boîte jaune',container:true,open:true,operations:['open','close'],accepts:['in','on']},
 {id:'door-y',kind:'door',position:[-8,-10],color:'jaune',size:.68,label:'porte jaune',operations:['open','close'],toolKind:'key'},
 {id:'door-b',kind:'door',position:[0,-10],color:'bleue',size:.9,label:'porte bleue',operations:['open','close'],toolKind:'key'},
 {id:'door-g',kind:'door',position:[8,-10],color:'verte',size:1.35,label:'porte verte',operations:['open','close'],toolKind:'key'},
 {id:'chair-r',kind:'chair',position:[-8,6],color:'rouge',size:.8,label:'chaise rouge',accepts:['on','under']},
 {id:'chair-b',kind:'chair',position:[0,6],color:'bleue',size:.8,label:'chaise bleue',accepts:['on','under']},
 {id:'chair-g',kind:'chair',position:[8,6],color:'verte',size:1.2,label:'chaise verte',accepts:['on','under']},
 {id:'key-y',kind:'key',position:[-8,-2],color:'jaune',size:.58,label:'clé jaune',portable:true,placement:{target:'box-r',relation:'under'}},
 {id:'key-r',kind:'key',position:[-8,-2],color:'rouge',size:.4,label:'clé rouge',portable:true,placement:{target:'box-b',relation:'in'}},
 {id:'key-b',kind:'key',position:[0,-3],color:'bleue',size:.65,label:'clé bleue',portable:true,placement:{target:'table-b',relation:'on'}},
 {id:'key-g',kind:'key',position:[8,1],color:'verte',size:.65,label:'clé verte',portable:true,containedBy:'claire'},
 {id:'book-y',kind:'book',position:[-8,6],color:'jaune',size:.65,label:'livre jaune',portable:true,open:true,operations:['open','close'],placement:{target:'chair-r',relation:'on'}},
 {id:'book-b',kind:'book',position:[0,-3],color:'bleu',size:.8,label:'livre bleu',portable:true,open:true,operations:['open','close'],placement:{target:'table-b',relation:'on'}},
 {id:'book-r',kind:'book',position:[7,-6],color:'rouge',size:.5,label:'livre rouge',portable:true,open:true,operations:['open','close'],placement:{target:'box-y',relation:'in'}},
 {id:'letter-b',kind:'letter',position:[8,6],color:'bleue',size:.8,label:'lettre bleue',portable:true,placement:{target:'chair-g',relation:'on'}},
 {id:'letter-g',kind:'letter',position:[8,-2],color:'verte',size:.8,label:'lettre verte',portable:true,placement:{target:'table-g',relation:'on'}},
 {id:'letter-r',kind:'letter',position:[0,6],color:'rouge',size:.8,label:'lettre rouge',portable:true,placement:{target:'chair-b',relation:'under'}},
 {id:'paul',kind:'npc-male',position:[-4,2],color:'#87999b',recipient:true,label:'Paul'},
 {id:'claire',kind:'npc-female',position:[5,1],color:'#bd876e',recipient:true,label:'Claire',pose:{holds:'key-g'}},
 {id:'anne',kind:'npc-female',position:[-1,2],color:'#89966d',recipient:true,label:'Anne'},
 {id:'marie',kind:'npc-female',position:[7,3],color:'#a392a7',recipient:true,label:'Marie'},
 // Storage is part of the working room, not a set of individual teaching stands.
 {id:'storage',kind:'shelf',position:[-7,-7],size:.8,accepts:['on','under']},
 {id:'books-a',kind:'book',position:[-1,-3],color:'rouge',size:.33,open:true},
 {id:'books-b',kind:'book',position:[1,-3],color:'jaune',size:.33,open:true},
 {id:'keys-a',kind:'key',position:[7.4,-2],color:'jaune',size:.26},
 {id:'keys-b',kind:'key',position:[8,-2],color:'jaune',size:.26},
 {id:'keys-c',kind:'key',position:[8.6,-2],color:'jaune',size:.26},
 {id:'boxes-a',kind:'box',position:[-7.7,-7],color:'rouge',size:.3,open:true},
 {id:'boxes-b',kind:'box',position:[-7,-7],color:'bleue',size:.3,open:true},
 {id:'boxes-c',kind:'box',position:[-6.3,-7],color:'jaune',size:.3,open:true,container:true},
 {id:'letter-a',kind:'letter',position:[-6.3,-7],size:.15,containedBy:'boxes-c'},
 {id:'commission',kind:'notice',position:[-3,-7]},
];
// Place the small stock on its real work surfaces without stacking its meshes.
for(const id of ['books-a','books-b'])scene.find(o=>o.id===id)!.placement={target:'table-b',relation:'on'};
for(const id of ['keys-a','keys-b','keys-c'])scene.find(o=>o.id===id)!.placement={target:'table-g',relation:'on'};
for(const id of ['boxes-a','boxes-b','boxes-c'])scene.find(o=>o.id===id)!.placement={target:'storage',relation:'on'};
for(const [id,x,z]of [['books-a',-.9,0],['books-b',.9,0],['keys-a',-.65,0],['keys-b',0,0],['keys-c',.65,0],['boxes-a',-.65,0],['boxes-b',0,0],['boxes-c',.65,0],['key-b',.85,.42],['book-b',0,-.1],['letter-g',0,.48]] as [string,number,number][])scene.find(o=>o.id===id)!.placement!.offset=[x,0,z];

const evidence:Evidence[]=[];
function line(id:string,anchor:string,text:string,picture:Picture,surface:Evidence['surface']='top',extra:Partial<Evidence>={}):string {
 const object=scene.find(o=>o.id===anchor)!;
 const entry:Evidence={id:`atelier-v2-e-${id}`,title:`atelier-v2-e-${id}`,anchor,text,words:[],picture,position:[...object.position],kind:surface==='speech'?'person':surface==='note'?'note':'object',surface,...extra};
 evidence.push(entry);return entry.id;
}
function speech(id:string,actor:string,text:string,picture:Picture,pointsTo?:string,action?:WorldAction):string {
 return line(id,actor,text,picture,'speech',{...(pointsTo?{pose:{pointsTo}}:{}),...(action?{demonstration:{actor:action.kind==='take'||action.kind==='deliver'?actor:actor,action}}:{})});
}
const propPictures:Record<string,Picture>={
 'key-y':{kind:'position',detail:'sous:key-box'},'key-r':{kind:'position',detail:'dans:key-box'},'key-b':{kind:'key',color:'bleu'},'key-g':{kind:'action',detail:'avoir'},
 'book-y':{kind:'position',detail:'sur:book-chair'},'book-b':{kind:'book',color:'bleu'},'book-r':{kind:'position',detail:'dans:book-box'},
 'box-r':{kind:'box',color:'rouge',detail:'open'},'box-b':{kind:'position',detail:'sous:box-table'},'box-y':{kind:'position',detail:'dans:book-box'},
 'door-y':{kind:'door',color:'jaune'},'door-b':{kind:'action',detail:'ouvrir'},'door-g':{kind:'door',color:'vert',detail:'key'},
 'table-r':{kind:'table',detail:'key-book-box'},'table-b':{kind:'table',color:'bleu'},'table-g':{kind:'table',detail:'keys-letter'},
 'chair-r':{kind:'chair',color:'rouge'},'chair-b':{kind:'position',detail:'sous:letter-chair'},'chair-g':{kind:'position',detail:'sur:letter-chair'},
 'letter-b':{kind:'position',detail:'sur:letter-chair'},'letter-g':{kind:'letter'},'letter-r':{kind:'position',detail:'sous:letter-chair'},
};
// This order is a gentle path through one working room. Each line adds <=2 forms.
for(const id of ['key-y','key-r','book-y','book-b','box-r','box-y','box-b','key-b','key-g','door-g','door-y','door-b','book-r','table-r','table-b','table-g','chair-g','chair-r','chair-b','letter-b','letter-g','letter-r']) {
 line(`label-${id}`,id,scene.find(o=>o.id===id)!.label!,propPictures[id],'top',{offset:/key|book|letter/.test(id)?[.55,0,.28]:[0,0,0]});
}
line('stock-books','table-b','des livres',{kind:'quantity',detail:'book',count:3},'top',{offset:[-.9,0,.55]});
line('stock-keys','table-g','des clés',{kind:'quantity',detail:'key',count:3},'top',{offset:[0,0,.55]});
line('stock-boxes','storage','des boîtes',{kind:'quantity',detail:'box',count:3},'top',{offset:[0,0,.55]});

// A new member is requested, chosen, then the SAME member is referenced by
// a second requester. Both articles accompany the same hand-off action; roles
// rotate so neither article can mean a gesture, a character, or giving back.
const articlePairs:[string,string,string,string,string,string,Picture][]=[
 ['book-y','un livre','le livre','anne','paul','marie',propPictures['book-y']],
 ['book-b','un livre','le livre','paul','marie','anne',propPictures['book-b']],
 ['book-r','un livre','le livre','marie','anne','paul',propPictures['book-r']],
 ['key-b','une clé','la clé','paul','anne','marie',propPictures['key-b']],
 ['letter-g','une lettre','la lettre','anne','marie','paul',propPictures['letter-g']],
 ['boxes-a','une boîte','la boîte','marie','paul','anne',{kind:'box',color:'rouge'}],
];
for(const [object,introduction,reference,source,requester,nextRequester,picture]of articlePairs){
 const first=speech(`indefinite-${object}`,requester,introduction,picture,'table-b');
 const firstLine=evidence.find(e=>e.id===first)!;
 firstLine.actorPoses={[source]:{holds:object}};
 firstLine.demonstration={actor:source,action:{kind:'deliver',object,target:requester}};
 const second=speech(`definite-${object}`,nextRequester,reference,picture,object);
 const secondLine=evidence.find(e=>e.id===second)!;
 secondLine.actorPoses={[requester]:{holds:object}};
 secondLine.demonstration={actor:requester,action:{kind:'deliver',object,target:nextRequester}};
}
for(const [id,text,picture]of [
 ['table-b','les livres',{kind:'quantity',detail:'book',count:3}],['table-g','les clés',{kind:'quantity',detail:'key',count:3}],['storage','les boîtes',{kind:'quantity',detail:'box',count:3}],
] as [string,string,Picture][])speech(`plural-${id}`,'paul',text,picture,id);

for(const [id,target,text,picture]of [
 ['on-a','box-r','sur la table',{kind:'position',detail:'sur:box-table'}],['on-b','book-b','sur la table',{kind:'position',detail:'sur:book-table'}],['on-c','letter-b','sur la chaise',{kind:'position',detail:'sur:letter-chair'}],
 ['under-a','key-y','sous la boîte',{kind:'position',detail:'sous:key-box'}],['under-b','box-b','sous la table',{kind:'position',detail:'sous:box-table'}],['under-c','letter-r','sous la chaise',{kind:'position',detail:'sous:letter-chair'}],
 ['in-a','book-r','dans la boîte',{kind:'position',detail:'dans:book-box'}],['in-b','key-r','dans la boîte',{kind:'position',detail:'dans:key-box'}],['in-c','letter-a','dans la boîte',{kind:'position',detail:'dans:letter-box'}],
 ['large-a','table-r','grande table',{kind:'table',color:'rouge'}],['large-b','box-r','grande boîte',{kind:'box',color:'rouge',detail:'open'}],['large-c','chair-g','grande chaise',{kind:'chair',color:'vert'}],
] as [string,string,string,Picture][])speech(id,'paul',text,picture,target);

for(const [suffix,actor,object,noun,picture]of [
 ['a','claire','key-g','la clé',{kind:'action',detail:'avoir'}],
 ['b','anne','book-b','le livre',{kind:'book',color:'bleu'}],
 ['c','marie','letter-g','la lettre',{kind:'letter'}],
] as [string,string,string,string,Picture][]){
 const id=speech(`have-i-${suffix}`,actor,`J’ai ${noun}.`,picture);
 evidence.find(e=>e.id===id)!.actorPoses={[actor]:{holds:object}};
}
speech('identity-a','paul','La clé est rouge.',{kind:'key',color:'rouge'},'key-r');
speech('identity-b','paul','Le livre est bleu.',{kind:'book',color:'bleu'},'book-b');
speech('identity-c','paul','La boîte est jaune.',{kind:'box',color:'jaune'},'box-y');
for(const [suffix,object,noun,picture]of [
 ['a','key-g','la clé',{kind:'action',detail:'avoir'}],['b','book-b','le livre',{kind:'action',detail:'lire'}],['c','letter-g','la lettre',{kind:'action',detail:'donner'}],
] as [string,string,string,Picture][]) {
 const actor=suffix==='a'?'claire':suffix==='b'?'anne':'marie';
 const id=speech(`have-she-${suffix}`,'paul',`Elle a ${noun}.`,picture,actor);
 evidence.find(e=>e.id===id)!.actorPoses={[actor]:{holds:object}};
}
for(const [suffix,object,noun,picture]of [
 ['a','door-b','la porte',{kind:'action',detail:'ouvrir'}],['b','box-y','la boîte',{kind:'box',detail:'open'}],['c','book-b','le livre',{kind:'book'}],
] as [string,string,string,Picture][])speech(`open-${suffix}`,'paul',`Ouvre ${noun}.`,picture,object,{kind:'operate',object,operation:'open'});
for(const [suffix,object,noun,picture]of [
 ['a','door-b','la porte',{kind:'action',detail:'fermer'}],['b','box-b','la boîte',{kind:'box'}],['c','book-y','le livre',{kind:'book',detail:'closed'}],
] as [string,string,string,Picture][])speech(`close-${suffix}`,'claire',`Ferme ${noun}.`,picture,object,{kind:'operate',object,operation:'close'});
for(const [suffix,object,noun,picture]of [
 ['a','key-b','la clé',{kind:'action',detail:'prendre'}],['b','book-y','le livre',{kind:'book',color:'jaune'}],['c','letter-r','la lettre',{kind:'letter'}],
] as [string,string,string,Picture][])speech(`take-${suffix}`,'paul',`Je prends ${noun}.`,picture,object,{kind:'take',object});
for(const [suffix,object,noun,picture]of [
 ['a','key-b','la clé',{kind:'action',detail:'donner:key'}],['b','book-y','le livre',{kind:'book',color:'jaune'}],['c','letter-r','la lettre',{kind:'letter'}],
] as [string,string,string,Picture][])speech(`give-${suffix}`,'paul',`Je donne ${noun}.`,picture,'claire',{kind:'deliver',object,target:'claire'});

// These are real addressed hand-offs, giving the final recipient phrase context.
for(const [suffix,object,target,name,picture]of [
 ['a','key-b','claire','Claire',{kind:'action',detail:'donner:key'}],
 ['b','book-y','anne','Anne',{kind:'book',color:'jaune'}],
 ['c','letter-r','marie','Marie',{kind:'letter'}],
] as [string,string,string,string,Picture][])speech(`recipient-${suffix}`,'paul',`Pour ${name}.`,picture,target,{kind:'deliver',object,target});

const clueIds=[
 line('task-a','commission','Prends la clé sous la boîte rouge.',{kind:'position',detail:'sous:key-box'},'note'),
 line('task-b','commission','La clé jaune ouvre la grande porte.',{kind:'door',color:'vert',detail:'key'},'note'),
 line('task-c','commission','Prends le livre dans la boîte jaune.',{kind:'position',detail:'dans:book-box'},'note'),
 line('task-d','commission','Le livre. → Dans la boîte sous la table rouge.',{kind:'position',detail:'sous:box-table'},'note'),
 line('task-e','commission','Prends la lettre sur la chaise verte.',{kind:'position',detail:'sur:letter-chair'},'note'),
 speech('task-f','paul','Pour elle. Elle a la clé verte.',{kind:'grammar',detail:'elle'}),
];
evidence.find(e=>e.id===clueIds[5])!.actorPoses={claire:{holds:'key-g'},anne:{holds:'book-b'},marie:{holds:'letter-g'}};
// The final active utterance makes Claire the referent and Paul the lexical decoy.
speech('reply','claire','J’ai la clé.',{kind:'action',detail:'avoir'},'key-g');

function page(id:string,title:string,kind:JournalPage['kind'],words:string[],pictures:Picture[],requiresEvidence:string[]):JournalPage {
 return{id:`atelier-v2-${id}`,title,zone:'atelier',kind,words,requiresEvidence,slots:words.map((answer,i)=>({id:`atelier-v2-${id}-${i}`,answer,picture:pictures[i]}))};
}
const labels=(...ids:string[])=>ids.map(id=>`atelier-v2-e-label-${id}`);
const pages:JournalPage[]=[
 page('01','Ⅰ','vocabulary',['clé','livre','boîte','porte'],[{kind:'key'},{kind:'book'},{kind:'box'},{kind:'door'}],labels('key-y','key-r','key-g','book-y','book-b','book-r','box-r','box-b','box-y','door-y','door-b','door-g')),
 page('02','Ⅱ','vocabulary',['table','chaise','lettre'],[{kind:'table'},{kind:'chair'},{kind:'letter'}],labels('table-r','table-b','table-g','chair-r','chair-b','chair-g','letter-b','letter-g','letter-r')),
 page('03','Ⅲ','vocabulary',['rouge','bleu','jaune','vert'],['rouge','bleu','jaune','vert'].map(color=>({kind:'key',color})),labels('key-r','book-r','box-r','box-b','key-b','door-b','key-y','book-y','box-y','key-g','door-g','chair-g')),
 page('04','Ⅳ','grammar',['un','une','des'],[{kind:'atelier-vignette',detail:'article-new-book'},{kind:'atelier-vignette',detail:'article-new-key'},{kind:'atelier-vignette',detail:'article-new-many'}],['atelier-v2-e-indefinite-book-y','atelier-v2-e-indefinite-book-b','atelier-v2-e-indefinite-book-r','atelier-v2-e-indefinite-key-b','atelier-v2-e-indefinite-letter-g','atelier-v2-e-indefinite-boxes-a','atelier-v2-e-stock-books','atelier-v2-e-stock-keys','atelier-v2-e-stock-boxes']),
 page('05','Ⅴ','grammar',['le','la','les'],[{kind:'atelier-vignette',detail:'article-known-book'},{kind:'atelier-vignette',detail:'article-known-key'},{kind:'atelier-vignette',detail:'article-known-many'}],['atelier-v2-e-definite-book-y','atelier-v2-e-definite-book-b','atelier-v2-e-definite-book-r','atelier-v2-e-definite-key-b','atelier-v2-e-definite-letter-g','atelier-v2-e-definite-boxes-a','atelier-v2-e-plural-table-b','atelier-v2-e-plural-table-g','atelier-v2-e-plural-storage']),
 page('06','Ⅵ','grammar',['sur','sous','dans'],[{kind:'position',detail:'sur:book-table'},{kind:'position',detail:'sous:key-box'},{kind:'position',detail:'dans:book-box'}],['atelier-v2-e-on-a','atelier-v2-e-on-b','atelier-v2-e-on-c','atelier-v2-e-under-a','atelier-v2-e-under-b','atelier-v2-e-under-c','atelier-v2-e-in-a','atelier-v2-e-in-b','atelier-v2-e-in-c']),
 page('07','Ⅶ','grammar',['ouvrir','fermer','grande'],[{kind:'action',detail:'ouvrir'},{kind:'action',detail:'fermer'},{kind:'atelier-vignette',detail:'large'}],['atelier-v2-e-open-a','atelier-v2-e-open-b','atelier-v2-e-open-c','atelier-v2-e-close-a','atelier-v2-e-close-b','atelier-v2-e-close-c','atelier-v2-e-large-a','atelier-v2-e-large-b','atelier-v2-e-large-c']),
 page('08','Ⅷ','grammar',['être','avoir','prendre','donner','elle'],[{kind:'atelier-vignette',detail:'identity'},{kind:'atelier-vignette',detail:'possession'},{kind:'atelier-vignette',detail:'take'},{kind:'atelier-vignette',detail:'give'},{kind:'atelier-vignette',detail:'referent'}],['atelier-v2-e-identity-a','atelier-v2-e-identity-b','atelier-v2-e-identity-c','atelier-v2-e-have-she-a','atelier-v2-e-have-she-b','atelier-v2-e-have-she-c','atelier-v2-e-take-a','atelier-v2-e-take-b','atelier-v2-e-take-c','atelier-v2-e-give-a','atelier-v2-e-give-b','atelier-v2-e-give-c']),
];

const zone:Zone={
 id:'atelier',design:'situated',title:'L’atelier',subtitle:'',intro:'',color:'#d6c7a8',accent:'#647d62',scenery:['atelier','Paul','Claire','Anne','Marie'],scene,evidence,pages,encounterOrder:evidence.map(e=>e.id),
 puzzle:{id:'atelier-v2-commission',legacyIds:['atelier-sortie'],title:'✦',instruction:'',steps:[],requiredPages:pages.map(p=>p.id),success:'✧',world:{exit:'door-g',clues:clueIds,sequence:[
  {kind:'take',object:'key-y'},
  {kind:'operate',object:'door-g',operation:'open',tool:'key-y'},
  {kind:'take',object:'book-r'},
  {kind:'place',object:'book-r',target:'box-b',relation:'in'},
  {kind:'take',object:'letter-b'},
  {kind:'deliver',object:'letter-b',target:'claire'},
 ]}},
};
export const zoneLexicon:Lexeme[]=[]; // Canonical French data lives in ../lexicon.ts.
export default zone;
