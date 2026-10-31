import type { Picture } from '../content/types';
const ink='#334b40',paper='#e6dcc3',red='#ad5540',blue='#52748c',yellow='#c5a04d',paul='#87999b',claire='#bd876e';
const group=(shape:string,x:number,y:number,scale=1)=>`<g transform="translate(${x} ${y}) scale(${scale})">${shape}</g>`;
const key=`<circle cx="-18" r="12" fill="${yellow}"/><circle cx="-18" r="4" fill="${paper}"/><path d="M-7-4H27V4H19V12H11V4H-7Z" fill="${yellow}"/>`;
const person=(color:string,female=false)=>`<circle cy="-33" r="12" fill="#c99b76"/><path d="M-12-36Q-5-54 11-39V-27" fill="#514031"/><path d="M-13-15Q0-21 13-15L${female?'23 22H-23':'16 20H-16'}Z" fill="${color}"/><path d="M-8 23V43M8 23V43M-14-10L-25 11M14-10L25 11" fill="none"/>`;
const arrow=(x1:number,y1:number,x2:number,y2:number)=>`<path d="M${x1} ${y1}L${x2} ${y2}M${x2-7*Math.sign(x2-x1)} ${y2-6}L${x2} ${y2}L${x2-7*Math.sign(x2-x1)} ${y2+6}" fill="none" stroke-width="4"/>`;
const book=(color:string)=>`<path d="M-22-16Q-10-22 0-15Q12-22 23-16V18Q11 12 0 19Q-11 12-22 18Z" fill="${color}"/><path d="M0-15V19" fill="none"/>`;
function article(kind:string,known:boolean):string {
 const item=(color:string)=>kind==='book'?book(color):kind==='key'?key.replaceAll(yellow,color):`<path d="M-20-10L0-20L20-10V15L0 24L-20 15Z" fill="${color}"/><path d="M-20-10L0 0L20-10M0 0V24" fill="none"/>`;
 const chosen=kind==='key'?blue:yellow;
 let out=`<path d="M13 89H227" fill="none" stroke-dasharray="3 5"/>`;
 // First frame: several possible members, and the one newly selected.
 for(let i=0;i<3;i++)out+=group(item([red,chosen,kind==='key'?'#54754b':blue][i]),34+i*37,40,.55);
 out+=group(person(paul),181,48,.52)+arrow(117,44,157,44);
 if(kind==='many')out+=`<ellipse cx="71" cy="42" rx="57" ry="27" fill="none"/>`;
 else out+=`<ellipse cx="71" cy="42" rx="21" ry="23" fill="none"/>`;
 // Second frame: either a new selected member is presented, or a new
 // requester refers back to the identical already-selected member.
 out+=group(person(paul),63,131,.64)+group(item(chosen),92,133,.55)+group(person(claire,true),185,131,.64);
 if(known){out+=`<ellipse cx="92" cy="133" rx="25" ry="26" fill="none" stroke="#82976b"/>`+arrow(151,113,116,113)+`<path d="M71 70Q92 81 92 103" fill="none" stroke-dasharray="3 4"/>`;}
 else out+=arrow(116,130,155,130);
 if(kind==='many')out+=group(item(red),85,151,.35)+group(item(blue),112,150,.35);
 return out;
}
/** These unlabelled vignettes repeat physical contrasts demonstrated in the room. */
export function atelierPictureSvg(p:Picture):string {
 let drawing='';
 if(p.detail?.startsWith('article-')){const [,state,kind]=p.detail.split('-');drawing=article(kind,state==='known');}
 switch(p.detail){
 case 'identity':
  drawing=group(key.replaceAll(yellow,red),48,45,.65)+`<circle cx="180" cy="45" r="15" fill="${red}"/><path d="M112 39H135M112 49H135"/>`+
   `<path d="M29 79H68V103H29Z" fill="${blue}"/><path d="M48 79V103"/><circle cx="180" cy="91" r="15" fill="${blue}"/><path d="M112 85H135M112 95H135"/>`+
   `<path d="M30 129L48 119L68 129V149H30Z" fill="${yellow}"/><circle cx="180" cy="137" r="15" fill="${yellow}"/><path d="M112 131H135M112 141H135"/>`;
  break;
 case 'possession': drawing=group(person(claire,true),112,86,1.08)+group(key,142,101,.7)+`<path d="M125 76Q153 76 154 97" fill="none" stroke-width="6"/>`;break;
 case 'take': drawing=group(person(paul),52,85,1)+`<path d="M144 115H215M153 115V147M205 115V147" fill="none" stroke-width="7"/>`+group(key,178,104,.75)+arrow(152,77,94,77);break;
 case 'give': drawing=group(person(paul),45,89,.95)+group(person(claire,true),191,89,.95)+group(key,113,76,.8)+arrow(90,119,149,119);break;
 case 'referent': drawing=group(person(paul),42,102,.7)+group(person(claire,true),177,91,1.05)+`<path d="M68 83L137 65M128 61L137 65L132 74" fill="none" stroke-width="5"/><ellipse cx="177" cy="93" rx="37" ry="66" fill="none" stroke="#82976b"/>`;break;
 case 'large': drawing=`<path d="M27 118H92V130H27ZM35 130V151M84 130V151" fill="${red}"/><path d="M115 83H221V101H115ZM128 101V150M207 101V150" fill="${red}"/><path d="M113 157H222M216 151L222 157L216 163" fill="none"/>`;break;
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" class="pictogram" role="img" aria-label="Illustration"><rect x="1" y="1" width="238" height="178" rx="12" fill="${paper}"/><g stroke="${ink}" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round">${drawing}</g></svg>`;
}
