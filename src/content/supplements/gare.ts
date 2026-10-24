import type { Evidence, JournalPage, Zone } from '../types';
const targets:Record<string,[string,string,string]>={
matin:['Le matin, le soleil se lève. Je mange du pain avant de prendre le train.','Il est huit heures du matin. Les voyageurs prennent leur premier café.','Le matin commence après la nuit. Les fenêtres s’éclairent et le marché ouvre.'],
soir:['Le soir, le soleil se couche. Je rentre à la maison après le travail.','Il est huit heures du soir. Nous mangeons, puis les enfants vont au lit.','Le soir vient avant la nuit. Les lumières du café sont allumées.'],
demi:['Un pain entier, deux personnes : chacun prend un demi-pain.','Une pomme entière, deux personnes : chacune prend une demi-pomme, la moitié de la pomme.','Le marchand coupe le fromage en deux parts égales. Un demi-fromage est la moitié du fromage entier.'],
départ:['Le départ du train est à huit heures. Le train quitte la gare.','Voici le départ du voyageur : il ferme sa porte et s’éloigne de sa maison.','Voici le départ de Luc. Il prend son sac, sort par la porte et commence son voyage.'],
arrivée:['L’arrivée du train est à neuf heures. Les voyageurs sont à destination.','Voici l’arrivée du voyageur : son voyage est fini, il ouvre la porte de la maison.','Voici l’arrivée de Luc. Il pose son sac près de la porte : son voyage est fini.'],
retard:['Le train devait partir à huit heures. Il part à huit heures quinze : quinze minutes de retard.','Le voyageur devait venir à midi. Il vient à midi trente : il a trente minutes de retard.','Le voyageur devait arriver à six heures. Il arrive à six heures quarante-cinq : quarante-cinq minutes de retard.'],
destination:['La destination du voyage est la maison de Claire. Le chemin finit devant sa porte.','Ce train a pour destination la gare du Nord. Il finit son voyage là-bas.','Notre destination est le café. Nous suivons le chemin jusqu’au café.'],
nord:['Sur le plan, le nord est en haut. La flèche N montre le nord.','La boussole montre le nord. Le voyageur marche dans cette direction.','La gare est au nord de la maison : au-dessus de la maison sur le plan.'],
sud:['Sur le plan, le sud est en bas. La flèche S montre le sud.','La boussole montre le nord ; le sud est dans la direction opposée.','Le jardin est au sud de la maison : au-dessous de la maison sur le plan.'],
plan:['Ce plan montre les rues, le pont et la place. Le point rouge indique la maison.','Le voyageur ouvre son plan. Il cherche le chemin de la gare sur le dessin.','Le plan est affiché à la gare. Les chemins du dessin relient les mêmes lieux que les rues.'],
pont:['Le pont passe au-dessus de la rivière. Les voyageurs traversent l’eau sans se mouiller.','Le train passe sur le pont. La rivière coule sous ses roues.','Pour rejoindre la maison sur l’autre rive, prenez le pont. Il relie les deux côtés de la rivière.'],
rue:['La rue passe entre les maisons. Les voitures roulent et les voyageurs marchent sur les côtés.','Voici la rue de la Gare. Des portes et des fenêtres se trouvent des deux côtés de la rue.','Le café est dans cette rue. Suivez le chemin entre les maisons jusqu’à sa porte.'],
place:['La place est un grand espace ouvert entre les maisons. Les rues arrivent sur la place.','Au milieu de la place, il y a une fontaine. Les voyageurs se rencontrent autour de la fontaine.','Le marché remplit la place. Ses tables sont dans le grand espace, pas dans une rue étroite.'],
partir:['Le train va partir. Il quitte la gare et commence son voyage.','Je veux partir de la maison. Je prends mon sac et je m’éloigne de la porte.','Luc peut partir. Il prend son sac et s’éloigne de la porte.'],
arriver:['Le train va arriver. Il finit son voyage et entre dans la gare.','Je veux arriver chez Claire avant midi. Au bout du chemin, j’ouvre sa porte.','Luc peut arriver chez Claire. Il pose son sac devant la porte et son voyage est fini.'],
là:['La maison est là, loin de moi. Je montre sa porte du doigt. Je suis ici, devant le plan.','Le billet est là, à côté du voyageur. Il n’est pas ici, dans ma main.','Le café est là, de l’autre côté de la rue. Je le montre ; mes pieds sont encore ici.']
};
const definitions:[string,string,string[],string[]][]=[
['moments','La journée et le voyage',['matin','soir','demi','retard'],['Huit heures du ___.','Huit heures du ___.','Un ___-pain.','Quinze minutes de ___.']],
['trajets','Le début et la fin',['départ','arrivée','destination','plan'],['Le ___ du train.','L’___ du train.','La ___ du voyage.','Le ___ de la ville.']],
['ville','Les chemins de la ville',['nord','sud','pont','rue'],['Vers le ___.','Vers le ___.','Le ___ sur la rivière.','La ___ entre les maisons.']],
['mouvements','Le voyageur en chemin',['place','partir','arriver','là'],['La ___ au milieu des maisons.','Il veut ___.','Il veut ___.','La maison est ___.']]
];
export function supplement(zone:Zone):Zone{
 const evidence:Evidence[]=Object.entries(targets).flatMap(([word,lines],n)=>lines.map((text,i)=>({id:`supplement-gare-${word}-${i}`,title:['Le voyage','Le voyageur','La ville'][i],text,words:[word],picture:{kind:'concept',detail:`${word}:${i}`},position:[-7+((n*3+i)%8)*2,-6+Math.floor((n*3+i)/8)*1.2] as [number,number],kind:(['object','person','note'] as const)[i]})));
 evidence.push({id:'supplement-gare-minute',title:'Une minute avant le départ',text:'Il est onze heures cinquante-neuf. Dans une minute, il sera midi et le train partira.',words:['minute'],picture:{kind:'time',label:'11:59'},position:[0,0],kind:'sign'});
 const pages:JournalPage[]=definitions.map(([id,title,words,labels])=>({id:`supplement-gare-${id}`,title,zone:'gare',kind:'vocabulary',words,slots:words.map((answer,i)=>({id:`supplement-gare-${id}-${i}`,answer,picture:{kind:'concept',detail:`${answer}:0`,label:labels[i]}}))}));
 return {...zone,evidence:[...zone.evidence,...evidence],pages:[...zone.pages,...pages],puzzle:{...zone.puzzle,requiredPages:[...zone.puzzle.requiredPages,...pages.map(p=>p.id)]}};
}
