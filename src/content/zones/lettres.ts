import type { Evidence, JournalPage, Lexeme, Picture, SceneObject, Zone } from '../types';

/** The garden keeps the siblings' correspondence and models of their journey.
 * Completed actions visibly differ from static possession in the present. */
const scene:SceneObject[]=[
 {id:'garden-gate',kind:'door',position:[9,-10],color:'verte',size:1.3,label:'porte verte',operations:['open','close'],toolKind:'key'},
 {id:'small-gate',kind:'door',position:[-10,-10],size:.7,label:'porte du jardin',operations:['open','close'],toolKind:'key'},
 {id:'tree',kind:'tree',position:[11,-7],size:.8},
 {id:'luc',kind:'npc-male',position:[-9,10],label:'Luc',recipient:true},
 {id:'claire',kind:'npc-female',position:[0,10],label:'Claire',recipient:true,pose:{holds:'photo-held'}},
 {id:'anne',kind:'npc-female',position:[9,10],label:'Anne',recipient:true,pose:{holds:'book-held'}},
 {id:'paul',kind:'npc-male',position:[-13,12],label:'Paul',recipient:true},
 {id:'photo-held',kind:'photo',position:[3,9],picture:{kind:'family',detail:'sœur'},containedBy:'claire',size:.55},
 {id:'book-held',kind:'book',position:[9,10],containedBy:'anne',size:.55},
 {id:'worktable',kind:'table',position:[0,15],size:[2.7,1,1.7],accepts:['on','under']},
 {id:'book-red',kind:'book',position:[-2,15],color:'rouge',label:'livre rouge',portable:true,open:true,operations:['open','close'],placement:{target:'worktable',relation:'on',offset:[-2,0,0]}},
 {id:'key-yellow',kind:'key',position:[-2,15],color:'jaune',label:'clé jaune',portable:true,size:.5,placement:{target:'book-red',relation:'under',offset:[.45,0,.3]}},
 {id:'key-red',kind:'key',position:[2,15],color:'rouge',label:'clé rouge',portable:true,size:.5,placement:{target:'worktable',relation:'on',offset:[2,0,.4]}},
 {id:'letter-14',kind:'letter',position:[0,15],label:'14',value:14,portable:true,size:.8,placement:{target:'worktable',relation:'on',offset:[0,0,-.4]}},
 {id:'letter-15',kind:'letter',position:[2,15],label:'15',value:15,portable:true,size:.8,placement:{target:'worktable',relation:'on',offset:[2,0,-.4]}},
 {id:'today',kind:'calendar',position:[0,13.5],value:15,detail:'aujourd’hui'},
 {id:'instructions',kind:'letter',position:[-5,15],size:1.1},
];
const evidence:Evidence[]=[];
function line(id:string,anchor:string,text:string,picture:Picture,surface:Evidence['surface']='note',extra:Partial<Evidence>={}):string {
 const object=scene.find(entry=>entry.id===anchor)!;const key=`lettres-v2-e-${id}`;
 evidence.push({id:key,title:key,anchor,text,words:[],picture,position:[...object.position],surface,kind:surface==='speech'?'person':surface==='note'?'note':'object',...extra});return key;
}
const pic=(name:string,variant=0):Picture=>({kind:'concept',detail:`${name}:${variant}`});
const witnesses:Record<string,string[]>={};
function witness(word:string,id:string):void {(witnesses[word]??=[]).push(id);}

