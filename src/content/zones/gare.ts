import type { Evidence, JournalPage, Lexeme, Picture, Zone } from '../types';
const vocab: Record<string,string[]> = {
  gare:['gare'],train:['train','trains'],billet:['billet','billets'],quai:['quai','quais'],heure:['heure','heures'],minute:['minute','minutes'],matin:['matin'],soir:['soir'],midi:['midi'],demi:['demi','demie'],départ:['départ','départs'],arrivée:['arrivée','arrivées'],retard:['retard'],destination:['destination'],aller:['aller'],vais:['vais'],vas:['vas'],va:['va'],allons:['allons'],allez:['allez'],vont:['vont'],sur:['sur'],sous:['sous'],dans:['dans'],devant:['devant'],derrière:['derrière'],'à côté de':['à côté de'],gauche:['gauche'],droite:['droite'],tout_droit:['tout droit'],nord:['nord'],sud:['sud'],plan:['plan'],pont:['pont'],rue:['rue','rues'],place:['place'],attendre:['attendre','attends','attend','attendez'],partir:['partir','pars','part','partons','partez','partent'],arriver:['arriver','arrive','arrives','arrivons','arrivez','arrivent'],ici:['ici'],là:['là'],puis:['puis']
};
export const zoneLexicon: Lexeme[] = Object.entries(vocab).map(([id,forms])=>({id,lemma:['vais','vas','va','allons','allez','vont'].includes(id)?'aller':forms[0],forms,zone:'gare'}));
const evidence:Evidence[]=[];
function context(id:string,title:string,text:string,words:string[],picture:Picture,kind:Evidence['kind']='sign') { const n=evidence.length; evidence.push({id:'gare-'+id,title,text,words,picture,kind,position:[-7+(n%8)*2,-6+Math.floor(n/8)*1.2]}); }
function triple(id:string,word:string,kind:string,lines:[string,string,string],detail?:string) {
 const scenes:Record<string,Picture[]>={gare:[{kind:'station'},{kind:'person',detail:'aller'},{kind:'map'}],train:[{kind:'train'},{kind:'ticket'},{kind:'map',detail:'train'}],billet:[{kind:'ticket'},{kind:'person',detail:'billet'},{kind:'action',detail:'voir'}],quai:[{kind:'station',detail:'quai'},{kind:'train',detail:'quai'},{kind:'map',detail:'quai'}],midi:[{kind:'time',label:'12:00'},{kind:'train',detail:'midi',label:'12:00'},{kind:'table',detail:'midi'}],heure:[{kind:'clock',label:'60 min'},{kind:'train',detail:'heure',label:'08:00 → 09:00'},{kind:'time',label:'08:00'}],minute:[{kind:'clock',label:'60 s'},{kind:'train',detail:'minute',label:'08:05'},{kind:'time',label:'08:04 → 08:05'}]};
 lines.forEach((text,i)=>{let picture:Picture=scenes[word]?.[i]??{kind,detail}; if(kind==='position') picture={kind,detail:detail+':'+['key-box','bag-table','book-bench'][i]}; if(kind==='grammar') picture=[{kind:'action',detail:'aller:'+detail},{kind:'person',detail},{kind:'grammar',detail}][i]; if(kind==='direction') picture=[{kind:'direction',detail},{kind:'map',detail},{kind:'train',detail}][i];context(id+'-'+i,['Le quai','Le voyageur','Le plan'][i],text,[word],picture,(['object','person','note'] as const)[i]);});
}
triple('gare','gare','station',['La gare est ici. Le train arrive à la gare.','Je vais à la gare. Voici mon billet.','La gare : un train, deux quais, une horloge.']);
triple('train','train','train',['Le train arrive. Les voyageurs montent dans le train.','Je prends le train, pas le bus.','Le train va de la gare à la maison de Claire.']);
triple('billet','billet','ticket',['Un billet pour le train. Le billet coûte dix euros.','Voici mon billet. Je peux prendre le train.','Gardez votre billet. Le contrôleur regarde le billet.']);
triple('quai','quai','station',['Le train est devant le quai trois.','Mon train part du quai trois. Je reste sur le quai.','Le quai est à côté du train.']);
triple('sur','sur','position',['Le billet est sur la boîte.','Le sac est sur la table.','Le livre est sur le banc.'],'sur');
triple('sous','sous','position',['La clé est sous la boîte.','Le sac est sous la table.','Le livre est sous le banc.'],'sous');
triple('dans','dans','position',['Le billet est dans la boîte.','Le sac est dans le train.','La lettre est dans le livre.'],'dans');
triple('devant','devant','position',['La clé est devant la boîte.','Je suis devant le train. Je vois sa porte.','Le vélo est devant la maison.'],'devant');
triple('derriere','derrière','position',['La clé est derrière la boîte.','Le jardin est derrière la maison.','Le chat est derrière la porte.'],'derrière');
triple('cote','à côté de','position',['La clé est à côté de la boîte.','Le café est à côté de la gare.','Le sac est à côté de la chaise.'],'à côté de');
triple('gauche','gauche','direction',['La flèche va à gauche.','À gauche, le quai trois ; à droite, la sortie.','Pour aller chez Claire : à gauche, puis tout droit.'],'gauche');
triple('droite','droite','direction',['La flèche va à droite.','À droite, la sortie ; à gauche, le quai trois.','Pour aller au café : à droite, puis tout droit.'],'droite');
triple('droit','tout_droit','direction',['Allez tout droit. La flèche continue devant vous.','Pour la maison : tout droit, puis à gauche.','Le train continue tout droit sur la voie.'],'tout droit');
triple('midi','midi','time',['Il est midi. Le soleil est haut. L’horloge indique douze heures.','Le train de midi part à douze heures.','À midi, nous mangeons. À minuit, nous dormons.'],'12:00');
triple('heure','heure','clock',['Une heure : soixante minutes. Deux heures : cent vingt minutes.','Le train part à huit heures. Le trajet dure une heure.','Quelle heure est-il ? Il est huit heures.']);
triple('minute','minute','clock',['Une minute : soixante secondes.','Le train part à huit heures cinq. Il reste cinq minutes.','Il est huit heures quatre. Encore une minute, puis le train part.']);
triple('vais','vais','grammar',['Je vais à la gare. Tu restes ici.','Je vais au café avec mon billet.','Je vais chez Claire. Voici mon chemin.'],'je');
triple('vas','vas','grammar',['Tu vas à la gare. Moi, je reste ici.','Tu vas au café avec ton billet.','Tu vas chez Claire. Voici ton chemin.'],'tu');
triple('allons','allons','grammar',['Nous allons à la gare ensemble.','Nous allons au café, toi et moi.','Nous allons chez Claire avec la lettre.'],'nous');
triple('allez','allez','grammar',['Vous allez à la gare, madame.','Vous allez au café, monsieur.','Vous allez chez Claire. Voici votre chemin.'],'vous');
context('consigne','Le billet de Claire','Le train pour la maison de Claire part à midi, du quai trois. Prenez le billet dans la boîte. Mettez le sac sous le banc. Allez à gauche, puis tout droit. Attendez devant le train.',['train','gare','billet','quai','midi','dans','sous','gauche','tout_droit','devant','aller','va','vont'],{kind:'map',label:'12:00 · 3'},'note');
context('familles','Les voyageurs','Il va à la gare. Elle va à la gare aussi. Ils vont ensemble à la gare. Nous allons avec eux.',['va','vont','allons','aller'],{kind:'grammar',detail:'nous'},'person');
context('horaire','Départs','08:05 : le café. 12:00 : la maison de Claire. 18:30 : le marché. Le train pour la maison part à midi.',['départ','arrivée','matin','soir','midi','heure','minute','demi','retard','destination'],{kind:'time',label:'12:00'},'sign');
context('plan-ville','Le plan de la ville','Le plan montre le nord en haut et le sud en bas. La rue de la gare passe sur le pont. La place est là, devant la mairie. Pour aller chez Claire, il faut partir d’ici, puis arriver à la maison.',['plan','nord','sud','rue','pont','place','là','aller','partir','ici','puis','arriver'],{kind:'map',label:'N ↑ · S ↓'},'note');
context('horaires-details','Le panneau des horaires','Départ le matin à huit heures cinq ; arrivée à neuf heures. Départ le soir à six heures et demie. Ce train a dix minutes de retard. Sa destination est la maison de Claire. Il faut attendre sur le quai.',['départ','matin','arrivée','soir','demi','retard','destination','attendre'],{kind:'time',label:'18:30'},'sign');
context('destination-claire','Le voyage de Claire','Claire va à la maison. Elle va chez elle. Deux voyageurs vont au café. Ils veulent aller au café.',['va','vont','aller'],{kind:'house',detail:'voyage'},'person');
context('train-famille','Le départ en famille','Il va à la gare avec son fils. Ils vont prendre le train. Il faut aller sur le quai.',['va','vont','aller'],{kind:'train',detail:'famille'},'note');
const page=(id:string,title:string,kind:JournalPage['kind'],words:string[],pictures:Picture[]):JournalPage=>({id:'gare-'+id,title,zone:'gare',kind,words,slots:words.map((answer,i)=>({id:'gare-'+id+'-'+i,answer,picture:pictures[i]}))});
const pages:JournalPage[]=[
 page('voyage','Le voyage','vocabulary',['gare','train','billet','quai'],[{kind:'station'},{kind:'train'},{kind:'ticket'},{kind:'station',detail:'quai'}]),
 page('place','Les objets et la boîte','grammar',['sur','sous','dans'],['sur','sous','dans'].map(detail=>({kind:'position',detail}))),
 page('autour','Autour de la maison','grammar',['devant','derrière','à côté de'],['devant','derrière','à côté de'].map(detail=>({kind:'position',detail}))),
 page('chemin','Le chemin','vocabulary',['gauche','droite','tout_droit'],['gauche','droite','tout droit'].map(detail=>({kind:'direction',detail}))),
 page('aller','Qui va où ?','grammar',['vais','vas','allons','allez'],['je','tu','nous','vous'].map((detail,i)=>({kind:'grammar',detail,label:['Je ___ à la gare.','Tu ___ à la gare.','Nous ___ à la gare.','Vous ___ à la gare.'][i]}))),
 page('destinations','Les autres voyageurs','grammar',['va','vont','aller'],[{kind:'grammar',detail:'il',label:'Il ___ à la gare.'},{kind:'grammar',detail:'nous',label:'Ils ___ à la gare.'},{kind:'action',detail:'aller',label:'Il veut ___ à la gare.'}]),
 page('temps','Le temps du voyage','grammar',['midi','heure','minute'],[{kind:'time',label:'12:00'},{kind:'clock',detail:'heure',label:'60 min'},{kind:'clock',detail:'minute',label:'60 s'}])
];
const zone:Zone={id:'gare',title:'La gare',subtitle:'Le chemin de la lettre',color:'#677d82',accent:'#e2aa56',intro:'La lettre porte un nom : Claire. Le train traverse la rivière. Les mots indiquent le chemin.',evidence,pages,puzzle:{id:'gare-trajet',title:'Le train de Claire',instruction:'Préparez le voyage. Le billet de Claire indique le chemin. Choisissez tout, puis ouvrez la porte.',requiredPages:pages.map(p=>p.id),steps:[
 {id:'destination',prompt:'Où allez-vous ?',picture:{kind:'house'},choices:['À la maison de Claire.','Au marché.','À l’atelier.','Au café.'],answer:'À la maison de Claire.'},
 {id:'heure',prompt:'À quelle heure part le train ?',picture:{kind:'clock'},choices:['À huit heures cinq.','À midi.','À six heures et demie.','À une heure.'],answer:'À midi.'},
 {id:'quai',prompt:'Quel quai ?',picture:{kind:'station'},choices:['Le quai un.','Le quai deux.','Le quai trois.','Le quai quatre.'],answer:'Le quai trois.'},
 {id:'billet',prompt:'Où est le billet ?',picture:{kind:'ticket'},choices:['Sur la boîte.','Sous la boîte.','Dans la boîte.','Derrière la boîte.'],answer:'Dans la boîte.'},
 {id:'sac',prompt:'Où mettez-vous le sac ?',picture:{kind:'bag'},choices:['Sur le banc.','Sous le banc.','Devant la gare.','Dans le café.'],answer:'Sous le banc.'},
 {id:'direction',prompt:'Quel chemin prenez-vous ?',picture:{kind:'map'},choices:['À droite, puis à gauche.','Tout droit, puis à droite.','À gauche, puis tout droit.','À droite, puis tout droit.'],answer:'À gauche, puis tout droit.'},
 {id:'attendre',prompt:'Où attendez-vous ?',picture:{kind:'train'},choices:['Derrière le train.','Devant le train.','Dans le café.','Sous le banc.'],answer:'Devant le train.'}
],success:'Le train part. De l’autre côté de la rivière, une maison vous attend.'}};
export default zone;
