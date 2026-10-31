import type { Evidence, JournalPage, Lexeme, Picture, SceneObject, WorldAction, Zone } from '../types';

// A lived-in home: the family is identified by relationships and shared objects,
// never by assigning a kinship word to an arbitrary coat colour.
const scene:SceneObject[]=[
 {id:'home',kind:'house',position:[-10,-9],size:1.2,label:'maison'},
 {id:'garden',kind:'garden',position:[9,5],size:1.6,label:'jardin'},
 {id:'kitchen',kind:'room',detail:'cuisine',position:[-7,-3],size:1.6,label:'cuisine'},
 {id:'bedroom',kind:'room',detail:'chambre',position:[7,-5],size:1.4,label:'chambre'},
 {id:'living',kind:'room',detail:'salon',position:[0,3],size:1.4,label:'salon'},
 {id:'bed',kind:'bed',position:[8,-7],color:'bleu'},
 {id:'stove',kind:'stove',position:[-10,-4]},
 {id:'sofa',kind:'sofa',position:[-2,4]},
 {id:'tree',kind:'tree',position:[11,3],size:1.4},
 {id:'flowers',kind:'flower',quantity:3,position:[8,6],color:'rouge'},
 {id:'table-k',kind:'table',position:[-6,-3],color:'verte',label:'table verte',accepts:['on','under']},
 {id:'table-s',kind:'table',position:[0,2],color:'rouge',label:'table avec livre',accepts:['on','under']},
 {id:'table-b',kind:'table',position:[7,-4],color:'bleue',label:'petite table',size:.65,accepts:['on','under']},
 {id:'chair-a',kind:'chair',position:[-9,0],color:'jaune',size:.6,label:'petite chaise',accepts:['on','under']},
 {id:'chair-b',kind:'chair',position:[0,5],color:'bleue',label:'chaise bleue',accepts:['on','under']},
 {id:'window',kind:'window',position:[-11,0],label:'fenêtre'},
 {id:'gate-g',kind:'door',position:[8,9],color:'verte',size:1.2,label:'porte verte',operations:['open','close'],toolKind:'key'},
 {id:'gate-b',kind:'door',position:[8,-9],color:'bleue',size:.7,label:'porte avec clé',operations:['open','close'],toolKind:'key'},
 {id:'box-a',kind:'box',position:[5,1],color:'jaune',size:1.3,container:true,open:true,operations:['open','close'],label:'boîte jaune',accepts:['in','on','under']},
 {id:'box-b',kind:'box',position:[-7,5],color:'rouge',container:true,open:true,operations:['open','close'],label:'boîte rouge',accepts:['in','on','under']},
 {id:'book-l',kind:'book',position:[7,-4],color:'rouge',size:.5,label:'livre de Luc',detail:'new',portable:true,container:true,open:true,operations:['open','close'],accepts:['in'],placement:{target:'table-b',relation:'on'}},
 {id:'book-p',kind:'book',position:[0,2],color:'rouge',size:1.0,label:'grand livre rouge',detail:'worn',portable:true,container:true,open:true,operations:['open','close'],accepts:['in'],placement:{target:'table-s',relation:'on'}},
 {id:'book-c',kind:'book',position:[-7,5],color:'bleu',size:.8,label:'petit livre bleu',detail:'beautiful',portable:true,container:true,open:true,operations:['open','close'],accepts:['in'],placement:{target:'box-b',relation:'on'}},
 {id:'coat-l',kind:'coat',position:[1,-1],color:'bleu',size:.7,label:'manteau bleu',detail:'new',portable:true},
 {id:'coat-c',kind:'coat',position:[-4,1],color:'rouge',label:'manteau de Claire',detail:'worn',portable:true},
 {id:'coat-p',kind:'coat',position:[4,4],color:'vert',size:1.3,label:'beau manteau',detail:'beautiful',portable:true},
 {id:'letter-a',kind:'letter',position:[1,-1],label:'lettre jaune',color:'jaune',size:.35,portable:true,placement:{target:'coat-l',relation:'under'}},
 {id:'letter-b',kind:'letter',position:[5,1],label:'petite lettre bleue',color:'bleue',size:.35,portable:true,placement:{target:'box-a',relation:'in'}},
 {id:'cup-a',kind:'cup',position:[-9,0],color:'verte',label:'tasse verte',portable:true,placement:{target:'chair-a',relation:'on'}},
 {id:'cup-b',kind:'cup',position:[0,5],color:'rouge',size:.55,label:'petite tasse',portable:true,placement:{target:'chair-b',relation:'on'}},
 {id:'key-a',kind:'key',position:[8,6],color:'jaune',label:'clé',portable:true,placement:{target:'flowers',relation:'under'}},
 {id:'key-b',kind:'key',position:[5,1],color:'jaune',label:'clé jaune',portable:true,placement:{target:'gate-b',relation:'in'}},
 {id:'anne',kind:'npc-female',position:[-4,-1],color:'#997f68',recipient:true,label:'Anne'},
 {id:'paul',kind:'npc-male',position:[3,4],color:'#68817b',recipient:true,label:'Paul'},
 {id:'claire',kind:'npc-female',position:[1,0],color:'#ad7860',recipient:true,label:'Claire'},
 {id:'luc',kind:'npc-male',position:[7,3],color:'#7b865f',recipient:true,label:'Luc'},
 {id:'jules',kind:'npc-male',position:[-10,8],color:'#8c7891',recipient:true,label:'Jules'},
 {id:'family-wall',kind:'family',detail:'famille',position:[0,-8],size:1.2},
 {id:'family-table',kind:'family',detail:'parents',position:[-4,-4],size:.75},
 {id:'family-garden',kind:'family',detail:'children',position:[10,0],size:.85},
 {id:'new-box',kind:'box',position:[-10,6],detail:'new',label:'nouvelle boîte',open:true,operations:['open','close'],size:.65},
 {id:'old-box',kind:'box',position:[-9,8],detail:'worn',label:'vieille boîte',open:true,size:.65},
 {id:'fine-box',kind:'box',position:[-6,8],detail:'beautiful',label:'belle boîte',open:true,size:.65},
 {id:'proof-key',kind:'key',position:[-7,-7],color:'noir',size:.5,portable:true,placement:{target:'locked-box',relation:'on'}},
 {id:'locked-box',kind:'box',position:[-7,-7],color:'bleue',size:.8,container:true,open:false,operations:['open','close'],toolKind:'key',label:'boîte fermée'},
 {id:'notice',kind:'notice',position:[-4,-8]},
];
scene.push({id:'sapling',kind:'tree',position:[11,7],size:.45},{id:'small-home',kind:'house',position:[-11,9],size:.45,label:'chez Jules'});
for(const id of['family-wall','family-table','family-garden'])scene.find(o=>o.id===id)!.labels=[{text:'Paul · Anne',surface:'top',offset:[0,.3,-.6]},{text:'Luc · Claire',surface:'top',offset:[0,.3,1.1]}];
const evidence:Evidence[]=[];
const pic=(kind:string,detail?:string):Picture=>({kind,...(detail?{detail}:{})});
function line(id:string,anchor:string,text:string,picture:Picture,surface:Evidence['surface']='speech',extra:Partial<Evidence>={}):string{
 const object=scene.find(o=>o.id===anchor)!;const key=`maison-v2-e-${id}`;
 evidence.push({id:key,title:key,text,anchor,picture,words:[],position:[...object.position],surface,kind:surface==='speech'?'person':surface==='note'?'note':'object',...extra});return key;
}
const point=(id:string,actor:string,text:string,target:string,picture:Picture=pic('concept','maison:0'))=>line(id,actor,text,picture,'speech',{pose:{pointsTo:target}});
// Reuse earlier words in useful household contexts before adding relationships.
for(const id of ['home','garden','kitchen','bedroom','living','table-k','table-s','table-b','chair-a','chair-b','window','gate-g','gate-b','box-a','box-b','book-l','book-p','book-c','coat-l','coat-c','coat-p','letter-a','letter-b','cup-a','cup-b','key-a','key-b','new-box','old-box','fine-box','locked-box']){
 const object=scene.find(o=>o.id===id)!;line(`label-${id}`,id,object.label!,pic(object.kind,object.detail),'top');
}
line('first-owned-key','claire','Ma clé.',pic('key'),'speech',{pose:{pointsTo:'key-b'}});
for(const [word,target,actor,second,third]of[
 ['maison','home','claire','Chez Claire, la maison.','La maison de notre famille.'],
 ['jardin','garden','luc','Le jardin de ma sœur.','Notre jardin, avec les fleurs.'],
 ['cuisine','kitchen','anne','La cuisine, avec le four.','Notre cuisine, avec la table.'],
 ['chambre','bedroom','luc','Ma chambre, avec mon lit.','La chambre de mon frère.'],
 ['salon','living','paul','Notre salon, avec les fauteuils.','Le salon de ma famille.'],
] as [string,string,string,string,string][]){
 point(`room-${word}-b`,actor,second,target,pic(word==='maison'?'house':word==='jardin'?'garden':'room',word));
 point(`room-${word}-c`,actor==='claire'?'luc':'claire',third,target,pic(word==='maison'?'house':word==='jardin'?'garden':'room',word));
}
// Three kinds of evidence: an old family photograph, direct introduction, and
// a relative referring to the same person during today's household visit.
const relations:[string,string,string,string,string,string][]=[
 ['mère','anne','claire','Ma mère, Anne.','Anne est la mère de Luc.','Je suis la mère de Luc.'],
 ['père','paul','luc','Mon père, Paul.','Paul est le père de Claire.','Je suis le père de Claire.'],
 ['fille','claire','anne','Ma fille, Claire.','Claire est la fille de Paul.','Je suis la fille d’Anne.'],
 ['fils','luc','paul','Mon fils, Luc.','Luc est le fils d’Anne.','Je suis le fils de Paul.'],
 ['sœur','claire','luc','Ma sœur, Claire.','Claire est la sœur de Luc.','Luc, je suis ta sœur.'],
 ['frère','luc','claire','Mon frère, Luc.','Luc est le frère de Claire.','Claire, je suis ton frère.'],
 ['enfant','luc','anne','Mon enfant, Luc.','Claire est mon enfant.','L’enfant de Paul : Luc.'],
 ['parent','anne','claire','Anne, mon parent.','Paul est le parent de Luc.','Un parent avec son enfant.'],
];
for(const [word,target,actor,first,second,third]of relations){
 point(`kin-${word}-a`,actor,first,target,pic('family',word));
 point(`kin-${word}-b`,actor==='claire'?'paul':'claire',second,'family-wall',pic('family',word));
 point(`kin-${word}-c`,word==='mère'?'anne':word==='père'?'paul':target,third,'family-table',pic('family',word));
}
for(const [i,anchor,actor]of[['a','family-wall','claire'],['b','family-table','anne'],['c','family-garden','luc']]as[string,string,string][])
 point(`family-${i}`,actor,['Ma famille.','Notre famille.','La famille de Claire.'][i==='a'?0:i==='b'?1:2],anchor,pic('family'));