// Three working correspondence desks, with actual addressed envelopes, stamps
// and photographs. The first address is the slip recovered in Luc's red book.
for(let variant=0;variant<3;variant++){
 const x=[-9,0,9][variant],table=`archive-${variant}`;
 scene.push({id:table,kind:'table',position:[x,5],size:[2.4,1,4.8]});
 scene.push({id:`postage-${variant}`,kind:'table',position:[x,12],size:[2.4,1,1.4],accepts:['on','under']});
 const number=[3,8,11][variant],street=['rue de la Gare','rue du Jardin','rue du Marché'][variant];
 const envelope=`envelope-${number}`;
 scene.push({id:envelope,kind:'envelope',position:[x-1.7,12],label:variant===0?'3':`enveloppe ${variant===1?'rouge':'jaune'}`,labels:[{text:street,surface:'top'}],color:variant===1?'rouge':variant===2?'jaune':undefined,portable:true,container:true,open:true,accepts:['in','on','under'],placement:{target:`postage-${variant}`,relation:'on',offset:[-1.7,0,0]},size:.8});
 witness('enveloppe',line(`envelope-${variant}`,envelope,'L’enveloppe.',{kind:'envelope'},'top'));
 const address=`address-${variant}`;
 scene.push({id:address,kind:'address',position:[x,12],label:String(number),labels:[{text:street,surface:'top'}],value:number,placement:variant===0?{target:'book-red',relation:'in',offset:[0,.05,0]}:{target:`postage-${variant}`,relation:'on',offset:[0,0,0]},size:.7});
 witness('adresse',line(`address-${variant}`,address,'L’adresse.',{kind:'envelope',detail:'adresse'},'top'));
 const photograph=`photo-${variant}`;
 const picture:Picture=[{kind:'portrait',detail:'photo'},{kind:'family'},{kind:'garden'}][variant];
 scene.push({id:photograph,kind:'photo',position:[x+1.7,12],label:variant===0?'photo de Luc':variant===1?'photo de Claire':'photo du jardin',picture,portable:true,accepts:['on','under'],placement:{target:`postage-${variant}`,relation:'on',offset:[1.7,0,0]},size:.75});
 witness('photo',line(`photo-${variant}`,photograph,['La photo de Luc.','La photo de Claire.','La photo du jardin.'][variant],picture,'top'));
 const stamp=`stamp-${variant}`;
 scene.push({id:stamp,kind:'stamp',position:[x+1.7,12],label:'timbre',color:['jaune','rouge','bleue'][variant],portable:true,size:.65,placement:{target:photograph,relation:variant===0?'under':'on',offset:[0,0,variant===0?.35:0]}});
 witness('timbre',line(`stamp-${variant}`,stamp,'Le timbre.',{kind:'envelope',detail:'timbre'},'top'));
}

