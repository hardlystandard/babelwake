import type { Evidence, JournalPage, Picture, ScenePose, Zone } from '../types';

/** Keep the workshop's introductions and working relationships useful in the
 * later conversations. Each person speaks in a situation, never a paradigm. */
export function supplement(zone:Zone):Zone {
 const scene=[...zone.scene!],evidence=[...zone.evidence];
 const added:Evidence[]=[];
 const speak=(id:string,actor:string,text:string,pointsTo?:string,actorPoses?:Record<string,ScenePose>)=>{
  const object=scene.find(o=>o.id===actor)!;
  const entry:Evidence={id:`atelier-v2-e-${id}`,title:`atelier-v2-e-${id}`,anchor:actor,surface:'speech',kind:'person',position:[...object.position],text,words:[],picture:{kind:'person'},...(pointsTo?{pose:{pointsTo}}:{}),...(actorPoses?{actorPoses}:{})};
  added.push(entry);return entry.id;
 };
 // Names are printed on the same workers. Self-introductions, addressed
 // introductions and third-person introductions contrast the same identity.
 for(const [n,actor,name,listener]of [[0,'paul','Paul','claire'],[1,'claire','Claire','anne'],[2,'anne','Anne','paul']]as[number,string,string,string][]){
  speak(`identity-self-${n}`,actor,`Je suis ${name}.`,actor);
  speak(`identity-addressed-${n}`,listener,`Tu es ${name}.`,actor);
  speak(`identity-third-${n}`,listener,actor==='paul'?`Il est ${name}.`:`Elle est ${name}.`,actor);
 }
 // Two visibly held objects distinguish shared possession from merely standing
 // nearby. The speaker changes; the same roles apply to keys, books and letters.
 speak('names-together','paul','Paul et Claire.','claire');
 for(const [n,speaker,partner,observer,one,two,noun]of [
  [0,'paul','claire','anne','key-b','key-g','clés'],
  [1,'claire','anne','marie','book-y','book-b','livres'],
  [2,'anne','marie','paul','letter-b','letter-g','lettres'],
 ]as[number,string,string,string,string,string,string][]){
  const poses={[speaker]:{holds:one},[partner]:{holds:two}};
  speak(`being-together-${n}`,speaker,`Nous sommes ${speaker==='paul'?'Paul et Claire':speaker==='claire'?'Claire et Anne':'Anne et Marie'}.`,partner);
  speak(`being-addressed-group-${n}`,observer,`Vous êtes ${speaker==='paul'?'Paul et Claire':speaker==='claire'?'Claire et Anne':'Anne et Marie'}.`,speaker);
  speak(`having-shared-${n}`,speaker,`Nous avons les ${noun}.`,partner,poses);
  speak(`having-addressed-${n}`,observer,`Vous avez les ${noun}.`,speaker,poses);
  speak(`having-you-${n}`,speaker,`Tu as ${noun==='clés'?'la clé':noun==='livres'?'le livre':'la lettre'}.`,partner,{[partner]:{holds:two}});
 }
 // A plural third-person reference points away from the speaker to two women
 // with distinct held objects, rather than treating elle/elles as coat colours.
 for(const [n,one,two,noun]of [[0,'key-b','key-g','clés'],[1,'book-y','book-b','livres'],[2,'letter-b','letter-g','lettres']]as[number,string,string,string][])
  speak(`having-they-${n}`,'paul',`Elles ont les ${noun}.`,'anne',{anne:{holds:one},marie:{holds:two}});
 for(const [n,target]of ['keys-a','books-a','boxes-a'].entries()){
  const object=scene.find(o=>o.id===target)!;object.color='noir';
  speak(`black-${n}`,['paul','anne','marie'][n],n===0?'clé noire':n===1?'livre noir':'boîte noire',target);
 }
 evidence.push(...added);
 const page=(id:string,words:string[],pictures:Picture[],requiresEvidence:string[]):JournalPage=>({id:`atelier-v2-${id}`,title:id==='09'?'Ⅸ':'Ⅹ',zone:'atelier',kind:'grammar',words,requiresEvidence,slots:words.map((answer,i)=>({id:`atelier-v2-${id}-${i}`,answer,picture:pictures[i]}))});
 const being=page('09',['suis','es','est','sommes','êtes'],['je','tu','il','nous','vous'].map(detail=>({kind:'grammar',detail})),added.filter(e=>/identity-|being-/.test(e.id)).map(e=>e.id));
 const having=page('10',['ai','as','a','avons','avez'],['je','tu','elle','nous','vous'].map(detail=>({kind:'possession-vignette',detail})),[...zone.evidence.filter(e=>e.id.includes('have-i-')).map(e=>e.id),...added.filter(e=>e.id.includes('having-')).map(e=>e.id)]);
 const pages=[...zone.pages,being,having];
 return {...zone,scene,evidence,pages,encounterOrder:evidence.map(e=>e.id),puzzle:{...zone.puzzle,requiredPages:pages.map(p=>p.id)}};
}