for(const [i,actor,target]of[['a','luc','jules'],['b','claire','jules'],['c','paul','luc']]as[string,string,string][]){
 point(`friend-${i}`,actor,i==='a'?'Jules, mon ami.':i==='b'?'Mon ami aide ma mère.':'Mon ami cherche mon livre.',target,pic('concept','ami:0'));
 line(`neighbour-${i}`,actor,i==='a'?'Jules, notre voisin.':i==='b'?'Jules est notre voisin.':'Jules est le voisin de Claire.',pic('concept','voisin:0'),'speech',{pose:{pointsTo:target},actorPoses:{jules:{pointsTo:'small-home'},claire:{pointsTo:'home'}}});
}
// Ownership is witnessed on people with the actual objects. Changing a speaker
// and the owner/referent distinguishes grammatical person from object colour.
for(const [id,kind,detail,position]of[['bag-new','bag','new',[8,-3]],['bag-old','bag','worn',[9,5]],['bag-fine','bag','beautiful',[-1,4]]]as[string,string,string,[number,number]][])scene.push({id,kind,detail,position});
for(const [id,kind,position]of[['group-books','book',[-3,4]],['group-coats','coat',[3,5]],['group-boxes','box',[-4,-3]]]as[string,string,[number,number]][])scene.push({id,kind,quantity:3,position,size:.45});
const owners:[string,string,string,string,string][]=[
 ['mon','claire','book-c','Mon livre.','book'],['ma','claire','key-b','Ma clé.','key'],['mes','claire','book-c','Mes livres.','books'],
 ['ton','anne','book-l','Luc, ton livre.','book'],['son','anne','book-l','Luc a son livre.','book'],
 ['notre','anne','book-p','Paul, notre livre.','book'],['votre','claire','book-p','Paul, votre livre.','book'],['leur','claire','book-p','Anne et Paul, leur livre.','book'],
];
for(const[word,actor,object,text,kind]of owners){
 for(let [n,item,utterance]of[[0,object,text],[1,word==='ma'?'letter-a':'coat-l',text.replace(/livre(?:s)?/u,word==='mes'?'manteaux':'manteau').replace('clé','lettre')],[2,word==='ma'?'box-a':'book-c',text.replace(/livre(?:s)?/u,word==='mes'?'livres':'livre').replace('clé','boîte')]]as[number,string,string][]){
  if(word==='mes')item=['group-books','group-coats','group-boxes'][n];
  if(word==='mes'&&n===2)utterance='Mes boîtes.';
  const owner=word==='ton'||word==='son'?'luc':word==='notre'||word==='votre'||word==='leur'?'paul':actor;
  line(`owner-${word}-${n}`,actor,utterance,pic('home-vignette',`possessive-${word}`),'speech',{pose:{pointsTo:owner},actorPoses:{[owner]:{holds:item},...(['notre','leur'].includes(word)?{anne:{pointsTo:item}}:{})}});
 }
}
// New/worn/ornamented copies have the same recognisable noun silhouette.
for(const[word,ids,forms]of[
 ['nouveau',['book-l','coat-l','new-box'],['nouveau livre','nouveau manteau','nouvelle boîte']],
 ['vieux',['book-p','coat-c','old-box'],['vieux livre','vieux manteau','vieille boîte']],
 ['beau',['book-c','coat-p','fine-box'],['beau livre','beau manteau','belle boîte']],
]as[string,string[],string[]][]){
 ids.forEach((id,i)=>point(`quality-${word}-${i}`,['claire','paul','anne'][i],forms[i],id,pic('concept',`${word}:${i}`)));
 // The representative masculine form appears with three real noun referents;
 // feminine agreement is encountered separately and is never substituted for it.
 point(`quality-${word}-d`,'luc',`${word} sac`,word==='nouveau'?'bag-new':word==='vieux'?'bag-old':'bag-fine',pic('bag'));
}
for(const [word,targets]of[
 ['grand',[['book-p','grand livre'],['coat-p','grand manteau'],['tree','grand arbre']]],
 ['grande',[['box-a','grande boîte'],['home','grande maison'],['gate-g','grande porte']]],
 ['petit',[['book-l','petit livre'],['coat-l','petit manteau'],['sapling','petit arbre']]],
 ['petite',[['new-box','petite boîte'],['chair-a','petite chaise'],['gate-b','petite porte']]],
]as[string,[string,string][]][]){targets.forEach(([target,text],i)=>point(`size-${word}-${i}`,['claire','paul','anne'][i],text,target,pic('home-vignette',`${word}-${word.endsWith('e')?'female':'male'}`)));}
// Clear number contrasts are actual groups of objects on household surfaces.
for(const[n,anchor,kind,text]of[[0,'table-k','book','livres'],[1,'box-b','box','boîtes'],[2,'chair-b','coat','manteaux']]as[number,string,string,string][]){
 for(let i=0;i<3;i++){
  const id=`stock-${kind}-${i}`;scene.push({id,kind,quantity:i+2,position:[-7+i*6,7],size:.45,label:text});
  line(`plural-${kind}-${i}`,id,text,{kind:'quantity',detail:kind,count:i+2},'top');
 }
}
// Familiar and formal requests use the same task; who speaks and addresses whom
// supplies person evidence without a conjugation list.
for(const [n,object,noun]of[[0,'gate-g','la porte'],[1,'gate-b','la porte'],[2,'locked-box','la boîte']]as[number,string,string][]){
 const pictures=pic('action','pouvoir:je');
 const witness=(owner:string,poses:NonNullable<Evidence['actorPoses']>={})=>Object.fromEntries(['anne','paul','claire','luc','jules'].map(actor=>[actor,{holds:actor===owner?'proof-key':undefined,...poses[actor]}]));
 line(`can-i-${n}`,'claire',`Je peux ouvrir ${noun}.`,pictures,'speech',{pose:{pointsTo:object},actorPoses:witness('claire'),demonstration:{actor:'claire',action:{kind:'operate',object,operation:'open'}}});
 line(`can-he-${n}`,'anne',`Il peut ouvrir ${noun}.`,pic('action','pouvoir:elle'),'speech',{pose:{pointsTo:'luc'},actorPoses:witness('luc',{luc:{pointsTo:object}}),demonstration:{actor:'luc',action:{kind:'operate',object,operation:'open'}}});
 line(`can-we-${n}`,'claire',`Nous pouvons ouvrir ${noun}.`,pic('action','pouvoir:nous'),'speech',{pose:{pointsTo:'anne'},actorPoses:witness('anne',{anne:{pointsTo:object}}),demonstration:{actor:'anne',action:{kind:'operate',object,operation:'open'}}});
 line(`can-you-${n}`,'claire',`Vous pouvez ouvrir ${noun}, Paul.`,pic('action','pouvoir:vous'),'speech',{pose:{pointsTo:'paul'},actorPoses:witness('paul',{paul:{pointsTo:object}}),demonstration:{actor:'paul',action:{kind:'operate',object,operation:'open'}}});
 line(`can-they-${n}`,'claire',`Ils peuvent ouvrir ${noun}.`,pic('grammar','ils'),'speech',{pose:{pointsTo:'luc'},actorPoses:witness('luc',{luc:{pointsTo:object},paul:{pointsTo:object}}),demonstration:{actor:'luc',action:{kind:'operate',object,operation:'open'}}});
 line(`cannot-${n}`,'claire',`Je ne peux pas ouvrir ${noun}.`,pic('action','pouvoir:je'),'speech',{pose:{pointsTo:object},actorPoses:witness('paul')});
 point(`power-${n}`,'claire',`Je veux pouvoir ouvrir ${noun}.`,object,pic('concept','aider:0'));
 line(`help-${n}`,'luc','Je peux aider Claire.',pic('concept',`aider:${n}`),'speech',{actorPoses:witness('luc',{claire:{pointsTo:object}}),demonstration:{actor:'luc',action:{kind:'deliver',object:'proof-key',target:'claire'}}});
 const searched=['box-a','box-b','new-box'][n];
 line(`seek-${n}`,'claire',`Je veux chercher ${['ma clé','ma lettre','mon livre'][n]}.`,pic('concept',`chercher:${n}`),'speech',{pose:{pointsTo:searched},travel:{actor:'claire',target:searched},demonstration:{actor:'claire',action:{kind:'operate',object:searched,operation:'open'}}});
 point(`chez-${n}`,['luc','anne','paul'][n],'Je suis chez Claire.',['home','kitchen','living'][n],pic('concept',`chez:${n}`));
}

