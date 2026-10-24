import type { Zone, Lexeme, Evidence, JournalPage, Picture } from '../types';
export const zoneLexicon: Lexeme[] = [
['clé',['clé','clés']],['porte',['porte','portes']],['livre',['livre','livres']],['boîte',['boîte','boîtes']],['rouge',['rouge','rouges']],['bleu',['bleu','bleue','bleus','bleues']],['jaune',['jaune','jaunes']],['vert',['vert','verte','verts','vertes']],['un',['un']],['une',['une']],['des',['des']],['le',['le',"l’"]],['la',['la']],['les',['les']],['être',['être','suis','es','est','sommes','êtes','sont']],['avoir',['avoir','ai','as','a','avons','avez','ont']],['ouvrir',['ouvrir','ouvre','ouvres','ouvrons','ouvrez','ouvrent','ouvert','ouverte','ouverts','ouvertes']],['fermer',['fermer','ferme','fermes','fermons','fermez','ferment','fermé','fermée','fermés','fermées']],['je',['je',"j’"]],['tu',['tu']],['il',['il']],['elle',['elle']],['nous',['nous']],['vous',['vous']],['ils',['ils']],['elles',['elles']],['table',['table','tables']],['chaise',['chaise','chaises']],['fenêtre',['fenêtre','fenêtres']],['crayon',['crayon','crayons']],['blanc',['blanc','blanche','blancs','blanches']],['noir',['noir','noire','noirs','noires']],['petit',['petit','petite','petits','petites']],['grand',['grand','grande','grands','grandes']],['ici',['ici']],['et',['et']],['avec',['avec']],['mais',['mais']],['oui',['oui']],['non',['non']],['pour',['pour']],['lettre',['lettre','lettres']]
].map(([id,forms])=>({id:id as string,lemma:id as string,forms:forms as string[],zone:'atelier'}));
const e=(id:string,title:string,text:string,words:string[],picture:Picture,n:number):Evidence=>({id:`atelier-e-${id}`,title,text,words,picture,position:[-7+(n%5)*3.5,-5+Math.floor(n/5)*3.3],kind:picture.kind==='person'?'person':picture.kind==='letter'?'note':'object'});
const page=(id:string,title:string,words:string[],pictures:Picture[],kind:'vocabulary'|'grammar'='vocabulary'):JournalPage=>({id:`atelier-${id}`,title,zone:'atelier',kind,words,slots:words.map((answer,i)=>({id:`${id}-${i}`,answer,picture:pictures[i]}))});
const zone:Zone={id:'atelier',title:"L’atelier",subtitle:'Tout commence par un signe.',color:'#dfb889',accent:'#a94732',intro:'Une lettre attend sur la table. La porte est fermée. Sur le mur : « Pour Claire ».',evidence:[
e('table','Sur la table','Le livre est ouvert. La clé est dans la boîte. La porte est fermée.',['livre','clé','boîte','porte','le','la','être','fermer'],{kind:'table',detail:'key-book-box',label:'①'},0),
e('serrure','La serrure','La clé ouvre la porte. Le livre montre une clé. Une boîte attend près de la porte.',['clé','porte','livre','boîte','ouvrir','le','une'],{kind:'door',detail:'key',label:'②'},1),
e('retour','La livraison','Elle a un livre. Nous avons une boîte. Vous avez la clé de la porte.',['livre','boîte','clé','porte','avoir','un','une','la','nous','vous','elle'],{kind:'person',detail:'delivery',label:'③'},2),
e('peinture','Les pots','Un pot rouge, un pot bleu, un pot jaune et un pot vert.',['rouge','bleu','jaune','vert','un'],{kind:'color',detail:'palette',label:'● ● ● ●'},3),
e('fanions','Les fanions','Le fanion rouge est à gauche du bleu. Le jaune est à gauche du vert.',['rouge','bleu','jaune','vert','le'],{kind:'color',detail:'bunting'},4),
e('carnet','Les échantillons','La page rouge, la page bleue, la page jaune, la page verte.',['rouge','bleu','jaune','vert','la'],{kind:'book',detail:'colors'},5),
e('nombre','L’étagère','Un livre. Une clé. Des boîtes. Le livre est bleu. La clé est jaune. Les boîtes sont rouges.',['un','une','des','le','la','les','livre','clé','boîte','bleu','jaune','rouge','être'],{kind:'quantity',detail:'shelf',count:3},6),
e('dessin','Le dessin','Un crayon, une chaise, des fenêtres. Les fenêtres sont ouvertes.',['un','une','des','les','ouvrir'],{kind:'quantity',detail:'workshop',count:3},7),
e('inventaire','L’inventaire','Des livres et des clés. Les livres sont ouverts. Les clés sont dans les boîtes.',['des','les','livre','clé','boîte','être','ouvrir'],{kind:'quantity',detail:'books-keys',count:3},8),
e('portrait','Le miroir','Je suis ici. Tu es ici. Il est ici. Elle est ici. Nous sommes ici. Vous êtes ici.',['être','je','tu','il','elle','nous','vous','ici'],{kind:'grammar',detail:'être',label:'Je • tu • il • elle • nous • vous'},9),
e('mains','Les mains','J’ai une clé. Tu as un livre. Il a une boîte. Elle a un crayon. Nous avons des clés. Vous avez des livres.',['avoir','clé','livre','boîte','une','des','je','tu','il','elle','nous','vous'],{kind:'action',detail:'avoir'},10),
e('gardien','Le gardien','Je suis le gardien. J’ai la clé. J’ouvre la porte. Je ferme la porte.',['être','avoir','ouvrir','fermer','clé','porte'],{kind:'action',detail:'ouvrir'},11),
e('fenetres','Les fenêtres','Je ferme la fenêtre. Tu ouvres la fenêtre. Nous ouvrons la porte. Vous fermez la boîte.',['ouvrir','fermer','porte','boîte'],{kind:'window',detail:'open-close'},12),
e('signal','Le signal','La boîte rouge est fermée. Ferme la boîte bleue. Ouvre la boîte rouge. Prends la clé jaune. Ouvre la porte verte.',['boîte','rouge','fermer','ouvrir','clé','jaune','porte','vert'],{kind:'box',color:'rouge',detail:'key',label:'1 → 2 → 3'},13),
e('plaque','La plaque','La clé bleue ouvre la petite boîte. La clé jaune ouvre la grande porte verte. Le livre reste sur la table.',['clé','bleu','ouvrir','boîte','jaune','porte','vert','livre','table','petit','grand'],{kind:'key',color:'jaune',detail:'door'},14),
e('outils','Les outils','Un crayon blanc et un crayon noir sont sur la table. Il a une petite chaise, mais elle a une grande chaise. Ils ouvrent les fenêtres. Elles ferment les boîtes. Oui, avec la clé ; non, sans la clé.',['crayon','blanc','noir','chaise','il','elle','ils','elles','mais','avec','oui','non'],{kind:'pencil',detail:'tools',label:'Les outils'},16),
e('lettre','Pour Claire','La lettre est dans la boîte rouge. Pour Claire : « Je suis au marché. J’ai un panier. »',['lettre','boîte','rouge','être','avoir'],{kind:'letter',detail:'claire',label:'Pour Claire'},15)
],pages:[
page('objets','Les choses',['clé','livre','boîte','porte'],[{kind:'key'},{kind:'book'},{kind:'box'},{kind:'door'}]),
page('couleurs','Les couleurs',['rouge','bleu','jaune','vert'],['rouge','bleu','jaune','vert'].map(color=>({kind:'color',color}))),
page('un-plusieurs','Une chose, plusieurs choses',['un','une','des'],[{kind:'book',label:'___ livre'},{kind:'key',label:'___ clé'},{kind:'quantity',detail:'box',count:3,label:'___ boîtes'}],'grammar'),
page('articles','Les choses connues',['le','la','les'],[{kind:'book',label:'___ livre est ouvert.'},{kind:'key',label:'___ clé est jaune.'},{kind:'quantity',detail:'box',count:3,label:'___ boîtes sont rouges.'}],'grammar'),
page('verbes','Les gestes',['être','avoir','ouvrir','fermer'],[{kind:'grammar',detail:'être',label:'Je suis ici. Nous sommes ici.'},{kind:'action',detail:'avoir',label:'J’ai une clé. Nous avons des clés.'},{kind:'action',detail:'ouvrir'},{kind:'action',detail:'fermer'}],'grammar')
],puzzle:{id:'atelier-sortie',title:'La porte verte',instruction:'Lis les traces de l’atelier. Prépare la lettre et ouvre la porte.',requiredPages:['atelier-objets','atelier-couleurs','atelier-un-plusieurs','atelier-articles','atelier-verbes'],steps:[
{id:'boite',prompt:'Ouvre la boîte rouge.',picture:{kind:'box',color:'rouge'},choices:['La boîte bleue','La porte verte','La boîte rouge','Le livre rouge'],answer:'La boîte rouge'},
{id:'lettre',prompt:'Pour Claire.',picture:{kind:'letter',label:'Pour Claire'},choices:['Le livre','La clé','La lettre','La boîte'],answer:'La lettre'},
{id:'cle',prompt:'Prends la clé de la grande porte.',picture:{kind:'key'},choices:['La clé bleue','La clé rouge','La clé verte','La clé jaune'],answer:'La clé jaune'},
{id:'reste',prompt:'Le livre reste sur la table.',picture:{kind:'table'},choices:['Le livre','La lettre','La clé jaune','La boîte'],answer:'Le livre'},
{id:'ouvre',prompt:'La porte est fermée.',picture:{kind:'door'},choices:['Je ferme la porte.','J’ai un livre.','J’ouvre la porte.','Je suis ici.'],answer:'J’ouvre la porte.'},
{id:'destination',prompt:'Claire a écrit : « Je suis au marché. »',picture:{kind:'letter'},choices:['L’atelier','Le marché','Le café','La gare'],answer:'Le marché'}
],success:'La porte s’ouvre. La lettre t’accompagne.'}};

