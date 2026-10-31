import type { Evidence, JournalPage, Lexeme, Picture, SceneObject, WorldAction, Zone } from '../types';

/** A railway forecourt, three safe platforms and a physical route model.
 * French lives on tickets, clocks and conversations, never on answer cards. */
const scene:SceneObject[]=[
 {id:'station',kind:'station',position:[-10,3],size:1.1,label:'gare'},
 {id:'map-table',kind:'table',position:[0,6],size:[1.5,1,1.4],accepts:['on','under']},
 {id:'route-plan',kind:'map',position:[0,6],size:1.5,detail:'bridge-north',label:'plan',placement:{target:'map-table',relation:'on'}},
 {id:'mini-station',kind:'station',position:[0,6],size:.32,label:'gare',placement:{target:'map-table',relation:'on',offset:[.9,.1,-.6]}},
 {id:'mini-street',kind:'street',position:[0,6],size:.28,placement:{target:'map-table',relation:'on',offset:[.5,.1,.3]}},
 {id:'mini-bridge',kind:'bridge',position:[0,6],size:.35,label:'pont',placement:{target:'map-table',relation:'on',offset:[0,.1,0]}},
 {id:'mini-place',kind:'plaza',position:[0,6],size:.35,label:'place',placement:{target:'map-table',relation:'on',offset:[-.9,.1,.6]}},
 {id:'street',kind:'street',position:[-6,8],size:1.2,label:'rue'},
 {id:'bridge',kind:'bridge',position:[9,7],size:.8,label:'pont'},
 {id:'plaza',kind:'plaza',position:[-5,4],size:1.2,label:'place'},
 {id:'main-board',kind:'notice',position:[0,-3]},
 {id:'large-clock',kind:'clock',position:[7,3],size:1.3,value:1200,detail:'standing-midi',label:'midi'},
 {id:'morning-clock',kind:'clock',position:[-9,-3],size:.7,value:800,detail:'matin',label:'matin'},
 {id:'evening-clock',kind:'clock',position:[9,-3],size:.7,value:2000,detail:'soir',label:'soir'},
 {id:'guide',kind:'npc-male',position:[-2,1],label:'Luc',recipient:true},
 {id:'traveller-a',kind:'npc-female',position:[-6,1],label:'Anne',recipient:true},
 {id:'traveller-b',kind:'npc-male',position:[3,1],label:'Paul',recipient:true},
 {id:'traveller-c',kind:'npc-female',position:[8,-6],label:'Claire',recipient:true,placement:{target:'platform-3',relation:'on',offset:[.5,0,.5]}},
 {id:'ticket-box',kind:'box',position:[-10,-1],size:.75,color:'bleue',label:'boîte bleue',portable:true,container:true,open:true,operations:['open','close']},
 {id:'ticket-r',kind:'ticket',position:[-10,-1],size:.8,color:'rouge',label:'billet rouge',portable:true,value:1200,detail:'12:00 · 3',placement:{target:'ticket-box',relation:'in'}},
 {id:'ticket-b',kind:'ticket',position:[-7,1],size:.8,color:'bleue',label:'billet bleu',portable:true,value:805,detail:'08:05 · 1'},
 {id:'ticket-y',kind:'ticket',position:[3,5],size:.8,color:'jaune',label:'billet jaune',portable:true,value:1830,detail:'18:30 · 2'},
 {id:'bag-r',kind:'bag',position:[-7,-6],size:.6,color:'rouge',label:'sac rouge',portable:true,placement:{target:'bench-b',relation:'under'}},
 {id:'bag-b',kind:'bag',position:[1,-6],size:.6,color:'bleue',label:'sac bleu',portable:true,placement:{target:'bench-r',relation:'on'}},
 {id:'bag-y',kind:'bag',position:[4,5],size:.6,color:'jaune',label:'sac jaune',portable:true},
 {id:'bench-b',kind:'bench',position:[-7,-6],size:.65,color:'bleue',label:'banc bleu',accepts:['on','under']},
 {id:'bench-r',kind:'bench',position:[1,-6],size:.65,color:'rouge',label:'banc du quai',accepts:['on','under']},
 {id:'bench-g',kind:'bench',position:[5,-6],size:.65,color:'verte',label:'banc vert',accepts:['on','under']},
 {id:'letter-b',kind:'letter',position:[7,1.4],color:'bleue',size:.65,label:'lettre bleue',portable:true},
 {id:'letter-r',kind:'letter',position:[-4,4],color:'rouge',size:1.2,label:'grande lettre',portable:true},
 {id:'letter-y',kind:'letter',position:[3,4],color:'jaune',size:.6,label:'lettre jaune',portable:true},
 {id:'extra-box',kind:'box',position:[11,1],size:.6,color:'jaune',container:true,open:true,operations:['open','close']},
 {id:'key-in-box',kind:'key',position:[11,1],size:.3,color:'jaune',placement:{target:'extra-box',relation:'in',offset:[.35,0,.2]}},
 {id:'letter-in-box',kind:'letter',position:[11,1],size:.45,color:'rouge',placement:{target:'extra-box',relation:'in'}},
 {id:'key-under-table',kind:'key',position:[0,6],size:.35,color:'jaune',placement:{target:'map-table',relation:'under'}},
 {id:'book-under-bench',kind:'book',position:[5,-6],size:.45,color:'jaune',placement:{target:'bench-g',relation:'under'}},
 {id:'ticket-on-table',kind:'ticket',position:[0,6],size:.4,color:'jaune',placement:{target:'map-table',relation:'on',offset:[-1,.1,0]}},
 {id:'book-on-bench',kind:'book',position:[5,-6],size:.4,color:'rouge',placement:{target:'bench-g',relation:'on'}},
 {id:'half-bread',kind:'bread',position:[-11,6],detail:'half',label:'demi-pain',size:.5},
 {id:'half-apple',kind:'apple',position:[-10,7],detail:'half',label:'demi-pomme',size:.5},
 {id:'half-cheese',kind:'cheese',position:[-9,8],detail:'half',label:'demi-fromage',size:.5},
];
for(const [i,color,time]of [[1,'rouge',805],[2,'verte',1830],[3,'bleue',1200]] as const){
 const x=(i-2)*8;
 scene.push(
  {id:`platform-${i}`,kind:'platform',position:[x,-8],size:[.7,1,.8],detail:String(i),label:`quai ${['un','deux','trois'][i-1]}`},
  {id:`train-${i}`,kind:'train',position:[x,-11],size:.7,color,label:`train ${color}`,operations:['open','close'],toolKind:'ticket'},
  {id:`clock-${i}`,kind:'clock',position:[x+2,-8],size:.48,value:time,detail:time===1200?'midi':time===805?'matin':'soir'},
  // These differences are physically visible around a front-facing carriage.
  {id:`front-${i}`,kind:'key',position:[x+2.7,-11],size:.32,color:'jaune'},
  {id:`back-${i}`,kind:'bag',position:[x-2.7,-11],size:.32,color:'rouge'},
  {id:`side-${i}`,kind:'ticket',position:[x,-9.5],size:.4,color:'blanc'},
 );
}
// A plausible neighbouring carriage door is a lexical lure, not a blocked option.
scene.push({id:'side-door',kind:'door',position:[-10,-10],size:.5,label:'porte du train',operations:['open','close'],toolKind:'ticket'});
for(const [i,detail]of ['gauche','droite','tout droit','nord','sud'].entries())scene.push({id:`arrow-${i}`,kind:'direction',position:[-4+i*2,9],size:.55,detail,label:detail});
// Route planning and the traveller's lunch belong on working tables.
scene.push({id:'lunch-table',kind:'table',position:[-10,7.5],size:.85});
for(const [i,id]of ['half-bread','half-apple','half-cheese'].entries())scene.find(o=>o.id===id)!.placement={target:'lunch-table',relation:'on',offset:[(i-1)*.7,0,0]};
for(let i=0;i<3;i++)scene.push({id:`clock-desk-${i}`,kind:'table',position:[-5+i*4,3],size:[1,1,1.6]});
// The timetable desks have paired clock faces for three measured intervals.
for(const [row,times]of [[[800,900],[1100,1200],[1800,1900]],[[805,806],[1200,1201],[1830,1831]],[[800,815],[1200,1230],[1800,1845]]].entries()) for(const [i,[start,end]]of times.entries()){
 const prefix=['hour','minute','delay'][row],x=-5+i*4,z=2+row*1.1;
 scene.push({id:`${prefix}-start-${i}`,kind:'clock',position:[x,z],size:.27,value:start,placement:{target:`clock-desk-${i}`,relation:'on',offset:[-.55,0,(row-1)*.75]}},
  {id:`${prefix}-end-${i}`,kind:'clock',position:[x+1.1,z],size:.27,value:end,placement:{target:`clock-desk-${i}`,relation:'on',offset:[.55,0,(row-1)*.75]}});
}
// Miniature route demonstrations show a beginning and an end with arrow direction.
for(let i=0;i<3;i++)scene.push(
 {id:`route-desk-${i}`,kind:'table',position:[-7.5+i*6,10.5],size:[1.25,1,.85]},
 {id:`departure-${i}`,kind:'journey',position:[-9+i*6,11],size:.45,detail:'departure',placement:{target:`route-desk-${i}`,relation:'on',offset:[-.85,0,0]}},
 {id:`arrival-${i}`,kind:'journey',position:[-6+i*6,11],size:.45,detail:'arrival',placement:{target:`route-desk-${i}`,relation:'on',offset:[.85,0,0]}},
);
for(const [i,detail]of ['gauche','droite','tout droit','nord','sud'].entries())for(let n=0;n<2;n++)scene.push(
 {id:`route-arrow-${i}-${n}`,kind:'direction',position:[-6+i*3,-4+n*2],size:.28,detail},
);

