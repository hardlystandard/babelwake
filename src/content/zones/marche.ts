import type { Zone, Lexeme, Evidence, JournalPage, Picture } from '../types';
export const zoneLexicon:Lexeme[]=[
['pain',['pain','pains']],['pomme',['pomme','pommes']],['fromage',['fromage','fromages']],['eau',['eau','eaux']],['œuf',['œuf','œufs']],['lait',['lait']],['poisson',['poisson','poissons']],['fruit',['fruit','fruits']],['légume',['légume','légumes']],['panier',['panier','paniers']],['sac',['sac','sacs']],['marché',['marché','marchés']],['acheter',['acheter','achète','achètes','achetons','achetez','achètent']],['donner',['donner','donne','donnes','donnons','donnez','donnent']],['prendre',['prendre','prends','prend','prenons','prenez','prennent']],['vouloir',['vouloir','veux','veut','voulons','voulez','veulent']],['payer',['payer','paie','paies','payons','payez','paient']],['coûter',['coûter','coûte','coûtent']],['euro',['euro','euros','€']],['deux',['deux']],['trois',['trois']],['quatre',['quatre']],['cinq',['cinq']],['six',['six']],['sept',['sept']],['huit',['huit']],['neuf',['neuf']],['dix',['dix']],['onze',['onze']],['douze',['douze']],['treize',['treize']],['quatorze',['quatorze']],['quinze',['quinze']],['seize',['seize']],['vingt',['vingt']],['trente',['trente']],['quarante',['quarante']],['cinquante',['cinquante']],['soixante',['soixante']],['cent',['cent']],['ne…pas',['ne…pas','ne','n’','pas']],['sans',['sans']],['avec',['avec']],['tout',['tout','toute','tous','toutes']],['cher',['cher','chère','chers','chères']],['frais',['frais','fraîche','fraîches']],['bon',['bon','bonne','bons','bonnes']]
].map(([id,forms])=>({id:id as string,lemma:id as string,forms:forms as string[],zone:'marche'}));
const e=(id:string,title:string,text:string,words:string[],picture:Picture,n:number):Evidence=>({id:`marche-e-${id}`,title,text,words,picture,position:[-7+(n%8)*2,-5+Math.floor(n/8)*2],kind:n%3===0?'person':n%3===1?'object':'note'});
const page=(id:string,title:string,words:string[],pictures:Picture[],kind:'vocabulary'|'grammar'='vocabulary'):JournalPage=>({id:`marche-${id}`,title,zone:'marche',kind,words,slots:words.map((answer,i)=>({id:`${id}-${i}`,answer,picture:pictures[i]}))});
const zone:Zone={id:'marche',title:'Le marché',subtitle:'Les mots ont du poids.',color:'#d7b48a',accent:'#b94f36',intro:'Sous les toiles du marché, les paniers passent de main en main. Claire a laissé une liste chez le marchand.',evidence:[
e('etal','L’étal','Le pain coûte deux euros. Les pommes coûtent cinq euros. Le fromage coûte dix euros. L’eau coûte un euro.',['pain','pomme','fromage','eau','deux','cinq','dix','coûter'],{kind:'quantity',detail:'market',count:4,label:'2 € · 5 € · 10 € · 1 €'},0),
e('panier','Le panier','Du pain dans le panier, une pomme dans la main, du fromage dans le sac et de l’eau dans la bouteille.',['pain','pomme','fromage','eau','panier','sac'],{kind:'basket',detail:'food'},1),
e('dejeuner','Le déjeuner','Elle coupe le pain. Il mange la pomme. Nous partageons le fromage. Vous buvez de l’eau.',['pain','pomme','fromage','eau'],{kind:'table',detail:'food'},2),
e('deux','Deux mains','Deux mains portent deux pommes.',['deux','pomme'],{kind:'quantity',detail:'apple',count:2,label:'2'},3),
e('cinq','Cinq doigts','Cinq doigts, cinq pièces : cinq euros.',['cinq','euro'],{kind:'quantity',detail:'money',count:5,label:'5 €'},4),
e('dix','Les deux mains','Dix doigts, dix pièces : dix euros.',['dix','euro','deux'],{kind:'quantity',detail:'money',count:10,label:'10 €'},5),
e('vingt','Les pièces','Deux groupes de dix pièces font vingt euros.',['deux','dix','vingt','euro'],{kind:'price',count:20,label:'10 + 10 = 20 €'},6),
e('commande','La commande','Je veux du pain. Tu veux de l’eau. Il veut une pomme. Elle veut du fromage. Nous voulons deux pains. Vous voulez cinq pommes.',['vouloir','pain','eau','pomme','fromage','deux','cinq'],{kind:'action',detail:'vouloir',label:'Je → pain · tu → eau'},7),
e('achat','L’achat','J’achète cinq pommes. Tu achètes deux pains. Nous achetons du fromage. Vous achetez de l’eau.',['acheter','cinq','deux','pomme','pain','fromage','eau'],{kind:'action',detail:'acheter'},8),
e('echange','L’échange','Je donne dix euros. Le marchand donne le pain. Tu prends le pain. Nous prenons les pommes.',['donner','prendre','dix','pain','pomme'],{kind:'action',detail:'donner'},9),
e('mains','De main en main','Tu donnes le panier. Elle prend le panier. Nous donnons les sacs. Vous prenez les sacs.',['donner','prendre','panier','sac'],{kind:'action',detail:'prendre'},10),
e('liste','La liste de Claire','Je veux du pain et du fromage. Je ne veux pas de pommes. Je veux de l’eau sans lait. Je veux un sac avec une lettre.',['vouloir','ne…pas','sans','avec','pain','fromage','eau','lait','pomme'],{kind:'letter',detail:'food',label:'Pour Claire'},11),
e('refus','La main levée','Il veut une pomme. Elle ne veut pas de pomme. Un panier avec des pommes ; un panier sans pommes.',['vouloir','ne…pas','avec','sans','pomme'],{kind:'grammar',detail:'negative',label:'✓ · ✕'},12),
e('bouteilles','Les bouteilles','L’eau est dans la bouteille bleue. La bouteille rouge est sans eau. La bouteille verte est avec le panier. Je ne prends pas la bouteille rouge.',['eau','sans','avec','ne…pas','prendre'],{kind:'bottle',color:'bleu',detail:'full-empty'},13),
e('client','Le client','J’achète du pain avec vingt euros. Je donne vingt euros. Le marchand me donne dix euros et un pain à dix euros.',['acheter','donner','vingt','dix','pain','avec'],{kind:'price',label:'20 € → 10 € + 10 €'},14),
e('balance','La balance','Vingt pommes : deux groupes de dix. Je prends le grand panier. J’achète les pommes pour vingt euros.',['vingt','deux','dix','prendre','acheter','pomme'],{kind:'quantity',detail:'apple',count:20,label:'20'},15),
e('nombres','Les nombres','1 un · 2 deux · 3 trois · 4 quatre · 5 cinq · 6 six · 7 sept · 8 huit · 9 neuf · 10 dix · 11 onze · 12 douze · 13 treize · 14 quatorze · 15 quinze · 16 seize · 17 dix-sept · 18 dix-huit · 19 dix-neuf · 20 vingt.',['un','deux','trois','quatre','cinq','six','sept','huit','neuf','dix','onze','douze','treize','quatorze','quinze','seize','vingt'],{kind:'quantity',detail:'money',count:10,label:'1 → 20'},16),
e('prix','Les prix','21 vingt et un · 30 trente · 40 quarante · 50 cinquante · 60 soixante · 70 soixante-dix · 71 soixante et onze · 80 quatre-vingts · 81 quatre-vingt-un · 90 quatre-vingt-dix · 100 cent.',['vingt','trente','quarante','cinquante','soixante','cent'],{kind:'price',label:'20 → 100 €'},17),
e('autre-etal','L’autre étal','Les œufs sont dans une boîte. Le poisson frais est sur la glace. Les fruits et les légumes sont dans les paniers. Ce fromage est cher : cent euros !',['œuf','poisson','frais','fruit','légume','cher','cent'],{kind:'fish',detail:'stall',label:'100 €'},19),
e('mission','Pour le café','Pour Claire : deux pains, cinq pommes, un fromage et une bouteille d’eau. Le tout coûte vingt euros. Donne la lettre au café.',['deux','cinq','pain','pomme','fromage','eau','vingt','donner','lettre'],{kind:'letter',detail:'shopping',label:'2 · 5 · 1 · 1 → 20 €'},18)
],pages:[
page('aliments','Le panier',['pain','pomme','fromage','eau'],[{kind:'bread'},{kind:'apple'},{kind:'cheese'},{kind:'water'}]),
page('nombres','Les quantités',['deux','cinq','dix','vingt'],[2,5,10,20].map(count=>({kind:'quantity',detail:'money',count,label:String(count)})),'grammar'),
page('gestes','L’échange',['vouloir','acheter','donner','prendre'],[{kind:'action',detail:'vouloir'},{kind:'action',detail:'acheter'},{kind:'action',detail:'donner'},{kind:'action',detail:'prendre'}],'grammar'),
page('negation','Ce qui manque',['ne…pas','avec','sans'],[{kind:'grammar',detail:'negative',label:'Je ___ veux ___ de pomme.'},{kind:'basket',detail:'full',label:'Un panier ___ des pommes.'},{kind:'basket',detail:'empty',label:'Un panier ___ pommes.'}],'grammar')
],puzzle:{id:'marche-panier',title:'Le panier de Claire',instruction:'Prépare la commande de Claire. Le marchand attend le panier et le paiement.',requiredPages:['marche-aliments','marche-nombres','marche-gestes','marche-negation'],steps:[
{id:'pain',prompt:'Pour Claire : deux pains.',picture:{kind:'bread'},choices:['Un pain','Deux pains','Cinq pains','Dix pains'],answer:'Deux pains'},
{id:'pommes',prompt:'Pour Claire : cinq pommes.',picture:{kind:'apple'},choices:['Deux pommes','Dix pommes','Cinq pommes','Vingt pommes'],answer:'Cinq pommes'},
{id:'fromage',prompt:'Pour Claire : un fromage.',picture:{kind:'cheese'},choices:['Un fromage','Deux fromages','Cinq fromages','Dix fromages'],answer:'Un fromage'},
{id:'boisson',prompt:'Je veux de l’eau sans lait.',picture:{kind:'bottle'},choices:['Du lait','De l’eau avec du lait','De l’eau','Du café'],answer:'De l’eau'},
{id:'payer',prompt:'Le tout coûte vingt euros.',picture:{kind:'money'},choices:['Deux euros','Cinq euros','Dix euros','Vingt euros'],answer:'Vingt euros'},
{id:'destination',prompt:'Donne la lettre au café.',picture:{kind:'letter'},choices:['Au marché','À l’atelier','À la gare','Au café'],answer:'Au café'}
],success:'Le panier est prêt. Au café, quelqu’un attend la lettre.'}};