// Conjugated forms remain individually discoverable; notes link through their lemma.
zoneLexicon.push(...['suis','es','est','sommes','êtes'].map(id=>({id,lemma:'être',forms:[id],zone:'atelier' as const})),...['ai','as','a','avons','avez'].map(id=>({id,lemma:'avoir',forms:[id],zone:'atelier' as const})));
zone.evidence.push(
 e('miroirs','Les six reflets','Je suis ici, devant le miroir. Tu es ici, à côté de moi. Il est ici et elle est ici. Nous sommes ici ensemble. Vous êtes ici avec nous. J’ai une clé. Tu as un livre. Il a un crayon. Elle a une boîte. Nous avons deux livres. Vous avez trois clés.',['suis','es','est','sommes','êtes','ai','as','a','avons','avez'],{kind:'grammar',detail:'nous',label:'Je · tu · il · elle · nous · vous'},17),
 e('equipes','Deux équipes','Je suis devant la porte. Tu es devant la table. Il est à la fenêtre ; elle est à la porte. Nous sommes deux. Vous êtes trois. J’ai le crayon noir. Tu as le crayon blanc. Il a une chaise. Elle a la clé. Nous avons les boîtes. Vous avez les livres.',['suis','es','est','sommes','êtes','ai','as','a','avons','avez'],{kind:'person',count:3,detail:'friends',label:'2 ↔ 3'},18),
 e('portraits-parles','Les portraits parlent','Je suis le gardien. Tu es mon ami. Il est le père. Elle est la mère. Nous sommes une famille. Vous êtes nos amis. J’ai une lettre. Tu as une photo. Il a un livre. Elle a une clé. Nous avons une maison. Vous avez des crayons.',['suis','es','est','sommes','êtes','ai','as','a','avons','avez'],{kind:'family',detail:'parents'},19)
);
zone.pages.push(
 page('etre-personnes','Les personnes : être',['suis','es','est','sommes','êtes'],['je','tu','il','nous','vous'].map((detail,i)=>({kind:'grammar',detail,label:['Je ___ ici.','Tu ___ ici.','Il ___ ici. Elle ___ ici.','Nous ___ ici.','Vous ___ ici.'][i]})),'grammar'),
 page('avoir-personnes','Les personnes : avoir',['ai','as','a','avons','avez'],['je','tu','il','nous','vous'].map((detail,i)=>({kind:'grammar',detail,label:['J’___ une clé.','Tu ___ une clé.','Il ___ une clé. Elle ___ une clé.','Nous ___ des clés.','Vous ___ des clés.'][i]})),'grammar')
);
zone.puzzle.requiredPages=zone.pages.map(p=>p.id);

export default zone;