const evidence:Evidence[]=[];
function line(id:string,anchor:string,text:string,picture:Picture,surface:Evidence['surface']='top',extra:Partial<Evidence>={}):string{
 const object=scene.find(o=>o.id===anchor)!;
 const entry:Evidence={id:`gare-v2-e-${id}`,title:`gare-v2-e-${id}`,anchor,text,words:[],picture,surface,kind:surface==='speech'?'person':surface==='note'?'note':'object',position:[...object.position],...extra};
 evidence.push(entry);return entry.id;
}
function speech(id:string,actor:string,text:string,picture:Picture,target?:string,extra:Partial<Evidence>={}):string{
 return line(id,actor,text,picture,'speech',{...(target?{pose:{pointsTo:target}}:{}),...extra});
}
const p=(kind:string,detail?:string):Picture=>({kind,...(detail?{detail}:{})});
// Ordered first readings introduce the actual printed forms, at most two at a time.
for(const id of ['station','mini-station','route-plan','mini-bridge','mini-place','street','bridge','plaza','platform-1','platform-2','platform-3','train-1','train-2','train-3','ticket-box','ticket-r','ticket-b','ticket-y','bag-r','bag-b','bag-y','bench-b','bench-r','bench-g','letter-b','letter-r','letter-y','large-clock','morning-clock','evening-clock','half-bread','half-apple','half-cheese',...Array.from({length:5},(_,i)=>`arrow-${i}`)]){
 const object=scene.find(o=>o.id===id)!;
 line(`label-${id}`,id,object.label!,p(object.kind,object.detail));
}
// Arrival and departure are paired timetable movements, not a route to a house.
line('heading-departure','main-board','départ',p('concept','départ:0'),'note');
line('heading-arrival','main-board','arrivée',p('concept','arrivée:0'),'note');
line('heading-destination','main-board','destination',p('concept','destination:1'),'note');
line('minute-name','minute-start-1','minute',p('clock','minute'));
line('hour-name','hour-start-1','heure',p('clock','heure'));
line('delay-name','delay-end-2','retard',p('concept','retard:2'));
// Each platform is tied to one service by time, platform number and destination.
line('service-a','main-board','Départ 08:05. Quai un, gare du Sud.',{kind:'time',label:'08:05'},'note');
line('service-b','main-board','Départ 18:30. Quai deux, gare du Sud.',{kind:'time',label:'18:30'},'note');
line('service-c','main-board','Départ midi. Quai trois, gare du Nord.',{kind:'time',label:'12:00'},'note');
line('arrival-a','main-board','Arrivée 09:05. Destination gare du Sud.',p('concept','destination:1'),'note');
line('arrival-b','main-board','Arrivée 19:30. Destination gare du Sud.',p('concept','destination:1'),'note');
line('arrival-c','main-board','Arrivée 13:00. Destination gare du Nord.',p('concept','destination:1'),'note');

