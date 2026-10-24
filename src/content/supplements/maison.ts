import type { Evidence, JournalPage, Zone } from '../types';
const targets:Record<string,[string,string,string]>={
maison:['La maison de Claire a un toit, des fenêtres et une porte. Claire habite dans cette maison.','Nous rentrons à la maison. Notre lit, notre cuisine et nos souvenirs sont à l’intérieur.','Cette maison se trouve derrière le jardin. Une famille vit sous son toit.'],
salon:['Dans le salon, nous sommes assis dans les fauteuils. Nous parlons autour de la petite table.','Le salon a un canapé et deux fauteuils. Il n’a ni lit ni four : nous recevons nos amis ici.','Claire entre dans le salon. Sa famille regarde un livre ensemble sur le canapé.'],
famille:['Voici la famille de Claire : sa mère Anne, son père Paul et son frère Luc.','Cette photo montre toute la famille : les parents et leurs enfants.','Toute la famille se retrouve autour de la table. Les parents parlent avec leurs enfants.'],
sœur:['Claire est la sœur de Luc. Ils ont la même mère et le même père.','Sur cet arbre de famille, Claire est la sœur de Luc. Leurs noms sont sous les mêmes parents.','Luc montre sa sœur Claire sur la photo. Ils sont les deux enfants d’Anne et de Paul.'],
frère:['Luc est le frère de Claire. Ils ont la même mère et le même père.','Sur cet arbre de famille, Luc est le frère de Claire. Leurs noms sont sous les mêmes parents.','Claire montre son frère Luc sur la photo. Ils sont les deux enfants d’Anne et de Paul.'],
enfant:['Claire est une enfant sur cette photo. Son père et sa mère la tiennent par la main.','Cet enfant est le fils d’Anne et de Paul. Il est petit et ses parents sont grands.','Voici un enfant avec ses deux parents. L’enfant est le plus jeune des trois.'],
parent:['Anne est un parent de Claire : elle est sa mère. Paul est son autre parent : il est son père.','Cet enfant marche avec un parent. L’adulte tient la main de son fils.','Sur cet arbre de famille, chaque parent est au-dessus de son enfant. La mère et le père sont les deux parents.'],
ami:['Luc rencontre son ami. Ils aiment passer du temps ensemble ; ils ne sont pas de la même famille.','Voici un ami de Claire. Ils se retrouvent au café pour parler et rire ensemble.','Son ami vient l’aider à porter une boîte. Ils sont heureux de se revoir.'],
voisin:['Le voisin de Claire habite dans la maison juste à côté de la sienne. Leurs jardins se touchent.','Le voisin ouvre sa fenêtre. Claire lui parle depuis la fenêtre de la maison d’à côté.','Ce voisin habite à la porte juste à côté de Claire. Ils se saluent chaque matin devant leurs deux maisons.'],
ton:['Tu tiens ton livre. Le livre est à toi, pas à moi.','Ton manteau est sur ta chaise. Tu prends le manteau qui est à toi.','Ton sac est à côté de toi. Tu montres le sac qui t’appartient.'],
son:['Il tient son livre. Ce livre est à lui, pas à moi.','Elle prend son manteau. Ce manteau est à elle, pas à toi.','Claire montre le sac de Luc. Voici son sac : le sac est à Luc, pas à Claire.'],
notre:['Nous tenons notre livre, toi et moi. Le livre est à nous deux.','Nous ouvrons notre maison. Toi et moi, nous habitons ici ensemble.','Notre jardin est derrière notre maison. Nous le cultivons tous les deux.'],
votre:['Vous tenez votre livre, madame. Ce livre est à vous, pas à moi.','Vous prenez votre manteau, monsieur. Ce manteau est à vous.','Voici votre sac. Vous montrez le sac qui vous appartient.'],
leur:['Ils tiennent leur livre. Ce livre est à eux deux, pas à nous.','Elles ouvrent leur maison. Elles habitent toutes les deux dans cette maison.','Luc montre le jardin de ses parents. Voici leur jardin : le jardin est à eux, pas à Luc.'],
nouveau:['Claire ouvre un nouveau livre. Les pages sont propres et personne ne l’a encore lu.','Luc reçoit un nouveau manteau. Il porte encore son étiquette et n’a jamais été porté.','Le voisin entre dans son nouveau logement. La peinture vient de sécher et les meubles arrivent aujourd’hui.'],
vieux:['Ce vieux livre a des pages jaunies et déchirées. Claire le lit depuis de nombreuses années.','Le vieux manteau de Luc a des trous et des boutons manquants. Il l’a porté pendant des années.','Cette photo montre le vieux logement de Claire. Le toit et les murs sont usés par les années.'],
aider:['La boîte est trop lourde pour Claire seule. Luc vient aider Claire : ils la portent à deux.','Le père veut aider son enfant à marcher. Il lui tient la main pour qu’il ne tombe pas.','Je peux aider mon ami à trouver sa clé. Nous cherchons ensemble au lieu de le laisser chercher seul.'],
chercher:['Je veux chercher ma clé. Je regarde sous la table, dans la boîte et derrière la porte. Je ne l’ai pas encore trouvée.','Claire doit chercher la lettre. Elle ouvre chaque boîte et regarde ce qu’il y a dedans.','Luc va chercher la maison sur le plan. Il regarde les rues une par une et se demande où elle est.'],
chez:['Luc est chez Claire. Il est dans la maison où Claire habite.','Nous allons chez Claire. Notre chemin finit devant sa maison.','Claire est chez elle. Elle habite ici et ferme sa propre porte.']
};
const definitions:[string,string,string[],string[]][]=[
['foyer','La maison et ceux qui y vivent',['maison','salon','famille','chez'],['Une ___.','Le ___ avec le canapé.','Toute la ___.','Luc est ___ Claire.']],
['liens','Les liens de famille',['sœur','frère','enfant','parent'],['Claire est la ___ de Luc.','Luc est le ___ de Claire.','Claire est une ___.','Anne est un ___ de Claire.']],
['ensemble','Les gens autour de nous',['ami','voisin','aider','chercher'],['Un ___ au café.','Le ___ habite à côté.','Je peux ___ Claire.','Je veux ___ la clé.']],
['possessions','À toi et à nous',['ton','son','notre','votre'],['Tu as ___ livre.','Il a ___ livre.','Nous avons ___ livre.','Vous avez ___ livre.']],
['avant-apres','Les objets et leurs propriétaires',['leur','nouveau','vieux'],['Ils ont ___ livre.','Un ___ livre.','Un ___ livre.']]
];
export function supplement(zone:Zone):Zone{
 const evidence:Evidence[]=Object.entries(targets).flatMap(([word,lines],n)=>lines.map((text,i)=>({id:`supplement-maison-${word}-${i}`,title:['Chez Claire','Les souvenirs','La conversation'][i],text,words:[word],picture:{kind:'concept',detail:`${word}:${i}`},position:[-7+((n*3+i)%8)*2,-6+Math.floor((n*3+i)/8)*1.2] as [number,number],kind:(['object','note','person'] as const)[i]})));
 const pages:JournalPage[]=definitions.map(([id,title,words,labels])=>({id:`supplement-maison-${id}`,title,zone:'maison',kind:id==='possessions'?'grammar':'vocabulary',words,slots:words.map((answer,i)=>({id:`supplement-maison-${id}-${i}`,answer,picture:{kind:'concept',detail:`${answer}:0`,label:labels[i]}}))}));
 return {...zone,evidence:[...zone.evidence,...evidence],pages:[...zone.pages,...pages],puzzle:{...zone.puzzle,requiredPages:[...zone.puzzle.requiredPages,...pages.map(p=>p.id)]}};
}