zoneLexicon.push(...['veux','veut','voulons','voulez'].map(id=>({id,lemma:'vouloir',forms:[id],zone:'marche' as const})));
zone.evidence.push(
 e('choix','Les deux paniers','Je veux un pain. Tu veux deux pommes. Il veut du fromage. Elle veut de l’eau. Nous voulons un grand panier. Vous voulez deux petits sacs.',['veux','veut','voulons','voulez'],{kind:'basket',detail:'food',label:'Je · tu · il · elle · nous · vous'},20),
 e('famille','La famille au marché','Je veux le sac rouge. Tu veux le sac bleu. Il veut le livre. Elle veut la boîte. Nous voulons les pommes. Vous voulez le pain.',['veux','veut','voulons','voulez'],{kind:'family',detail:'parents'},21),
 e('commande-groupe','La commande du groupe','Je veux cinq pommes. Tu veux deux pains. Il veut un fromage. Elle veut une bouteille d’eau. Nous voulons payer ensemble. Vous voulez prendre les deux paniers.',['veux','veut','voulons','voulez'],{kind:'person',detail:'offer',count:3},22)
);
zone.pages.push(page('vouloir-personnes','Les personnes : vouloir',['veux','veut','voulons','voulez'],['je','elle','nous','vous'].map((detail,i)=>({kind:'grammar',detail,label:['Je ___ du pain. Tu ___ de l’eau.','Il ___ du pain. Elle ___ de l’eau.','Nous ___ du pain.','Vous ___ du pain.'][i]})),'grammar'));
zone.puzzle.requiredPages=zone.pages.map(p=>p.id);