// Every temporal action has three different real referents and a before/after
// miniature. Infinitives occur naturally in requests, not conjugation lists.
const actions:[string,string,string,string[],string[],string[]][]=[
 ['lire','lu','read',['letter','ticket','book'],['Je peux lire la lettre.','Je peux lire le billet.','Je peux lire le livre.'],['Hier, j’ai lu la lettre.','Hier, j’ai lu le billet.','Hier, j’ai lu le livre.']],
 ['écrire','écrit','write',['letter','envelope','note'],['Je veux écrire une lettre.','Je veux écrire sur l’enveloppe.','Je veux écrire dans le livre.'],['Hier, j’ai écrit une lettre.','Hier, j’ai écrit sur l’enveloppe.','Hier, j’ai écrit dans le livre.']],
 ['prendre','pris','take',['key','book','letter'],['Je prends la clé.','Je prends le livre.','Je prends la lettre.'],['Hier, j’ai pris la clé.','Hier, j’ai pris le livre.','Hier, j’ai pris la lettre.']],
 ['donner','donné','give',['key','letter','photo'],['Je donne la clé.','Je donne la lettre.','Je donne la photo.'],['Hier, j’ai donné la clé.','Hier, j’ai donné la lettre.','Hier, j’ai donné la photo.']],
 ['voir','vu','see',['photo','house','train'],['Je veux voir la photo.','Je veux voir la maison.','Je veux voir le train.'],['Hier, j’ai vu la photo.','Hier, j’ai vu la maison.','Hier, j’ai vu le train.']],
 ['trouver','trouvé','find',['key','letter','photo'],['Je veux trouver la clé.','Je veux trouver la lettre.','Je veux trouver la photo.'],['Hier, j’ai trouvé la clé.','Hier, j’ai trouvé la lettre.','Hier, j’ai trouvé la photo.']],
 ['perdre','perdu','lose',['key','letter','ticket'],['Je ne veux pas perdre ma clé.','Je ne veux pas perdre ma lettre.','Je ne veux pas perdre mon billet.'],['Hier, j’ai perdu ma clé.','Hier, j’ai perdu ma lettre.','Hier, j’ai perdu mon billet.']],
];
for(let variant=0;variant<3;variant++){
 const x=[-10,0,10][variant],table=`models-${variant}`,actor=['luc','claire','anne'][variant];
 scene.push({id:table,kind:'table',position:[x,-5],size:[3.2,1,4.5]});
 for(const [index,[present,past,action,items,presentLines,pastLines]]of actions.entries()){
  const id=`memory-${action}-${variant}`,dx=(index%3-1)*3.2,dz=(Math.floor(index/3)-1)*2.7;
  scene.push({id,kind:'timeline',position:[x+dx,-5+dz],detail:`${action}:${items[variant]}`,value:14,size:.95,placement:{target:table,relation:'on',offset:[dx,0,dz]}});
  witness(present,line(`${present}-${variant}`,actor,presentLines[variant],{kind:'action',detail:present},'speech',{pose:{pointsTo:id}}));
  witness(past,line(`${past}-past-${variant}`,actor,pastLines[variant],{kind:'lettres-vignette',detail:`past-${action}:${items[variant]}`},'speech',{pose:{pointsTo:id}}));
 }
}
for(let variant=0;variant<3;variant++){
 const target=`memory-write-${variant}`,anchor=scene.find(object=>object.id===target)!;
 scene.push({id:`pencil-${variant}`,kind:'pencil',position:[...anchor.position],label:'crayon',size:.65,placement:{target,relation:'on',offset:[.65,0,.45]}});
 witness('crayon',line(`crayon-${variant}`,`pencil-${variant}`,'Le crayon.',{kind:'pencil'},'top'));
}
for(const [actor,object,noun]of [['claire','photo-held','la photo'],['anne','book-held','le livre'],['luc','key-red','la clé']]as const){
 line(`possession-${actor}`,actor,`Maintenant, j’ai ${noun}.`,{kind:'atelier-vignette',detail:'possession'},'speech',{actorPoses:{[actor]:{holds:object}}});
}