// The same nouns recur as cared-for plants in three working household places.
for(const [id,kind,position,color,placement]of[
 ['flower-window','flower',[-11,0],'jaune',{target:'window',relation:'on' as const,offset:[0,-1.3,.15] as[number,number,number]}],
 ['flower-bed','flower',[7,-4],'blanche',{target:'table-b',relation:'on' as const,offset:[.9,0,0] as[number,number,number]}],
 ['flower-garden','flower',[10,5],'rouge',undefined],
]as[string,string,[number,number],string,SceneObject['placement']][]){
 scene.push({id,kind,position,color,size:.6,placement,label:`fleur ${color}`});
 line(id,id,`fleur ${color}`,pic('flower'),'top');
}
scene.push({id:'potted-tree',kind:'tree',position:[-10,3],size:.65});
point('tree-garden','claire','Notre arbre.','tree',pic('tree'));
point('tree-sapling','anne','Le petit arbre.','sapling',pic('tree'));
point('tree-pot','jules','Mon arbre.','potted-tree',pic('tree'));

const clues=[
 line('task-letter','notice','Prends la lettre sous le manteau bleu.',pic('letter'),'note'),
 line('task-envelope','notice','La lettre : dans le petit livre rouge.',pic('book'),'note'),
 line('task-book','notice','Prends le petit livre rouge.',pic('book'),'note'),
 line('task-table','notice','Le livre : sur la table de la cuisine.',pic('table'),'note'),
 line('task-cup','notice','Prends la tasse sur la petite chaise.',pic('cup'),'note'),
 line('task-cup-place','notice','La tasse : sur la table avec le livre.',pic('table'),'note'),
 line('task-key','notice','Prends la clé jaune sous les fleurs.',pic('key'),'note'),
 line('task-door','notice','Ouvre la grande porte avec la clé.',pic('door'),'note'),
 line('task-coat','claire','Prends le manteau de mon frère.',pic('coat'),'speech'),
 line('task-give','claire','Donne le manteau à mon frère.',pic('family','frère'),'speech'),
];
// These observations fix the coat owner without moving the player or revealing
// the request's correct recipient through a pointing pose.
line('luc-coat','luc','Mon manteau bleu.',pic('coat'),'speech',{pose:{pointsTo:'coat-l'}});
point('claire-brother-final','claire','Luc est mon frère.','family-garden',pic('family','frère'));

