import type { Evidence, JournalPage, Picture, Zone } from '../types';
const evidence:Evidence[]=[];
const contexts=(id:string,title:string,lines:[string,string,string])=>lines.forEach((text,i)=>evidence.push({id:`s-marche-${id}-${i}`,title,text,words:[id],picture:{kind:'concept',detail:`${id}:${i}`},position:[0,0],kind:i===1?'person':i===2?'note':'object'}));
contexts('œuf','La coquille',[
 'Un œuf dans sa coquille. La poule a pondu cet œuf ; le marchand le pose dans la boîte.',
 'Le cuisinier casse un œuf. La coquille reste dans sa main, le blanc et le jaune tombent dans le bol.',
 'Un œuf cuit est dans l’assiette. La coquille est à côté de l’assiette.'
]);
contexts('lait','La bouteille blanche',[
 'Le lait vient de la vache. Le marchand remplit une bouteille de lait blanc.',
 'Le cuisinier verse du lait dans la tasse de café. Le café devient clair.',
 'L’enfant boit un verre de lait. La bouteille blanche est sur la table.'
]);
contexts('poisson','De l’eau à l’assiette',[
 'Un poisson nage dans l’eau. Il a une queue et des nageoires.',
 'Le marchand pose le poisson sur la glace. Le poisson est frais.',
 'Le poisson cuit est dans l’assiette. Il reste la tête, la queue et les arêtes.'
]);
contexts('fruit','Du verger au panier',[
 'La pomme est un fruit. Ce fruit pousse sur l’arbre.',
 'La poire est un fruit aussi. Ce fruit est dans le panier avec les pommes.',
 'Une pomme, une poire, une banane : chaque fruit est sur cet étal. Le pain est sur un autre étal.'
]);
contexts('légume','Le potager',[
 'La carotte est un légume. Ce légume pousse dans la terre.',
 'Le cuisinier coupe un légume : une carotte pour la soupe.',
 'Un légume vert et un légume orange sont dans le panier. Le marchand donne une carotte.'
]);
contexts('panier','La poignée tressée',[
 'Le panier a une grande poignée. Les pommes sont dans le panier tressé.',
 'Elle porte le panier par la poignée. Le panier contient du pain et du fromage.',
 'Le panier est vide maintenant. Les achats sont sur la table, la grande poignée reste levée.'
]);
contexts('sac','À emporter',[
 'Le sac est en tissu. Les deux petites anses sont au-dessus du sac.',
 'Le client porte un sac à chaque main. Le pain dépasse du sac rouge.',
 'Le sac est ouvert sur la table. La lettre sort du sac ; le panier est ailleurs.'
]);
contexts('marché','Les étals',[
 'Le marché est sur la place. Un étal de fruits, un étal de légumes et un étal de poisson attendent les clients.',
 'Au marché, le marchand donne le panier et le client donne les euros.',
 'Le marché ferme. Les toiles sont repliées, les derniers paniers quittent les étals.'
]);
contexts('euro','La pièce',[
 'Une pièce d’un euro. Le signe € est sur la pièce. Une bouteille d’eau coûte un euro.',
 'Le client donne un euro au marchand. Le marchand donne une pomme à un euro.',
 'Deux pièces de cinquante centimes font un euro : 0,50 € + 0,50 € = 1 €.'
]);
contexts('tout','Le panier complet',[
 'Le pain, les pommes et le fromage sont prêts. Je prends tout : rien ne reste sur la table.',
 'Elle donne tout au client : le sac, la boîte et la lettre. Ses mains sont vides maintenant.',
 'Le client paie tout : le pain et l’eau. Le marchand entoure les deux lignes sur l’addition.'
]);
contexts('payer','La monnaie passe',[
 'Je paie le pain : je donne deux euros au marchand. Le marchand me donne le pain.',
 'Je paie le poisson : les pièces passent de ma main à la main du marchand.',
 'Je paie le panier complet. La serveuse prend mes euros, puis me donne l’addition.'
]);
contexts('coûter','Les étiquettes',[
 'Le pain coûte deux euros. L’étiquette porte 2 € ; je donne deux euros pour le pain.',
 'Le poisson coûte six euros. Son étiquette porte 6 € ; le client prépare six pièces.',
 'Le panier coûte douze euros. L’étiquette porte 12 € ; les pommes coûtent trois euros.'
]);
contexts('cher','Le même objet, un autre prix',[
 'Ce pain est cher : dix euros. Le même pain, sur l’autre étal, coûte un euro.',
 'Ce fromage est cher : cinquante euros. Le même fromage coûte cinq euros chez l’autre marchand.',
 'Ce sac est cher : cent euros. Le même sac coûte dix euros au marché.'
]);
contexts('frais','La livraison du matin',[
 'Le poisson est frais : le pêcheur vient de le sortir de l’eau. Il est posé sur la glace.',
 'Le pain est frais : il sort du four. La vapeur monte encore au-dessus du pain.',
 'Le fromage est frais : il vient d’être préparé. Il reste au froid, à côté du lait.'
]);
contexts('bon','Le plaisir de manger',[
 'Ce pain est bon ! Le client sourit après avoir mangé un morceau de pain.',
 'Ce fromage est bon ! Elle goûte le fromage, sourit et en demande encore.',
 'Ce café est bon ! Le client boit, sourit et lève le pouce.'
]);
const numberData:[string,number][]=[['trois',3],['quatre',4],['six',6],['sept',7],['huit',8],['neuf',9],['onze',11],['douze',12],['treize',13],['quatorze',14],['quinze',15],['seize',16],['trente',30],['quarante',40],['cinquante',50],['soixante',60]];
for(const [id,value]of numberData){
 const noun=value<20?'pommes':'euros';
 const scenes:Picture[]=[{kind:'quantity',detail:value<20?'apple':'money',count:value,label:String(value)},{kind:'quantity',detail:value<20?'egg':'money-ten',count:value,label:String(value)},{kind:'quantity',detail:value<20?'money':'money-five',count:value,label:String(value)+' €'}];
 const lines=[`Le marchand compte ${id} ${noun}. Le panier porte le nombre ${value}.`,value<20?`Dans la boîte, il y a ${id} œufs. Les cases permettent de compter les ${id} œufs.`:`Le client compte ${id} euros en billets de dix euros : ${value/10} × 10 € = ${value} €.`,`Je paie ${id} euros. L’addition indique ${value} € ; je prépare exactement ${id} euros.`];
 lines.forEach((text,i)=>evidence.push({id:`s-marche-nombre-${id}-${i}`,title:i===0?'Le compte du marchand':i===1?'Le compte du client':'Le paiement exact',text,words:[id],picture:scenes[i],position:[0,0],kind:i===1?'person':'object'}));
}
function page(id:string,title:string,words:string[],pictures:Picture[],kind:JournalPage['kind']='vocabulary'):JournalPage{return{id:`s-marche-page-${id}`,title,zone:'marche',kind,words,slots:words.map((answer,i)=>({id:`s-marche-slot-${id}-${i}`,answer,picture:pictures[i]}))};}
const concept=(id:string):Picture=>({kind:'concept',detail:`${id}:0`});
const pages:JournalPage[]=[
 page('aliments','De la ferme à la table',['œuf','lait','poisson','fruit','légume'],['œuf','lait','poisson','fruit','légume'].map(concept)),
 page('courses','Tout emporter',['panier','sac','marché','euro','tout'],['panier','sac','marché','euro','tout'].map(concept)),
 page('vente','Le prix et le goût',['payer','coûter','cher','frais','bon'],['payer','coûter','cher','frais','bon'].map(concept),'grammar'),
 ...[0,4,8,12].map((start,i)=>page(`nombres-${i}`,['Les premières quantités','Les quantités grandissent','Après douze','Les dizaines'][i],numberData.slice(start,start+4).map(([id])=>id),numberData.slice(start,start+4).map(([,count])=>({kind:'quantity',detail:'money',count,label:String(count)})),'grammar'))
];
export function supplement(zone:Zone):Zone {const all=[...zone.pages,...pages];return{...zone,evidence:[...zone.evidence,...evidence],pages:all,puzzle:{...zone.puzzle,requiredPages:all.map(p=>p.id)}};}