// The reference day remains fifteen; different highlighted days and events
// establish yesterday, today and tomorrow in three physical calendar settings.
for(let variant=0;variant<3;variant++)for(const [word,day,detail]of [['hier',14,'hier'],['aujourd_hui',15,'aujourd’hui'],['demain',16,'demain']]as const){
 const x=[-9,0,9][variant],id=`day-${word}-${variant}`;
 scene.push({id,kind:'calendar',position:[x+(day-15)*2.2,1],value:day,detail,size:.75});
 witness(word,line(`${word}-${variant}`,id,word==='hier'?'Hier, le quatorze.':word==='aujourd_hui'?'Aujourd’hui, le quinze.':'Demain, le seize.',{kind:'calendar',detail,label:'14 · 15 · 16'}));
}
scene.push({id:'five-minutes',kind:'clock',position:[-6,1],value:5,label:'5 min',size:.6});
line('five-minutes','five-minutes','5 min',{kind:'clock',label:'00:00 → 00:05'},'top');
const memories:[string,[string,string,string]][]=[
 ['toujours',['Matin, midi, soir : toujours ma photo.','Matin, midi, soir : toujours mon livre.','Matin, midi, soir : toujours la fleur.']],
 ['déjà',['Avant midi, j’ai déjà écrit.','Avant midi, j’ai déjà lu.','Avant midi, j’ai déjà donné la photo.']],
 ['enfin',['Je cherche. Enfin, je trouve la clé.','Je cherche. Enfin, je trouve la lettre.','Je cherche. Enfin, je trouve la maison.']],
 ['bientôt',['Onze heures cinquante-cinq. Bientôt, midi.','Cinq heures cinquante-cinq. Bientôt, six heures.','Sept heures cinquante-cinq. Bientôt, huit heures.']],
 ['histoire',['Une histoire : le train, puis la lettre.','Notre histoire : la lettre, puis le jardin.','Notre histoire : le train, la lettre, le jardin.']],
 ['souvenir',['Un souvenir : la photo du jardin.','Un souvenir : la photo du père.','Un souvenir : la photo de notre famille.']],
 ['promesse',['Une promesse : demain, je reviens.','Une promesse : demain, je donne la lettre.','Une promesse : demain, je donne la clé.']],
 ['rendez_vous',['Notre rendez-vous. Demain, à midi, dans le jardin.','Rendez-vous demain, à six heures, au café.','Rendez-vous demain, à huit heures, à la gare.']],
 ['retrouver',['Je veux retrouver la même lettre.','Je veux retrouver la même photo.','Je veux retrouver la même clé.']],
 ['revenir',['Je veux revenir à la maison.','Je veux revenir à la gare.','Je veux revenir au café.']],
 ['oublier',['Je ne veux pas oublier mon livre.','Je ne veux pas oublier ma clé.','Je ne veux pas oublier ma lettre.']],
 ['savoir',['Je veux savoir où est la maison.','Je veux savoir où est la lettre.','Je veux savoir où est la clé.']],
 ['comprendre',['Je veux comprendre la lettre.','Je veux comprendre le plan.','Je veux comprendre le livre.']],
 ['mais',['Boîte ouverte, mais porte fermée.','Paul a du café, mais pas Anne.','Le panier est ici, mais pas le sac.']],
];
for(let variant=0;variant<3;variant++)for(const [index,[word,texts]]of memories.entries()){
 const x=[-9,0,9][variant],dx=(index%3-1)*2.4,dz=(Math.floor(index/3)-2)*1.65,id=`kept-${word}-${variant}`,picture=pic(word,variant);
 scene.push({id,kind:'photo',position:[x+dx,5+dz],picture,size:.95,placement:{target:`archive-${variant}`,relation:'on',offset:[dx,0,dz]}});
 witness(word,line(`${word}-${variant}`,['luc','claire','anne'][variant],texts[variant],picture,'speech',{pose:{pointsTo:id}}));
}