const speakers=['guide','traveller-a','traveller-b'];
for(const [i,actor]of speakers.entries()){
 speech(`gare-${i}`,actor,'La gare.',p('station'),['station','mini-station','route-plan'][i]);
 speech(`train-${i}`,actor,'Le train.',p('train'),`train-${i+1}`);
 speech(`ticket-${i}`,actor,'Le billet.',p('ticket'),['ticket-r','ticket-b','ticket-y'][i]);
 speech(`platform-${i}`,actor,`Le quai ${['un','deux','trois'][i]}.`,p('station','quai'),`platform-${i+1}`);
 // Static spatial evidence uses the same clearly oriented carriage in each row.
 speech(`front-${i}`,actor,'Devant le train.',p('position','devant:key-box'),`front-${i+1}`);
 speech(`back-${i}`,actor,'Derrière le train.',p('position','derrière:bag-box'),`back-${i+1}`);
 speech(`side-${i}`,actor,'À côté de ce train.',p('position','à côté de:ticket-box'),`side-${i+1}`);
}
for(const [i,actor]of speakers.entries()){
 const arrow=(n:number)=>i===0?`arrow-${n}`:`route-arrow-${n}-${i-1}`;
 speech(`left-${i}`,actor,'À gauche.',p('direction','gauche'),arrow(0));
 speech(`right-${i}`,actor,'À droite.',p('direction','droite'),arrow(1));
 speech(`straight-${i}`,actor,'Tout droit.',p('direction','tout droit'),arrow(2));
 speech(`north-${i}`,actor,'Le nord.',p('concept','nord:0'),arrow(3));
 speech(`south-${i}`,actor,'Le sud.',p('concept','sud:0'),arrow(4));
 speech(`map-${i}`,actor,'Le plan.',p('map'),'route-plan');
 speech(`bridge-${i}`,actor,'Le pont.',p('concept','pont:0'),['mini-bridge','bridge','route-plan'][i]);
 speech(`street-${i}`,actor,'La rue.',p('concept','rue:0'),['street','mini-street','route-plan'][i]);
 speech(`plaza-${i}`,actor,'La place.',p('concept','place:0'),['mini-place','plaza','route-plan'][i]);
 speech(`morning-${i}`,actor,'Le matin.',p('concept','matin:1'),['morning-clock','clock-1','ticket-b'][i]);
 speech(`evening-${i}`,actor,'Le soir.',p('concept','soir:1'),['evening-clock','clock-2','ticket-y'][i]);
 speech(`noon-${i}`,actor,'Midi.',{kind:'time',label:'12:00'},['large-clock','clock-3','ticket-r'][i]);
 speech(`half-${i}`,actor,["Un demi-pain.","Une demi-pomme.","Un demi-fromage."][i],p('concept',`demi:${i}`),['half-bread','half-apple','half-cheese'][i]);
 speech(`minute-${i}`,actor,['Une minute. 08:05 → 08:06.','Une minute. 12:00 → 12:01.','Une minute. 18:30 → 18:31.'][i],p('clock','minute'),`minute-end-${i}`);
 speech(`hour-${i}`,actor,['Une heure. 08:00 → 09:00.','Une heure. 11:00 → 12:00.','Une heure. 18:00 → 19:00.'][i],p('clock','heure'),`hour-end-${i}`);
 speech(`delay-${i}`,actor,['Retard. 08:00 → 08:15.','Retard. 12:00 → 12:30.','Retard. 18:00 → 18:45.'][i],p('concept',`retard:${i}`),`delay-end-${i}`);
 speech(`departure-${i}`,actor,`Départ. ${['08:05','18:30','12:00'][i]}.`,p('concept','départ:0'),`departure-${i}`);
 speech(`arrival-${i}`,actor,`Arrivée. ${['09:05','19:30','13:00'][i]}.`,p('concept','arrivée:0'),`arrival-${i}`);
 speech(`destination-${i}`,actor,`Destination ${i===2?'nord':'sud'}.`,p('concept','destination:1'),i===2?'mini-station':'station');
}
// The map's route and actors' pointing distinguish speaker/addressee/group.
for(const [i,target]of ['station','mini-station','train-3'].entries()){
 speech(`go-i-${i}`,'guide','Je vais à la gare.',p('grammar','je'),target,{travel:{actor:'guide',target}});
 speech(`go-you-${i}`,'traveller-a','Tu vas à la gare.',p('grammar','tu'),'guide',{actorPoses:{guide:{pointsTo:target}},travel:{actor:'guide',target}});
 speech(`go-we-${i}`,'guide','Nous allons à la gare.',p('grammar','nous'),target,{actorPoses:{'traveller-a':{pointsTo:target}},travel:{actor:'guide',target,companions:['traveller-a']}});
 speech(`go-formal-${i}`,'traveller-b','Vous allez à la gare.',p('grammar','vous'),'traveller-a',{actorPoses:{'traveller-a':{pointsTo:target},guide:{pointsTo:target}},travel:{actor:'traveller-a',target,companions:['guide']}});
 speech(`go-she-${i}`,'guide','Elle va à la gare.',p('grammar','elle'),'traveller-a',{actorPoses:{'traveller-a':{pointsTo:target}},travel:{actor:'traveller-a',target}});
 speech(`go-they-${i}`,'guide','Ils vont à la gare.',p('grammar','nous'),'traveller-b',{actorPoses:{'traveller-a':{pointsTo:target},'traveller-b':{pointsTo:target}},travel:{actor:'traveller-b',target,companions:['traveller-a']}});
 speech(`go-inf-${i}`,'traveller-a','Je veux aller à la gare.',p('action','aller'),target,{travel:{actor:'traveller-a',target}});
 speech(`leave-${i}`,'guide','Je veux partir.',p('concept',`partir:${i}`),`departure-${i}`,{travel:{actor:'guide',target:`train-${i+1}`}});
 speech(`arrive-${i}`,'traveller-a','Je veux arriver.',p('concept',`arriver:${i}`),`arrival-${i}`,{travel:{actor:'traveller-a',target:['station','train-3','plaza'][i]}});
 speech(`wait-${i}`,'guide','Attendez sur le quai.',p('concept',`attendre:${i}`),`platform-${i+1}`);
 speech(`here-${i}`,speakers[i],'Ici.',p('concept',`ici:${i}`),speakers[i]);
 speech(`there-${i}`,'guide','Là.',p('concept',`là:${i}`),target);
 speech(`then-${i}`,'traveller-b','Le billet, puis le train.',p('concept',`puis:${i}`),`train-${i+1}`);
}
// Three physical earlier-word reapplications; the relay requires these relations.
for(const [i,actor]of speakers.entries()){
 speech(`on-${i}`,actor,['Sur le banc.','Sur la table.','Sur le banc.'][i],p('position','sur:bag-table'),['bag-b','ticket-on-table','book-on-bench'][i]);
 speech(`under-${i}`,actor,['Sous le banc.','Sous la table.','Sous le banc.'][i],p('position','sous:bag-table'),['bag-r','key-under-table','book-under-bench'][i]);
 speech(`in-${i}`,actor,['Dans la boîte.','Dans la boîte.','Dans la boîte.'][i],p('position','dans:ticket-box'),['ticket-r','letter-in-box','key-in-box'][i]);
}

