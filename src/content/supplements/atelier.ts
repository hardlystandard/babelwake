import type { Evidence, JournalPage, Picture, Zone } from '../types';

type Lesson = { id:string; lines:[string,string,string]; title:string };
const lessons:Lesson[]=[
 {id:'je',title:'La voix',lines:['Je suis ici. Je montre ma clé.','Je bois de l’eau. La bulle vient de moi.','Je lis la lettre. C’est moi qui parle.']},
 {id:'il',title:'Paul',lines:['Il a une clé. Le gardien montre Paul.','Il boit un café. Claire montre Paul.','Il lit un livre. Nous regardons Paul.']},
 {id:'elle',title:'Claire',lines:['Elle a une clé. Le gardien montre Claire.','Elle boit un thé. Paul montre Claire.','Elle lit une lettre. Nous regardons Claire.']},
 {id:'nous',title:'Avec moi',lines:['Nous avons la clé. Je suis avec Claire.','Nous buvons ensemble. Je suis avec Paul.','Nous lisons la lettre ensemble. Claire est avec moi.']},
 {id:'ils',title:'Paul et Luc',lines:['Ils ont deux clés. Paul et Luc sont ensemble.','Ils boivent du café. Les deux hommes sont à la table.','Ils lisent une lettre. Paul est avec Luc.']},
 {id:'elles',title:'Claire et Anne',lines:['Elles ont deux clés. Claire et Anne sont ensemble.','Elles boivent du thé. Les deux femmes sont à la table.','Elles lisent une lettre. Claire est avec Anne.']},
 {id:'ici',title:'Sous mes pieds',lines:['Je suis ici. Regarde le point sous mes pieds.','La clé est ici, dans ma main. Je te la montre.','Le point sur le plan montre où nous sommes : ici.']},
 {id:'pour',title:'Le destinataire',lines:['Cette lettre est pour Claire. La flèche va vers Claire.','Ce livre est pour Paul. Je lui donne le livre.','Ce café est pour le client. Le serveur lui apporte le café.']},
 {id:'table',title:'Les quatre pieds',lines:['Le livre est sur la table. La table a quatre pieds.','Le café est sur la table. La chaise est à côté de la table.','Nous mangeons à la table. Les assiettes sont sur la table.']},
 {id:'chaise',title:'Une place',lines:['Je suis sur la chaise. Mes pieds touchent le sol.','La chaise est vide, à côté de la table.','Le livre est sur la chaise. Il ne reste pas de place pour s’asseoir.']},
 {id:'fenêtre',title:'Dehors',lines:['La fenêtre est fermée. Je vois le jardin à travers la fenêtre.','J’ouvre la fenêtre. L’air entre dans la maison.','La fenêtre est au-dessus de la table. La lumière entre par la fenêtre.']},
 {id:'crayon',title:'Une trace sur le papier',lines:['J’écris avec le crayon. Sa pointe touche le papier.','Le crayon est à côté du livre. Il laisse une ligne sur la page.','Je dessine la clé avec le crayon. Voici le dessin.']},
 {id:'blanc',title:'La craie',lines:['Ce pot est blanc. Il a la couleur du lait.','Le manteau est blanc. La chemise est blanche aussi.','La page est blanche. Le crayon laisse une ligne noire sur le blanc.']},
 {id:'noir',title:'L’encre',lines:['Ce pot est noir. Il a la couleur de l’encre.','Le manteau est noir. La chemise est noire aussi.','La ligne est noire sur la page blanche. Ce noir est très foncé.']},
 {id:'et',title:'Les deux choses',lines:['Un pain et un fromage. Le panier contient les deux.','Claire et Paul sont ici. Ils sont deux.','Je prends la clé et la lettre. J’ai les deux dans les mains.']},
 {id:'mais',title:'Une différence',lines:['La boîte est ouverte, mais la porte est fermée.','Paul a une tasse, mais Claire n’a pas de tasse.','Le panier est plein, mais le sac est vide.']},
 {id:'oui',title:'La main prend',lines:['Tu veux du pain ? Oui, je prends le pain.','Est-ce que la boîte est ouverte ? Oui. Regarde à l’intérieur.','Est-ce que tu as la clé ? Oui, voici la clé dans ma main.']},
 {id:'non',title:'La main refuse',lines:['Tu veux du pain ? Non, je ne prends pas le pain.','Est-ce que la boîte est ouverte ? Non. Elle est fermée.','Est-ce que tu as la clé ? Non. Mes mains sont vides.']},
 {id:'lettre',title:'D’une main à l’autre',lines:['Je lis la lettre. Elle commence par « Chère Claire ».','J’écris une lettre avec le crayon. Puis je plie la feuille.','Je mets la lettre dans l’enveloppe. Le facteur la porte à Claire.']}
];
const groups:{id:string;title:string;words:string[];labels?:string[]}[]=[
 {id:'voix',title:'Qui parle ?',words:['je','il','elle','nous'],labels:['___ ai la clé. C’est moi qui parle.','___ a la clé. Voici Paul.','___ a la clé. Voici Claire.','___ avons la clé, Claire et moi.']},
 {id:'groupes',title:'Les autres et nous',words:['ils','elles','ici','pour'],labels:['Paul et Luc : ___ ont la clé.','Claire et Anne : ___ ont la clé.','Je suis ___, sur ce point.','Cette lettre est ___ Claire.']},
 {id:'meubles',title:'Dans la pièce',words:['table','chaise','fenêtre','crayon']},
 {id:'liens',title:'Une couleur, un lien',words:['blanc','noir','et','mais'],labels:['La couleur du lait.','La couleur de l’encre.','Une clé ___ une lettre : les deux.','La boîte est ouverte, ___ la porte est fermée.']},
 {id:'reponses',title:'La question et la réponse',words:['oui','non','lettre'],labels:['Tu as la clé ? ___, la voici.','Tu as la clé ? ___, mes mains sont vides.','Chère Claire…']}
];
export function supplement(zone:Zone):Zone {
 const evidence:Evidence[]=lessons.flatMap((lesson,i)=>lesson.lines.map((text,j)=>({id:`s-atelier-e-${lesson.id}-${j}`,title:lesson.title,text,words:[lesson.id],picture:{kind:'concept',detail:`${lesson.id}:${j}`},position:[-7+((i*3+j)%8)*2,-6+Math.floor((i*3+j)/8)*1.2],kind:'object' as const})));
 evidence.push({id:'s-atelier-e-vert',title:'Un autre échantillon',text:'Le vert est la couleur de ce pot. Le pot vert est à côté du pot blanc.',words:['vert','blanc'],picture:{kind:'color',color:'vert'},position:[7,4],kind:'object'});
 const pages:JournalPage[]=groups.map(g=>({id:`s-atelier-p-${g.id}`,zone:'atelier',title:g.title,kind:g.id==='meubles'?'vocabulary':'grammar',words:g.words,slots:g.words.map((answer,i)=>({id:`s-atelier-${g.id}-${i}`,answer,picture:{kind:'concept',detail:`${answer}:0`,...(g.labels?.[i]?{label:g.labels[i]}:{})} as Picture}))}));
 return {...zone,evidence:[...zone.evidence,...evidence],pages:[...zone.pages,...pages],puzzle:{...zone.puzzle,requiredPages:[...zone.puzzle.requiredPages,...pages.map(p=>p.id)]}};
}