// Long-form payoff: actual correspondence read after its forms have appeared in
// short physical contexts. Dates matter to choosing the original lost letter.
line('return-word','luc','Je reviens.',pic('revenir'),'speech');
line('read-result','claire','Je sais. Je comprends.',pic('comprendre'),'speech');
line('today','today','Aujourd’hui, le quinze.',{kind:'calendar',label:'15'});
line('luc-letter','letter-14','14 · Claire, j’ai pris le train à midi. J’ai écrit ton adresse sur l’enveloppe. Puis j’ai perdu ma lettre. Je reviens demain à six heures. Dans le jardin. Luc.',{kind:'letter'});
line('claire-letter','letter-15','15 · Luc, hier tu as perdu la lettre. J’ai trouvé ta photo dans ma boîte. J’ai donné ta lettre à notre père. Aujourd’hui, la lettre est dans le jardin. Demain, notre rendez-vous est à six heures. Je veux comprendre ton histoire. Claire.',{kind:'letter'});
line('found-address','address-0','L’adresse de Claire.',{kind:'envelope',detail:'adresse'},'top');
line('claire-reply','claire','J’ai une photo.',{kind:'portrait'},'speech');
const clues=[
 line('task-key','instructions','Prends la clé sous le livre rouge.',{kind:'position',detail:'sous:key-book'}),
 line('task-gate','instructions','Ouvre la grande porte du jardin.',{kind:'door'}),
 line('task-letter','instructions','Prends la lettre d’hier.',{kind:'calendar',label:'14 · 15 · 16'}),
 line('task-envelope','instructions','Dans l’enveloppe. L’adresse est dans le livre rouge.',{kind:'envelope',detail:'adresse'}),
 line('task-take-envelope','instructions','Prends l’enveloppe avec la lettre d’hier, pas l’enveloppe rouge.',{kind:'envelope'}),
 line('task-stamp','instructions','Avec le timbre sous la photo de Luc.',{kind:'envelope',detail:'timbre'}),
 line('task-recipient','luc','Pour ma sœur. Elle a la photo.',{kind:'family',detail:'sœur'},'speech',{actorPoses:{claire:{holds:'photo-held'},anne:{holds:'book-held'}}}),
];
function page(id:string,kind:JournalPage['kind'],words:string[],pictures:Picture[]):JournalPage {
 return {id:`lettres-v2-${id}`,title:['Ⅰ','Ⅱ','Ⅲ','Ⅳ','Ⅴ','Ⅵ','Ⅶ','Ⅷ'][Number(id)-1],zone:'lettres',kind,words,requiresEvidence:words.flatMap(word=>witnesses[word]??[]),slots:words.map((answer,index)=>({id:`lettres-v2-${id}-${index}`,answer,picture:pictures[index]}))};
}
const pages:JournalPage[]=[
 page('01','vocabulary',['photo','enveloppe','adresse','timbre','crayon'],[{kind:'portrait',detail:'photo'},{kind:'envelope'},{kind:'envelope',detail:'adresse'},{kind:'envelope',detail:'timbre'},{kind:'pencil'}]),
 page('02','grammar',['lire','écrire','voir','trouver','perdre'],['lire','écrire','voir','trouver','perdre'].map(detail=>({kind:'action',detail}))),
 page('03','grammar',['lu','écrit','pris','donné'],['read:letter','write:letter','take:key','give:key'].map(detail=>({kind:'lettres-vignette',detail:`past-${detail}`}))),
 page('04','grammar',['vu','trouvé','perdu'],['see:photo','find:key','lose:key'].map(detail=>({kind:'lettres-vignette',detail:`past-${detail}`}))),
 page('05','grammar',['hier','aujourd_hui','demain'],['hier','aujourd’hui','demain'].map(detail=>({kind:'calendar',detail,label:'14 · 15 · 16'}))),
 page('06','grammar',['toujours','déjà','enfin','bientôt'],['toujours','déjà','enfin','bientôt'].map(word=>pic(word))),
 page('07','vocabulary',['histoire','souvenir','promesse','rendez_vous','mais'],['histoire','souvenir','promesse','rendez_vous','mais'].map(word=>pic(word))),
 page('08','grammar',['retrouver','revenir','oublier','savoir','comprendre'],['retrouver','revenir','oublier','savoir','comprendre'].map(word=>pic(word))),
];
const zone:Zone={id:'lettres',design:'situated',title:'Les lettres',subtitle:'',intro:'',color:'#5e7460',accent:'#a58d64',scenery:['Luc','Claire','Anne','Paul','même'],scene,evidence,pages,encounterOrder:evidence.map(entry=>entry.id),puzzle:{id:'lettres-v2-reunion',legacyIds:['lettres-histoire'],title:'✦',instruction:'',success:'✧',requiredPages:pages.map(entry=>entry.id),steps:[],world:{exit:'garden-gate',clues,sequence:[
 {kind:'take',object:'key-yellow'},
 {kind:'operate',object:'garden-gate',operation:'open',tool:'key-yellow'},
 {kind:'take',object:'letter-14'},
 {kind:'place',object:'letter-14',target:'envelope-3',relation:'in'},
 {kind:'take',object:'envelope-3'},
 {kind:'combine',object:'envelope-3',target:'stamp-0'},
 {kind:'deliver',object:'envelope-3',target:'claire'},
]}}};
export const zoneLexicon:Lexeme[]=[];
export default zone;