speech('open-rehearsal','guide','Ouvre la porte.',p('action','ouvrir'),'side-door',{demonstration:{actor:'guide',action:{kind:'operate',object:'side-door',operation:'open'}}});
speech('address-rehearsal','guide','Pour Claire.',p('concept','pour:0'),'traveller-c');

const clueIds=[
 line('task-ticket','main-board','Prends le billet dans la boîte bleue.',p('ticket'),'note'),
 line('task-train','main-board','Le train pour la gare du Nord. Ouvre sa porte.',p('train'),'note'),
 line('task-bag','main-board','Prends le sac sous le banc bleu.',p('bag'),'note'),
 line('task-stow','main-board','Le sac. Sous le banc du quai trois.',p('position','sous:bag-table'),'note'),
 line('task-letter','main-board','Prends la lettre derrière la grande horloge.',p('letter'),'note'),
 speech('task-recipient','guide','Pour elle. Elle attend sur le quai trois.',p('grammar','elle')),
];
// The guide's own request scores highest; Claire is identified by her safe platform.
speech('reply','traveller-c','J’attends.',p('concept','attendre:0'));

function page(id:string,words:string[],pictures:Picture[],kind:JournalPage['kind']='vocabulary'):JournalPage{
 // prepareZone indexes visible forms later; explicit reference IDs name the authored contrasts.
 const requiresEvidence=kind==='grammar'?evidence.filter(e=>/speech/.test(e.surface??'')).filter(e=>words.some(word=>e.text.toLocaleLowerCase('fr').includes(word==='tout_droit'?'tout droit':word))).map(e=>e.id):[];
 return{id:`gare-v2-${id}`,title:'✦',zone:'gare',kind,words,requiresEvidence,slots:words.map((answer,i)=>({id:`gare-v2-${id}-${i}`,answer,picture:pictures[i]}))};
}
const pages:JournalPage[]=[
 page('voyage',['gare','train','billet','quai'],[p('station'),p('train'),p('ticket'),p('station','quai')]),
 page('place',['sur','sous','dans'],['sur','sous','dans'].map(r=>p('position',`${r}:bag-table`)),'grammar'),
 page('autour',['devant','derrière','à côté de'],['devant','derrière','à côté de'].map(r=>p('position',`${r}:key-box`)),'grammar'),
 page('chemin',['gauche','droite','tout_droit'],['gauche','droite','tout droit'].map(r=>p('direction',r))),
 page('plan',['nord','sud','plan'],[p('gare-vignette','north'),p('gare-vignette','south'),p('map')]),
 page('ville',['pont','rue','place'],['pont','rue','place'].map(r=>p('concept',`${r}:0`))),
 page('moments',['matin','soir','midi','demi'],[p('concept','matin:0'),p('concept','soir:0'),{kind:'time',label:'12:00'},p('concept','demi:0')]),
 page('temps',['heure','minute','retard'],[p('gare-vignette','hour'),p('gare-vignette','minute'),p('concept','retard:0')],'grammar'),
 page('trajets',['départ','arrivée','destination'],['départ','arrivée','destination'].map(r=>p('concept',`${r}:0`)),'grammar'),
 page('mouvements',['partir','arriver','attendre'],[p('concept','partir:0'),p('concept','arriver:0'),p('concept','attendre:0')],'grammar'),
 page('aller',['vais','vas','allons','allez'],['je','tu','nous','vous'].map(r=>p('gare-vignette',`go-${r}`)),'grammar'),
 page('autres-voyageurs',['va','vont','aller'],[p('gare-vignette','go-elle'),p('gare-vignette','go-ils'),p('action','aller')],'grammar'),
 page('reperes',['ici','là','puis'],[p('concept','ici:0'),p('concept','là:0'),p('concept','puis:0')],'grammar'),
];
// Grammar pages must wait for the relevant complete physical exchanges.
const prefix=(...names:string[])=>evidence.filter(e=>names.some(name=>e.id.startsWith(`gare-v2-e-${name}`))).map(e=>e.id);
pages.find(x=>x.id==='gare-v2-aller')!.requiresEvidence=prefix('go-i-','go-you-','go-we-','go-formal-');
pages.find(x=>x.id==='gare-v2-mouvements')!.requiresEvidence=prefix('leave-','arrive-','wait-');
pages.find(x=>x.id==='gare-v2-autres-voyageurs')!.requiresEvidence=prefix('go-she-','go-they-','go-inf-');

pages.find(x=>x.id==='gare-v2-reperes')!.requiresEvidence=prefix('here-','there-','then-');

const zone:Zone={id:'gare',design:'situated',title:'La gare',subtitle:'',intro:'',color:'#677d82',accent:'#b18b52',scenery:['Luc','Anne','Paul','Claire','banc','du','horloge','N','S'],scene,evidence,pages,encounterOrder:evidence.map(e=>e.id),puzzle:{id:'gare-v2-trajet',legacyIds:['gare-trajet'],title:'✦',instruction:'',success:'✧',requiredPages:pages.map(p=>p.id),steps:[],world:{exit:'train-3',clues:clueIds,sequence:[
 {kind:'take',object:'ticket-r'},
 {kind:'operate',object:'train-3',operation:'open',tool:'ticket-r'},
 {kind:'take',object:'bag-r'},
 {kind:'place',object:'bag-r',target:'bench-g',relation:'under'},
 {kind:'take',object:'letter-b'},
 {kind:'deliver',object:'letter-b',target:'traveller-c'},
]}}};
export const zoneLexicon:Lexeme[]=[];
export default zone;