zoneLexicon.push({id:'vingt-et-un',lemma:'vingt et un',forms:['vingt et un'],zone:'marche'},{id:'soixante-et-onze',lemma:'soixante et onze',forms:['soixante et onze'],zone:'marche'},{id:'quatre-vingts',lemma:'quatre-vingts',forms:['quatre-vingts'],zone:'marche'},{id:'quatre-vingt-dix',lemma:'quatre-vingt-dix',forms:['quatre-vingt-dix'],zone:'marche'});
const grandsPrix=[
 {id:'vingt-et-un',form:'vingt et un',value:21,item:'La grande boîte',kind:'box',sum:'20 + 1 = 21',change:'30 − 9 = 21'},
 {id:'soixante-et-onze',form:'soixante et onze',value:71,item:'Le manteau',kind:'coat',sum:'50 + 20 + 1 = 71',change:'100 − 29 = 71'},
 {id:'quatre-vingts',form:'quatre-vingts',value:80,item:'Le grand panier',kind:'basket',sum:'4 × 20 = 80',change:'100 − 20 = 80'},
 {id:'quatre-vingt-dix',form:'quatre-vingt-dix',value:90,item:'La grande table',kind:'table',sum:'80 + 10 = 90',change:'100 − 10 = 90'},
 {id:'cent',form:'cent',value:100,item:'Le grand livre',kind:'book',sum:'50 + 50 = 100',change:'120 − 20 = 100'}
];
for(const [i,price] of grandsPrix.entries()){
 zone.evidence.push(
 e('prix-objet-'+price.id,'L’étiquette',`${price.item} coûte ${price.form} euros.`,[price.id],{kind:price.kind,label:price.value+' €'},23+i*3),
 e('prix-compte-'+price.id,'Le paiement',`Le client compte ${price.form} euros : ${price.sum}.`,[price.id],{kind:'price',label:price.sum+' €'},24+i*3),
 e('prix-monnaie-'+price.id,'La monnaie',`Voici ${price.form} euros. Le marchand compte la monnaie : ${price.change}.`,[price.id],{kind:'money',label:price.change+' €'},25+i*3)
 );
}
zone.pages.push(page('grands-nombres','Les grands prix',grandsPrix.map(p=>p.id),grandsPrix.map(p=>({kind:'price',count:p.value,label:p.value+' €'})),'grammar'));
zone.pages.find(p=>p.id==='marche-negation')!.distractors=['et'];
zone.puzzle.requiredPages=zone.pages.map(p=>p.id);

export default zone;
