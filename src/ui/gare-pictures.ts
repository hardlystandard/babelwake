import type { Picture } from '../content/types';

const ink='#334b40',paper='#e6dcc3',red='#ad5540',green='#6c876c',ochre='#bf9a50';
const group=(drawing:string,x:number,y:number,scale=1)=>`<g transform="translate(${x} ${y}) scale(${scale})">${drawing}</g>`;
const arrow=(x1:number,y1:number,x2:number,y2:number)=>{
 const angle=Math.atan2(y2-y1,x2-x1),l=7;
 return `<path d="M${x1} ${y1}L${x2} ${y2}M${x2-l*Math.cos(angle-.6)} ${y2-l*Math.sin(angle-.6)}L${x2} ${y2}L${x2-l*Math.cos(angle+.6)} ${y2-l*Math.sin(angle+.6)}" fill="none" stroke-width="3.5"/>`;
};
const person=(color=green,female=false)=>`<circle cy="-20" r="9" fill="#c99b76"/><path d="M-9-22Q0-37 10-21" fill="#514031"/><path d="M-10-7Q0-12 10-7L${female?'17 21H-17':'12 17H-12'}Z" fill="${color}"/><path d="M-6 20V36M6 20V36" fill="none"/>`;
const station=`<path d="M-22 20V-13L0-27L22-13V20Z" fill="${ochre}"/><path d="M-28-13L0-32L28-13" fill="none"/><path d="M-6 20V1H6V20M-18-7H-10V1H-18ZM10-7H18V1H10Z" fill="${paper}"/>`;
const train=`<rect x="-27" y="-13" width="54" height="32" rx="5" fill="${green}"/><path d="M-19-7H-3V3H-19ZM4-7H20V3H4Z" fill="#b7cabc"/><circle cx="-15" cy="22" r="5"/><circle cx="15" cy="22" r="5"/>`;
const bridge=`<path d="M-30 4H30V15H19Q0-7-19 15H-30Z" fill="${ochre}"/><path d="M-35 25Q-16 17 0 25Q18 32 35 25" fill="none" stroke="#6d99a3"/>`;
function go(personForm:string,variant:number):string{
 const destination=[station,train,bridge][variant%3],plural=['nous','vous','ils'].includes(personForm),speakerIncluded=['je','nous'].includes(personForm),addressee=['tu','vous'].includes(personForm);
 let result=`<path d="M14 146H225" fill="none" stroke-dasharray="3 5"/>`+group(destination,199,96,.85);
 if(plural){result+=group(person(green),72,92,.84)+group(person(red,true),104,92,.84);}
 else result+=group(person(green,personForm==='elle'),86,92,1);
 result+=arrow(plural?127:114,114,163,114);
 // The ring and speech-tail consistently locate the speaker; an outsider
 // addressing/mentioning travellers is separate from the people who travel.
 if(speakerIncluded){result+=`<ellipse cx="${plural?72:86}" cy="69" rx="17" ry="18" fill="none" stroke="${ochre}" stroke-width="4"/><path d="M17 29H102V50H66L53 62V50H17Z" fill="${paper}"/>`+arrow(35,40,72,57);}
 else {result+=group(person('#87999b'),28,105,.7)+`<ellipse cx="28" cy="90" rx="14" ry="14" fill="none" stroke="${ochre}" stroke-width="3.5"/>`;
  result+=`<path d="M17 24H103V47H69L54 60V47H17Z" fill="${paper}"/>`+arrow(48,37,addressee?84:109,62);
  // A conversation between speaker and addressee differs from narration
  // about a third person: a returning empty speech bubble marks the exchange.
  if(addressee)result+=`<path d="M107 35H145V53H119L110 62V53H107Z" fill="${paper}"/>`+arrow(110,53,65,75);
 }
 return result;
}
/** Unlabelled rail contrasts. Cardinal letters cannot give journal answers away. */
export function garePictureSvg(p:Picture):string{
 const [meaning,rawVariant]=p.detail?.split(':')??[],variant=Number(rawVariant)||0;
 let drawing='';
 if(meaning==='north'||meaning==='south'){
  const north=meaning==='north';
  drawing=`<circle cx="120" cy="90" r="62" fill="${paper}"/><path d="M120 31V149M61 90H179" stroke="#a7aa96" fill="none"/><path d="M120 20L112 35H128Z" fill="${ochre}"/>`;
  drawing+=north?`<path d="M120 39L104 94L120 83L136 94Z" fill="${red}"/><path d="M120 141L104 94L120 104L136 94Z" fill="#adb59c"/>`:`<path d="M120 141L104 86L120 97L136 86Z" fill="${red}"/><path d="M120 39L104 86L120 76L136 86Z" fill="#adb59c"/>`;
 }else if(meaning?.startsWith('go-'))drawing=go(meaning.slice(3),variant);
 else if(meaning==='hour'||meaning==='minute'){
  const clock=(x:number,hour:number,minute:number)=>{
   const a=hour*Math.PI/6+minute*Math.PI/360,b=minute*Math.PI/30;
   return `<circle cx="${x}" cy="83" r="35" fill="${paper}"/><path d="M${x} 83L${x+Math.sin(a)*18} ${83-Math.cos(a)*18}" stroke-width="4"/><path d="M${x} 83L${x+Math.sin(b)*27} ${83-Math.cos(b)*27}"/><circle cx="${x}" cy="83" r="3" fill="${ink}"/>`;
  };
  drawing=clock(61,11,0)+clock(179,meaning==='hour'?12:11,meaning==='hour'?0:1)+arrow(108,83,133,83);
  drawing+=meaning==='hour'?`<path d="M179 43A40 40 0 1 1 176 43" fill="none" stroke="${red}" stroke-width="4"/>`:`<path d="M179 43L183 43" stroke="${red}" stroke-width="5"/>`;
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" class="pictogram" role="img" aria-label="Illustration"><rect x="1" y="1" width="238" height="178" rx="12" fill="${paper}"/><g stroke="${ink}" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round">${drawing}</g></svg>`;
}