function page(id:string,words:string[],pictures:Picture[],kind:JournalPage['kind']='vocabulary'):JournalPage{
 const relevant=evidence.filter(e=>words.some(w=>e.text.toLocaleLowerCase('fr').includes(w==='pouvoir'?'pouvoir':w))).map(e=>e.id);
 return{id:`maison-v2-${id}`,title:'✦'.repeat(1+Number(id)%4),zone:'maison',kind,words,requiresEvidence:relevant,slots:words.map((answer,i)=>({id:`maison-v2-${id}-${i}`,answer,picture:pictures[i]}))};
}
const pages:JournalPage[]=[
 page('01',['maison','jardin','chambre','cuisine','salon'],[pic('house'),pic('garden'),pic('room','chambre'),pic('room','cuisine'),pic('room','salon')]),
 page('02',['mère','père','fille','fils'],['mère','père','fille','fils'].map(d=>pic('family',d))),
 page('03',['famille','sœur','frère','enfant','parent'],['famille','sœur','frère','enfant','parent'].map(d=>pic('concept',`${d}:0`))),
 page('04',['mon','ma','mes'],['mon','ma','mes'].map(d=>pic('home-vignette',`possessive-${d}`)),'grammar'),
 page('05',['ton','son','notre','votre','leur'],['ton','son','notre','votre','leur'].map(d=>pic('home-vignette',`possessive-${d}`)),'grammar'),
 page('06',['grand','grande','petit','petite'],['grand','grande','petit','petite'].map(d=>pic('home-vignette',`${d}-${d.endsWith('e')?'female':'male'}`)),'grammar'),
 page('07',['nouveau','vieux','beau','manteau'],['nouveau','vieux','beau'].map(d=>pic('concept',`${d}:0`)).concat(pic('coat'))),
 page('08',['peux','peut','pouvons','pouvez','peuvent'],['je','elle','nous','vous','ils'].map(d=>pic('action',`pouvoir:${d}`)),'grammar'),
 page('09',['ami','voisin','aider','chercher','chez'],['ami','voisin','aider','chercher','chez'].map(d=>pic('concept',`${d}:0`))),
 page('10',['livres','boîtes','manteaux'],['book','box','coat'].map(d=>({kind:'quantity',detail:d,count:3})),'grammar'),
];
pages.find(page=>page.id==='maison-v2-09')!.requiresEvidence!.push(...[0,1,2].flatMap(n=>[`maison-v2-e-cannot-${n}`,`maison-v2-e-can-i-${n}`]));
const zone:Zone={id:'maison',design:'situated',title:'Chez Claire',subtitle:'',intro:'',color:'#a66e59',accent:'#c49a65',scenery:['Claire','Luc','Anne','Paul','Jules','four','fauteuils','d’Anne'],scene,evidence,pages,encounterOrder:evidence.map(e=>e.id),puzzle:{id:'maison-v2-retrouvailles',legacyIds:['maison-retrouvailles'],title:'✦',instruction:'',success:'✧',steps:[],requiredPages:pages.map(p=>p.id),world:{exit:'gate-g',clues,sequence:[
 {kind:'take',object:'letter-a'},
 {kind:'place',object:'letter-a',target:'book-l',relation:'in'},
 {kind:'take',object:'book-l'},
 {kind:'place',object:'book-l',target:'table-k',relation:'on'},
 {kind:'take',object:'cup-a'},
 {kind:'place',object:'cup-a',target:'table-k',relation:'on'},
 {kind:'take',object:'key-a'},
 {kind:'operate',object:'gate-g',operation:'open',tool:'key-a'},
 {kind:'take',object:'coat-l'},
 {kind:'deliver',object:'coat-l',target:'luc'},
]}}};
export const zoneLexicon:Lexeme[]=[];
export default zone;
