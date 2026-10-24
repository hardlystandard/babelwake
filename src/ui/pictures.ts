import type { Picture } from '../content/types';

const ink = '#24413c';
const cream = '#faf3df';
const ochre = '#dfa95d';
const teal = '#609b8b';
const coral = '#d0785f';
const esc = (value: string): string => value.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const colorValue = (value?: string): string => {
  const named: Record<string, string> = { rouge: '#cc5b4a', bleu: '#538eae', vert: '#639478', jaune: '#e2bd52', blanc: '#fffdf5', noir: '#263b36', rose: '#d99b9b', orange: '#d88943', gris: '#a7aaa3', marron: '#916d4c' };
  return named[value ?? ''] ?? (/^#[\da-f]{3,8}$/i.test(value ?? '') ? value! : teal);
};
const t = (content: string, x = 120, y = 155, size = 15): string => `<text x="${x}" y="${y}" text-anchor="middle" fill="${ink}" stroke="none" font-family="Georgia,serif" font-size="${size}">${esc(content)}</text>`;
const at = (shape: string, x = 0, y = 0, scale = 1): string => `<g transform="translate(${x} ${y}) scale(${scale})">${shape}</g>`;
const arrow = (x1: number, y1: number, x2: number, y2: number, color = ink): string => {
  const a = Math.atan2(y2-y1,x2-x1); const n = 8;
  return `<g stroke="${color}" fill="none"><path d="M${x1} ${y1}L${x2} ${y2}"/><path d="M${x2-n*Math.cos(a-0.6)} ${y2-n*Math.sin(a-0.6)}L${x2} ${y2}L${x2-n*Math.cos(a+0.6)} ${y2-n*Math.sin(a+0.6)}"/></g>`;
};
function human(x = 0, y = 0, scale = 1, female = false, coat = teal): string {
  return at(`<circle cx="0" cy="-29" r="11" fill="${cream}"/><path d="M-11-31Q-8-49 5-41Q17-35 10-28" fill="${ochre}"/><path d="M-13-13Q0-20 13-13L${female ? '20 22L-20 22Z' : '15 17L-15 17Z'}" fill="${coat}"/><path d="M-8 20L-9 39M8 20L9 39M-14-10L-24 9M14-10L24 9" fill="none"/>`,x,y,scale);
}
function object(kind: string, p: Picture = {kind}): string {
  const color = colorValue(p.color);
  if(p.color && ['box','key','door','table','chair'].includes(kind)) return object(kind,{...p,color:undefined}).replaceAll(`fill="${ochre}"`,`fill="${color}"`).replaceAll('fill="#a7714f"',`fill="${color}"`);
  switch(kind) {
    case 'ticket': return `<path d="M-55-31H55V-10Q39 0 55 10V31H-55V10Q-39 0-55-10Z" fill="${cream}"/><path d="M29-29V29" stroke-dasharray="3 5"/><g transform="translate(-12 0) scale(.37)">${object('train')}</g><path d="M37-15H44M37-5H44M37 5H44M37 15H44"/>`;
    case 'direction': {
      if(p.detail==='gauche') return `<path d="M50-16H-7V-40L-55 0L-7 40V16H50Z" fill="${teal}"/>`;
      if(p.detail==='droite') return `<path d="M-50-16H7V-40L55 0L7 40V16H-50Z" fill="${teal}"/>`;
      return `<path d="M-16 49V-7H-40L0-55L40-7H16V49Z" fill="${teal}"/>`;
    }
    case 'room': return p.detail==='cuisine' ? `<path d="M-56-38H55V45H-56Z" fill="${cream}"/><path d="M-56-3H55M4-3V45M-56 12H4M-12 3H-4M11 7V17" fill="none"/><ellipse cx="-27" cy="-12" rx="17" ry="6" fill="${ink}"/><path d="M20-32V-9H47V-32ZM28-32V-39Q38-48 42-37" fill="${teal}"/>` : `<path d="M-58 40V-25H-47V2H50V40M-48 4V-18H-18V4Z" fill="${cream}"/><path d="M-47 5H50V29H-47Z" fill="${teal}"/><path d="M-49 40V49M43 40V49M-58-31V-42"/><path d="M-68-42H-48L-52-57H-64Z" fill="${ochre}"/>`;
    case 'bottle': if(p.detail==='full-empty') {
      const clearBottle=(outline:string,full:boolean):string=>`<path d="M-10-48H10V-32L22-15V42Q0 51-22 42V-15L-10-32Z" fill="${cream}" stroke="${outline}" stroke-width="4"/>${full?'<path d="M-18-4Q-7-10 1-4Q10 2 18-4V39Q0 46-18 39Z" fill="#7fb6c7" stroke="none"/>':''}<path d="M-11-48H11V-40H-11Z" fill="${outline}" stroke="${outline}"/><path d="M-14-14V-4" fill="none" stroke="#d6e4dd"/>`;
      return at(clearBottle(colorValue('bleu'),true),-43,1,.72)+at(clearBottle(colorValue('rouge'),false),4,1,.72)+at(object('basket',{kind:'basket',detail:'empty'}),48,27,.37)+at(clearBottle(colorValue('vert'),true),48,-10,.48);
    } return `<path d="M-10-48H10V-32L22-15V42Q0 51-22 42V-15L-10-32Z" fill="${color}"/><path d="M-11-48H11V-42H-11Z" fill="${ochre}"/><path d="M-20-1H20V25H-20Z" fill="${cream}"/>`;
    case 'cup': return `<ellipse cx="0" cy="29" rx="40" ry="7" fill="${ochre}"/><path d="M22-19Q52-24 47-2Q45 13 25 11" fill="none"/><path d="M-29-22H29L24 23Q0 35-24 23Z" fill="${p.color ? color : cream}"/><ellipse cx="0" cy="-22" rx="29" ry="6" fill="${coral}"/>`;
    case 'coffee': if(p.detail==='service') return `<ellipse cx="0" cy="39" rx="61" ry="11" fill="${ochre}"/>`+at(object('coffee'),-24,12,.6)+at(object('milk'),28,4,.57); return object('cup',p)+`<path d="M-11-40Q-22-50-12-60M4-40Q-6-50 4-60" fill="none" opacity=".55"/>`;
    case 'tea': if(p.detail==='terrace') return at(object('table'),0,16,1)+at(object('tea'),-18,-15,.5)+`<path d="M39-54V39M12-24Q40-69 68-24Z" fill="${coral}"/>`; return object('cup',p)+`<path d="M17-20L25-2L35 1V18H22V2L25-2" fill="${ochre}"/><path d="M-10-41Q-22-52-11-61" fill="none"/>`;
    case 'plate': case 'assiette': return `<ellipse cy="8" rx="55" ry="28" fill="${cream}"/><ellipse cy="8" rx="42" ry="20" fill="none"/><path d="M-41 2Q-21-10-5-9" fill="none" stroke="#e0d7c2"/>`;
    case 'spoon': case 'cuillère': return `<g transform="rotate(25)"><ellipse cy="-30" rx="17" ry="24" fill="#c8d5ca"/><path d="M-5-7H5L8 46Q0 59-8 46Z" fill="#c8d5ca"/></g>`;
    case 'sugar': case 'sucre': return `<path d="M-43-11L-23-25L-3-11V12L-23 24L-43 12Z" fill="#fffef7"/><path d="M-43-11L-23 0L-3-11M-23 0V24" fill="none"/><path d="M-6 18L14 4L34 18V41L14 53L-6 41Z" fill="#fffef7"/><path d="M-6 18L14 29L34 18M14 29V53" fill="none"/><path d="M1-35L21-49L41-35V-12L21 0L1-12Z" fill="#fffef7"/><path d="M1-35L21-24L41-35M21-24V0" fill="none"/>`;
    case 'menu': return object('book',{kind:'book',detail:'menu'});
    case 'receipt': case 'addition': return `<path d="M-29-51H29V51L19 43L9 51L-1 43L-11 51L-21 43L-29 51Z" fill="${cream}"/><path d="M-20-33H19M-20-16H5M12-16H21M-20 1H5M12 1H21M-21 17H21" fill="none"/>`+t('8 €',6,35,18);
    case 'fruit': return at(object('apple'),-24,11,.62)+at(object('apple',{kind:'apple',color:'vert'}),22,10,.57)+`<path d="M-22-20Q11 13 43-25Q43 10 15 18Q-11 20-22-20Z" fill="#e5bd55"/>`;
    case 'vegetable': return `<g transform="rotate(26)"><path d="M-5-20Q21-38 29-16L7 45Z" fill="#d78c49"/><path d="M8-24Q-13-57-20-31M13-25Q20-60 29-42M16-23Q47-44 43-22" fill="none" stroke="${teal}" stroke-width="6"/><path d="M7-8L19-6M7 9L14 11" fill="none"/></g>`+at(`<circle r="25" fill="${teal}"/><path d="M-15-18Q4-1-8 20M13-16Q-7 0 14 17" fill="none"/>`,-29,15,.8);
    case 'glass': return `<path d="M-30-43H30L23 42H-23Z" fill="${cream}"/><path d="M-22-33L-18 15M-23 34H23" fill="none" stroke="#b8d6d2" stroke-width="4"/>`;
    case 'note': return `<path d="M-41-49H24L42-31V49H-41Z" fill="${cream}"/><path d="M24-49V-31H42M-28-17H27M-28-3H22M-28 11H27M-28 25H14" fill="none"/><circle cx="0" cy="-39" r="5" fill="${coral}"/>`;
    case 'water': return `<path d="M-28-39H28L22 40H-22Z" fill="${cream}"/><path d="M-24-8Q-12-16 0-8Q12 0 24-8L21 39H-21Z" fill="#8ebbc3"/><path d="M-34-54Q-44-37-34-33Q-23-37-34-54Z" fill="#8ebbc3"/>`;
    case 'milk': return `<path d="M-23-34L-10-50H17L30-34V44H-23Z" fill="${cream}"/><path d="M-23-34H30M17-50V-34M-23-20H30V20H-23Z" fill="#9bbbc3"/><path d="M-13-12L-8 13L0-4L9 13L16-12" fill="none"/>`;
    case 'key': return `<g transform="rotate(-32)"><circle cx="-21" cy="-13" r="20" fill="${ochre}"/><circle cx="-21" cy="-13" r="7" fill="${cream}"/><path d="M-3-9H44V1H34V11H23V1H-3Z" fill="${ochre}"/></g>`;
    case 'door': if(p.detail==='key') return at(object('door'),30,0,.9)+at(object('key'),-42,-11,.55)+arrow(-11,-4,18,-4); return `<path d="M-38 48V-49H38V48M-29 48V-40H28V48" fill="${ochre}"/><path d="M-28-39L12-48V44L-28 48Z" fill="#a7714f"/><circle cx="3" cy="7" r="3" fill="${cream}"/><path d="M-44 49H45"/>`;
    case 'window': if(p.detail==='open-close') return `<path d="M-55-40h44v81h-44Z" fill="#b2d3d0"/><path d="M-53-36l29-8v82l-29 8Z" fill="#a6c8c2"/><path d="M10-40h44v81H10ZM32-40V41M10 0H54" fill="#b2d3d0"/>`+arrow(-2,-56,-41,-56)+arrow(10,55,50,55); return `<rect x="-43" y="-46" width="86" height="89" rx="2" fill="#b2d3d0"/><path d="M-33 34V-36H33V34ZM0-36V34M-33 0H33" fill="none"/><path d="M-49 44H49"/><circle cx="19" cy="-22" r="8" fill="#e4be63" stroke="none"/>`;
    case 'table': if(p.detail==='cafe') return at(object('table'),0,14,1.05)+at(object('coffee'),-27,-17,.42)+at(object('tea'),26,-17,.42); if(p.detail==='lunch') return at(object('table'),0,17,1.05)+at(object('soup'),-19,-17,.48)+at(object('bread'),36,-19,.36); if(p.detail==='food') return at(object('table'),0,12,1)+at(object('bread'),-33,-22,.35)+at(object('apple'),0,-20,.33)+at(object('cheese'),27,-18,.33)+at(object('water'),49,-24,.26); if(p.detail==='key-book-box') {
      const closedDoor=`<rect x="-27" y="-45" width="54" height="91" fill="${ochre}"/><rect x="-19" y="-37" width="38" height="83" fill="#a7714f"/><circle cx="12" cy="7" r="3" fill="${cream}"/><path d="M-34 47H34"/>`;
      const openBox=`<path d="M-34-19L0-35L34-19L0-2Z" fill="#b38352"/><path d="M-34-19L-46-37L-12-53L0-35M0-35L15-51L49-35L34-19" fill="${ochre}"/><path d="M-34-19L0-2L34-19V23L0 41L-34 23Z" fill="${ochre}"/><path d="M-29-16L0-30L29-16L0-2Z" fill="${cream}"/>${at(object('key'),-1,-16,.43)}<path d="M-34-19L0-2L34-19V23L0 41L-34 23Z" fill="none"/><path d="M0-2V41" fill="none"/>`;
      return at(closedDoor,53,-18,.55)+at(object('table'),-7,17,.96)+at(object('book'),-39,-11,.34)+at(openBox,11,-13,.48);
    } return `<path d="M-52-10L-31-31H41L58-10Z" fill="${ochre}"/><path d="M-52-10V-1H58V-10M-44 0V45M48 0V45M-25-29V10M34-29V10" fill="none"/>`;
    case 'chair': return `<path d="M-26-45H23V0H-26ZM-29 0H29V10H-29Z" fill="${ochre}"/><path d="M-25 10V45M25 10V45M-15-37V-9M0-37V-9M15-37V-9" fill="none"/>`;
    case 'book': if(p.detail==='menu') return object('book')+at(object('cup'),-24,0,.32)+at(object('bread'),24,0,.32); if(p.detail==='colors') return ['rouge','bleu','jaune','vert'].map((color,i)=>`<path d="M${-56+i*29}-34h25v72h-25Z" fill="${colorValue(color)}"/><path d="M${-52+i*29}-27v57" fill="none" stroke="${cream}"/>`).join(''); return `<path d="M0-30Q-27-45-49-30V37Q-24 23 0 38Q25 23 49 37V-30Q27-45 0-30Z" fill="${cream}"/><path d="M0-29V37M-39-18L-12-17M-39-5L-12-4M-39 8L-12 9M13-17L39-18M13-4L39-5M13 9L39 8" fill="none"/>`;
    case 'box': if(p.detail==='open')return `<path d="M-35-13L0-31L35-13L0 5Z" fill="#a97b4f"/><path d="M-35-13L-49-32L-14-50L0-31M0-31L15-49L50-31L35-13" fill="${ochre}"/><path d="M-35-13L0 5L35-13V28L0 46L-35 28Z" fill="${ochre}"/><path d="M0 5V46" fill="none"/>`; return `<path d="M-43-24L0-45L45-24V30L0 51L-43 30Z" fill="${ochre}"/><path d="M-43-24L0-2L45-24M0-2V51M-21-35L23-13V6L10 12V-18" fill="none"/>`;
    case 'pencil': return `<g transform="rotate(36)"><path d="M-8-49H8V30L0 51L-8 30Z" fill="${ochre}"/><path d="M-8-36H8M-8 30H8M0-35V29" fill="none"/><path d="M-3 43L0 51L3 43Z" fill="${ink}"/></g>`;
    case 'bread': return `<g transform="rotate(-20)"><path d="M-52 3Q-50-24-25-27H33Q60-22 54 8Q52 30 25 30H-31Q-53 27-52 3Z" fill="${ochre}"/><path d="M-29-18L-17 2M-7-20L5 0M16-19L28 1" fill="none" stroke="#fff1cd" stroke-width="5"/></g>`;
    case 'apple': return `<path d="M0-25Q-28-49-42-21Q-54 3-31 32Q-18 47 0 38Q22 48 36 24Q58-12 33-30Q18-40 0-25Z" fill="${p.color ? color : coral}"/><path d="M0-25Q-8-42-1-51M0-34Q20-55 28-41Q19-26 0-34" fill="${teal}"/>`;
    case 'cheese': return `<path d="M-48 17L16-35L49-9V36L-48 45Z" fill="#edcd76"/><path d="M-48 17L49-9M16-35V1" fill="none"/><circle cx="18" cy="18" r="7" fill="${ochre}"/><circle cx="-18" cy="28" r="5" fill="${ochre}"/><path d="M40 2Q28 15 48 20" fill="${ochre}"/>`;
    case 'soup': return `<path d="M-49-11H49Q42 40 0 40Q-42 40-49-11Z" fill="${cream}"/><ellipse cx="0" cy="-11" rx="49" ry="12" fill="${coral}"/><path d="M17-15L46-46" fill="none"/><path d="M-22-32Q-34-43-21-55M1-32Q-11-43 2-55" fill="none" opacity=".5"/>`;
    case 'egg': return `<path d="M0-49Q31-26 32 9Q31 44 0 44Q-31 44-32 9Q-31-26 0-49Z" fill="${cream}"/>`;
    case 'fish': return `<path d="M-44 1Q-1-44 39-7L58-24V25L39 10Q-1 45-44 1Z" fill="#8ebbc3"/><circle cx="-25" cy="-1" r="3" fill="${ink}"/><path d="M2-18Q-10 0 2 21" fill="none"/>`;
    case 'money': if(p.detail==='timbre') return at(object('money'),-19,15,.65)+at(object('envelope',{kind:'envelope',detail:'timbre'}),40,-16,.56); return `<rect x="-51" y="-26" width="91" height="53" rx="4" fill="${teal}"/><circle cx="-5" cy="0" r="17" fill="${cream}"/>${t('€',-5,7,23)}<circle cx="37" cy="26" r="20" fill="${ochre}"/>${t('€',37,33,21)}`;
    case 'clock': if(p.label==='60 s' || p.detail==='minute'){let ticks='';for(let i=0;i<60;i++){const a=i*Math.PI/30;ticks+=`<path d="M${Math.sin(a)*42} ${-Math.cos(a)*42}L${Math.sin(a)*46} ${-Math.cos(a)*46}" stroke-width="${i%5===0?2:1}"/>`;}return `<circle r="49" fill="${cream}"/>${ticks}<path d="M0 0V-40" stroke="${coral}"/><circle r="3" fill="${coral}"/>`;} return clock(p.label ?? '10:00');
    case 'train': return `<rect x="-42" y="-45" width="84" height="78" rx="16" fill="${teal}"/><path d="M-32-28H32V2H-32Z" fill="#cce1d9"/><path d="M0-28V2M-22 35L-38 53M22 35L38 53M-30 45H30" fill="none"/><circle cx="-24" cy="19" r="5" fill="${ochre}"/><circle cx="24" cy="19" r="5" fill="${ochre}"/>`;
    case 'station': if(p.detail==='quai') return `<path d="M-58 25L12-30H56L-17 36Z" fill="${ochre}"/><path d="M-58 25V40L-17 51V36L56-20V-30M-58 16L6-35M-47 55L63-28" fill="none"/><path d="M2-55H40V-31H2ZM21-31V-4" fill="${cream}"/>${t('3',21,-36,19)}`; return `<path d="M-56 43V-22L0-49L56-22V43Z" fill="${cream}"/><path d="M-62-22L0-55L62-22M-18 43V8H18V43" fill="${ochre}"/><circle cx="0" cy="-19" r="15" fill="${cream}"/><path d="M0-30V-19L9-15" fill="none"/><path d="M-45 4H-31V21H-45ZM31 4H45V21H31Z" fill="${teal}"/>`;
    case 'house': return `<path d="M-44-7V46H44V-7L0-45Z" fill="${cream}"/><path d="M-57-4L0-55L57-4" fill="none" stroke="${coral}" stroke-width="8"/><path d="M-9 46V12H14V46" fill="${ochre}"/><path d="M-33-8H-13V12H-33ZM18-8H35V12H18Z" fill="${teal}"/>`;
    case 'envelope': {
      if(p.detail==='timbre') return at(object('envelope'),-29,19,.55)+`<path d="M8-50L15-54L22-50L29-54L36-50L43-54L50-50L57-54V-47L61-40L57-33L61-26L57-19L61-12L57-5L61 2H8L4-5L8-12L4-19L8-26L4-33L8-40L4-47Z" fill="${cream}"/><path d="M14-43H51V-6H14Z" fill="${coral}"/><path d="M19-14L29-31L37-21L44-34L49-14Z" fill="${ochre}"/>`+arrow(0,9,21,-5);
      const body=`<rect x="-56" y="-35" width="112" height="73" rx="4" fill="${cream}"/>`;
      if(p.detail==='adresse') return body+`<rect x="33" y="-27" width="15" height="18" fill="${coral}"/><rect x="-39" y="-4" width="80" height="33" rx="3" fill="#e7c989" stroke="${coral}"/>`+t('Claire',0,9,13)+t('3, rue de la Gare',0,22,10);
      if(p.detail==='sans-timbre') return body+`<path d="M31-29H50V-7H31Z" fill="none" stroke-dasharray="3 4"/><path d="M30-30L51-6M51-30L30-6" stroke="${coral}"/><path d="M-31 1H20M-31 13H13" fill="none"/>`;
      if(p.detail==='écrire') return object('envelope',{kind:'envelope',detail:'adresse'})+at(object('pencil'),38,26,.45);
      return body+`<path d="M-55-34L0 7L55-34M-55 37L-17-3M55 37L17-3" fill="none"/><rect x="32" y="-27" width="16" height="18" fill="${coral}" stroke="none"/>`;
    }
    case 'calendar': {
      const detail=p.detail??'aujourd’hui'; const target=detail==='hier'?14:detail==='demain'?16:15;
      if(p.count) return `<rect x="-38" y="-49" width="76" height="93" rx="4" fill="${cream}"/><path d="M-38-29H38V-45H-38Z" fill="${coral}"/><path d="M-22-57V-39M22-57V-39" fill="none"/>`+t(String(target),0,21,43)+`<path d="M-57 55H57" fill="none"/>`+arrow(target===14?-5:-46,55,target===16?53:target===14?-51:5,55);
      return [14,15,16].map((day,i)=>{const x=-72+i*49;return `<g transform="translate(${x} -40)"><rect x="0" y="0" width="44" height="80" rx="3" fill="${day===target?'#ecd192':cream}" stroke="${day===target?coral:ink}" stroke-width="${day===target?4:2}"/><path d="M0 18H44V2H0Z" fill="${coral}"/><path d="M10-7V8M33-7V8" fill="none"/>${t(String(day),22,54,25)}${day===15?'<path d="M13 69H31" stroke-width="4"/>':''}</g>`;}).join('')+arrow(-54,53,55,53)+`<circle cx="${target===14?-50:target===15?-1:48}" cy="53" r="5" fill="${coral}"/>`;
    }
    case 'letter': return `<g transform="rotate(-7)"><rect x="-51" y="-33" width="102" height="68" rx="4" fill="${cream}"/><path d="M-50-31L0 7L50-31M-50 34L-16 2M50 34L16 2" fill="none"/><rect x="27" y="-23" width="14" height="16" fill="${coral}" stroke="none"/></g>`;
    case 'map': return `<path d="M-55-39L-18-47L19-36L55-44V40L19 48L-18 36L-55 44Z" fill="${cream}"/><path d="M-18-47V36M19-36V48" fill="none" opacity=".3"/><path d="M-43 21L-24 7L-5 12L18-5L39-21" fill="none" stroke="${coral}" stroke-dasharray="4 5"/><circle cx="-43" cy="21" r="5" fill="${teal}"/><path d="M34-26L45-16M45-26L34-16"/>`;
    case 'garden': return at(object('flower'),-30,11,.7)+at(object('flower'),23,-3,.9)+`<path d="M-58 47Q-27 36 0 47Q33 37 57 47" fill="none"/>`;
    case 'tree': return `<path d="M-8-5H8V47H-8Z" fill="#a47a51"/><path d="M0-56Q-37-62-38-31Q-64-11-36 10Q-20 27 0 10Q26 29 42 5Q60-17 34-34Q34-59 0-56Z" fill="${teal}"/>`;
    case 'flower': return `<path d="M0-7V50M0 25Q-35 0-30 30Q-13 42 0 25M0 32Q31 3 31 30Q20 47 0 32" fill="${teal}"/><g fill="${p.color ? color : coral}"><ellipse cy="-36" rx="13" ry="19"/><ellipse cx="23" cy="-17" rx="19" ry="13"/><ellipse cx="-23" cy="-17" rx="19" ry="13"/><ellipse cx="-14" cy="4" rx="13" ry="18"/><ellipse cx="14" cy="4" rx="13" ry="18"/></g><circle cy="-17" r="12" fill="${ochre}"/>`;
    case 'basket': {
      const shell=`<path d="M-46-1H46L35 43H-35Z" fill="${ochre}"/><path d="M-38-1Q0-64 38-1M-26 7L-21 36M-9 7L-7 37M9 7L7 37M26 7L21 36M-40 15H40M-37 28H37" fill="none"/>`;
      if(p.detail==='empty') return shell;
      return (p.detail==='food'?at(object('bread'),-19,-13,.43)+at(object('cheese'),20,-6,.38):at(object('apple'),-18,-15,.42)+at(object('apple'),13,-19,.42)+at(object('apple'),29,-6,.35))+shell;
    }
    case 'bag': return `<path d="M-38-16H38L43 44H-43Z" fill="${ochre}"/><path d="M-20-15V-30Q0-56 20-30V-15" fill="none"/><path d="M-30 7H30V34H-30Z" fill="${cream}"/>`;
    case 'shirt': return `<path d="M-19-39L-49-20L-35 2L-22-7V44H22V-7L35 2L49-20L19-39Q0-24-19-39Z" fill="${color}"/>`;
    case 'coat': return `<path d="M-16-45L-42-26L-52 18L-34 24L-25-5L-29 46H29L25-5L34 24L52 18L42-26L16-45L0-24Z" fill="${color}"/><path d="M-16-45L0-24L-12-10L-23-35M16-45L0-24L12-10L23-35M0-23V45" fill="none"/><circle cx="8" cy="7" r="2"/><circle cx="8" cy="23" r="2"/>`;
    case 'cat': return `<path d="M-25-16L-30-45L-8-31Q5-36 17-28L33-44L31-12Q45 9 27 28Q9 40-16 27Q-37 7-25-16Z" fill="${ochre}"/><path d="M-15 28Q-35 54-49 37Q-61 22-46 14" fill="none"/><path d="M-19-1H-15M13-1H17M-2 8L2 8L0 11Z"/><path d="M-13 11L-36 6M-13 16L-36 19M12 11L36 6M12 16L36 19" fill="none"/>`;
    case 'dog': return `<path d="M-25-24Q0-42 25-24L31 5Q27 27 0 27Q-27 27-31 5Z" fill="${ochre}"/><path d="M-22-24Q-48-30-43-5Q-38 16-25-1M22-24Q48-30 43-5Q38 16 25-1" fill="#a97b50"/><circle cx="-12" cy="-5" r="3"/><circle cx="12" cy="-5" r="3"/><path d="M-5 4H5L0 11ZM0 12V18M-17 29V44H18V29" fill="${coral}"/>`;
    case 'person': {
      if(p.detail==='greeting') return human(0,8,.94)+`<path d="M20 12L35-21L29-34M35-21L42-32M45-38L50-44M53-24L61-26" fill="none"/>`;
      if(p.detail==='thanks') return human(-29,11,.8,true,coral)+human(35,4,.9)+`<path d="M-13-48Q-3-61 5-50Q17-61 24-48Q24-37 5-26Q-13-37-13-48Z" fill="${coral}" stroke="none"/>`;
      if(p.detail==='friends') return human(-29,9,.86)+human(29,9,.86,true,coral)+`<path d="M-18-44Q0-57 18-44M-17-43L-11-36M17-43L11-36" fill="none"/>`;
      if(p.detail==='server') return human(7,8,.97,false,'#d8d6c7')+`<path d="M0-4L7 4L14-4L8 19Z" fill="${ink}"/><path d="M-14 7L-40-4M-59-4H-23" fill="none"/>`+at(object('cup'),-42,-16,.34);
      if(p.detail==='cafe') return human(-29,5,.85)+at(object('table'),18,28,.74)+at(object('coffee'),34,-1,.4);
      if(p.detail==='offer') return human(-29,7,.83)+at(object('soup'),32,17,.54)+arrow(-8,-3,20,-3);
      if(p.detail==='dinner') return human(0,-6,.83)+at(object('soup'),0,29,.6)+`<path d="M-47 12V46M-53 12V24H-41V12M43 12V46M43 12Q56 22 43 30" fill="none"/>`;
      if(p.detail==='giving') return action('donner');
      if(p.detail==='delivery') return human(-39,3,.8,true,coral)+human(35,3,.8)+at(object('book'),-41,17,.33)+at(object('box'),9,20,.36)+at(object('key'),46,-7,.25);
      if(['grand','grande','petit','petite'].includes(p.detail??'')) {const small=p.detail?.startsWith('petit');return human(-31,small?28:6,small?.5:1,p.detail?.endsWith('e'),coral)+`<path d="M29-37V46M23-37H35M23 46H35" stroke-dasharray="3 3" fill="none"/>`+human(35,12,.8,false,'#d4d5c9');}
      return human(0,0,1,p.detail === 'female' || p.detail === 'elle');
    }
    case 'portrait': return `<rect x="-46" y="-53" width="92" height="107" rx="3" fill="${ochre}"/><rect x="-37" y="-44" width="74" height="89" fill="${cream}"/>${human(0,6,.78,p.detail==='female' || p.detail==='mère')}`;
    case 'family': {
      const role=p.detail ?? ''; const who=['père','mère','fils','fille'].includes(role) ? role : '';
      return human(-40,-2,.82,false,who==='père'?coral:teal)+human(40,-2,.82,true,who==='mère'?coral:teal)+human(-18,29,.5,false,who==='fils'?coral:ochre)+human(20,29,.5,true,who==='fille'?coral:ochre)+`<path d="M-37 37V47H38V37M0 47V57M-18 57H20" fill="none"/>`+(who?`<circle cx="${who==='père'?-40:who==='mère'?40:who==='fils'?-18:20}" cy="${who==='père'||who==='mère'?-28:13}" r="${who==='père'||who==='mère'?15:10}" fill="none" stroke="${coral}" stroke-width="3"/>`:'');
    }
    default: return `<path d="M-35-34H35V36H-35Z" fill="${cream}"/><path d="M-25 24L-5-1L9 12L22-13L30 24Z" fill="${teal}"/><circle cx="-16" cy="-17" r="8" fill="${ochre}"/>`;
  }
}
function clock(label: string): string {
  const match = /^(\d{1,2})[:h](\d{2})$/.exec(label);
  const h = match ? Number(match[1]) : 10; const m = match ? Number(match[2]) : 0;
  let face = '<circle r="48" fill="'+cream+'"/>';
  for(let n=0;n<12;n++){const a=n*Math.PI/6;face+=`<path d="M${Math.sin(a)*40} ${-Math.cos(a)*40}L${Math.sin(a)*44} ${-Math.cos(a)*44}"/>`;}
  const min=m*Math.PI/30;const hr=(h%12+m/60)*Math.PI/6;
  face+=`<path d="M0 0L${Math.sin(hr)*25} ${-Math.cos(hr)*25}" stroke-width="5"/><path d="M0 0L${Math.sin(min)*36} ${-Math.cos(min)*36}"/><circle r="3" fill="${ink}"/>`;
  return face;
}
function position(detail: string): string {
  const [relation,scene] = detail.split(':');
  if(scene) {
    const [a,b]=scene.split('-'); const base=at(object(b==='bench'?'chair':b),0,13,.9); const dot=at(object(a),0,0,.32);
    if(relation==='sur') return base+at(dot,0,-30);
    if(relation==='sous') return at(base,0,-15)+at(dot,0,45);
    if(relation==='dans') return base+at(dot,0,-5);
    if(relation==='devant') return base+at(dot,0,35);
    if(relation==='derrière') return at(dot,0,-29)+base;
    return at(base,-22,0)+at(dot,60,26);
  }
  const block = '<path d="M-31-23H31V31H-31Z" fill="'+ochre+'"/><path d="M-31-23L-18-34H43L31-23M31 31L43 19V-34" fill="none"/>';
  const dot = `<circle r="11" fill="${coral}"/>`;
  switch(detail){
    case 'sur': return block+at(dot,0,-46);
    case 'sous': return at(block,0,-13)+`<path d="M-31 18V49M31 18V49"/>`+at(dot,0,42);
    case 'dans': return '<path d="M-35-24L0-39L37-24V31L0 46L-35 31Z" fill="'+ochre+'"/>'+at(dot,0,-19)+'<path d="M-35-24L0-7L37-24M0-7V46" fill="none"/>';
    case 'devant': return block+at(dot,0,32);
    case 'derrière': return at(dot,0,-24)+block;
    default: return at(block,-20,0)+at(dot,59,20);
  }
}
function action(detail: string): string {
  if(detail.startsWith('perdre:')) {
    const lost=detail.split(':')[1];
    return human(-39,12,.85)+`<path d="M-6-49H63V8H32L17 24V8H-6Z" fill="${cream}" stroke-dasharray="4 4"/>`+at(object(lost),29,-21,.43)+`<path d="M-8 32H29V54H-8Z" fill="none" stroke-dasharray="3 4"/>`+t('?',11,49,18);
  }
  if(detail.startsWith('ouvrir:')) return at(object(detail.split(':')[1]),21,5,.87)+arrow(-58,-10,-20,-34)+`<path d="M-19-24L25-51L59-29" fill="${cream}"/>`;
  if(detail.startsWith('fermer:')) return at(object(detail.split(':')[1]),21,5,.87)+arrow(-58,-37,-17,-9);
  if(detail.startsWith('donner:')) return human(-43,10,.8)+human(43,10,.8,true,coral)+at(object(detail.split(':')[1]),0,-3,.38)+arrow(-14,29,15,29);
  if(detail.startsWith('pouvoir:')) {
    const pronoun=detail.split(':')[1]; const people=pronoun==='nous'?human(-50,15,.57)+human(-24,15,.57,true,coral):human(-35,9,.83,pronoun==='elle'||pronoun==='vous',pronoun==='vous'?ochre:teal);
    return people+at(object('key'),1,-16,.33)+at(object('door'),47,12,.6)+arrow(0,29,25,29);
  }
  switch(detail){
    case 'être': return human(-15,8,.9)+at(object('house'),52,11,.45)+`<path d="M-48 51H72" stroke-dasharray="4 4"/>`;
    case 'avoir': return human(-16,8,.95)+at(object('key'),24,17,.38)+`<path d="M-6 7Q16 22 30 10" fill="none"/>`;
    case 'aller': case 'partir': return human(-40,7,.9)+at(object('house'),48,10,.55)+arrow(-13,0,26,0);
    case 'venir': return human(43,7,.9)+at(object('house'),-42,10,.55)+arrow(15,0,-22,0);
    case 'vouloir': return human(-26,13,.9)+`<path d="M0-53H57V-4H25L9 10V-4H0Z" fill="${cream}"/>`+at(object('bread'),29,-28,.36);
    case 'pouvoir': return human(-34,7,.9)+at(object('key'),9,-15,.35)+at(object('door'),48,9,.63)+arrow(6,28,27,28);
    case 'ouvrir': return at(object('door'),14,4,.9)+arrow(-58,1,-19,1);
    case 'fermer': return `<rect x="-23" y="-42" width="58" height="87" fill="${ochre}"/><circle cx="24" cy="4" r="3"/>`+arrow(-58,1,-29,1);
    case 'voir': return `<path d="M-59-13Q-32-48-5-13Q-32 17-59-13Z" fill="${cream}"/><circle cx="-32" cy="-13" r="8" fill="${teal}"/>`+at(object('letter'),34,16,.6)+arrow(-3,-11,21,-11);
    case 'trouver': return human(-39,8,.78)+at(object('key'),35,19,.56)+`<path d="M37-29V-40M51-20L59-27M22-25L16-34" fill="none" stroke="${ochre}" stroke-width="4"/>`;
    case 'perdre': return human(-32,9,.86)+`<ellipse cx="38" cy="18" rx="24" ry="31" fill="none" stroke-dasharray="3 6"/>`+t('?',39,29,30);
    case 'lire': return human(0,-5,.9)+at(object('book'),0,17,.6);
    case 'écrire': return human(-25,-5,.85)+at(object('letter'),15,27,.6)+at(object('pencil'),34,4,.54);
    case 'acheter': return human(-42,8,.8)+human(43,8,.8,false,ochre)+at(object('bread'),1,-16,.38)+at(object('money'),-1,21,.34)+arrow(-12,0,14,0);
    case 'donner': return human(-42,10,.8)+human(43,10,.8,true,coral)+at(object('letter'),0,0,.38)+arrow(-14,28,15,28);
    case 'prendre': return human(32,10,.8)+at(object('key'),-31,13,.6)+arrow(-4,-6,19,-6);
    case 'manger': return human(0,4,.95)+at(object('bread'),25,-7,.45);
    case 'boire': return human(0,4,.95)+at(object('cup'),24,-11,.47);
    default: return human(-25,10,.9)+at(object(detail),35,15,.6);
  }
}
function grammar(detail: string): string {
  switch(detail) {
    case 'masculine': return human(-35,5,.82)+at(object('book'),38,7,.58);
    case 'feminine': return human(-35,5,.82,true,coral)+at(object('bottle'),38,7,.58);
    case 'plural': return at(object('apple'),-44,2,.55)+at(object('apple'),0,2,.55)+at(object('apple'),44,2,.55);
    case 'negative': return at(object('apple'),0,8,.88)+`<circle cy="3" r="56" fill="none" stroke="${coral}" stroke-width="5"/><path d="M-39 42L39-36" stroke="${coral}" stroke-width="5"/>`;
    case 'affirmative': return at(object('cup'),-16,8,.8)+`<path d="M33-34L42-24L61-47" fill="none" stroke="${teal}" stroke-width="6"/>`;
    case 'je': return human(0,9,1)+arrow(-53,-34,-15,-21);
    case 'tu': return human(-44,9,.87)+human(44,9,.87,true,coral)+arrow(-17,-31,23,-25);
    case 'il': return human(0,9,1)+arrow(55,-35,16,-21);
    case 'elle': return human(0,9,1,true,coral)+arrow(55,-35,16,-21);
    case 'nous': return human(-23,9,.87)+human(24,9,.87,true,coral)+`<path d="M-52 49Q0 62 52 49" fill="none"/>`+arrow(-58,-40,-27,-24);
    case 'vous': return human(-40,9,.76)+human(5,9,.76,true,coral)+human(45,9,.76,false,ochre)+arrow(-60,-47,20,-35);
    case 'tu-polite': return human(-29,11,.95)+human(30,11,.95,true,coral)+`<path d="M-8-22Q0-37 8-22" fill="none"/>`;
    case 'vous-polite': return human(-34,12,.86)+human(35,12,.86,true,ochre)+`<path d="M-9-23L-1-33L8-23M-11-42H11V-26H-11Z" fill="${cream}"/>`;
    case 'please': return human(-33,13,.86)+human(36,13,.86,true,ochre)+`<path d="M-8-7L0 12L8-7M-4-11L0 8L4-11" fill="none"/><path d="M-10-45Q0-56 10-45" fill="none" stroke="${ochre}"/>`;
    case 'wish': return action('vouloir')+`<path d="M-57-31L-57-44M-64-37H-50" stroke="${ochre}"/>`;
    case 'yes-no': return at(object('apple'),-35,9,.52)+at(object('apple'),35,9,.52)+`<path d="M-57-32L-45-20L-24-44" fill="none" stroke="${teal}" stroke-width="5"/><path d="M23-43L47-20M47-43L23-20" stroke="${coral}" stroke-width="5"/>`;
    case 'je voudrais': return action('vouloir')+`<path d="M-63-28L-58-34L-52-28M-58-38V-46" fill="none" stroke="${ochre}"/>`;
    case 'où': return at(object('map'),-17,8,.8)+t('?',51,-24,36);
    case 'combien': return at(object('money'),-10,10,.85)+t('?',54,-23,36);
    case "qu'est-ce que": return `<rect x="-35" y="-32" width="70" height="64" rx="7" fill="${ochre}"/>`+t('?',0,17,44);
    case 'est-ce que': return human(-35,10,.9)+human(35,10,.9,true,coral)+t('?',0,-34,32);
    case 'inversion': return human(-35,10,.9)+human(35,10,.9,true,coral)+`<path d="M-23-44Q0-63 23-44M23-32Q0-13-23-32" fill="none"/>`+arrow(14,-48,25,-43)+arrow(-14,-28,-25,-33)+t('?',60,-30,24);
    case 'possession': return human(-38,8,.84)+at(object('book'),28,18,.55)+arrow(-12,-13,15,0);
    case 'past': return at(object('letter'),25,11,.75)+arrow(5,-42,-56,-42)+at(object('clock',{kind:'clock',label:'09:00'}),-47,15,.36);
    default: return action(detail);
  }
}

/** Crisp, self-contained SVG art: no remote assets, fonts, scripts, or raster text. */
export function pictureSvg(p: Picture): string {
  let drawing: string;
  switch(p.kind) {
    case 'color': if(p.detail==='palette') {drawing=['rouge','bleu','jaune','vert'].map((c,i)=>`<path d="M${-61+i*32}-17h27v42h-27Z" fill="${colorValue(c)}"/><ellipse cx="${-47.5+i*32}" cy="-17" rx="13.5" ry="4" fill="${colorValue(c)}"/>`).join('');break;} if(p.detail==='bunting') {drawing='<path d="M-70-30Q0-10 70-30" fill="none"/>'+['rouge','bleu','jaune','vert'].map((c,i)=>`<path d="M${-64+i*34}-28L${-38+i*34}-24L${-55+i*34}14Z" fill="${colorValue(c)}"/>`).join('');break;} drawing = `<path d="M-43-18Q-54-48-22-40Q-2-63 14-40Q49-49 39-15Q64 8 40 24Q43 55 11 39Q-15 62-29 37Q-64 42-43 14Q-61-3-43-18Z" fill="${colorValue(p.color)}"/><path d="M-22-23Q-30-11-24-1" fill="none" stroke="${cream}" stroke-width="7"/>`; break;
    case 'quantity': {
      if(p.detail==='market') {drawing=at(object('table'),0,14,1.1)+at(object('bread'),-45,-24,.36)+at(object('apple'),-14,-24,.32)+at(object('cheese'),21,-23,.34)+at(object('water'),49,-28,.25);break;}
      if(p.detail==='shelf') {drawing='<path d="M-65 40H65M-65-45V49M65-45V49" fill="none"/>'+at(object('book'),-46,13,.35)+at(object('key'),-10,12,.32)+[25,43,61].map(x=>at(object('box'),x,24,.2)).join('');break;}
      if(p.detail==='workshop') {drawing=at(object('pencil'),-46,0,.55)+at(object('chair'),0,5,.6)+at(object('window'),48,-8,.43);break;}
      if(p.detail==='books-keys') {drawing=at(object('book'),-38,-13,.43)+at(object('book'),-26,19,.43)+at(object('key'),23,-20,.4)+at(object('key'),43,17,.4);break;}
      if(p.detail==='money-ten'||p.detail==='money-five') {
        const denomination=p.detail==='money-ten'?10:5;const n=Math.floor((p.count??denomination)/denomination);const cols=n>6?4:3;const rows=Math.ceil(n/cols);drawing='';
        for(let i=0;i<n;i++)drawing+=at(`<rect x="-19" y="-13" width="38" height="26" rx="2" fill="${denomination===10?teal:'#b6b8a0'}"/>${t(String(denomination)+' €',0,4,11)}`,(i%cols-(Math.min(n,cols)-1)/2)*44,(Math.floor(i/cols)-(rows-1)/2)*31);
        break;
      }
      const count=Math.max(0,Math.min(p.count ?? 1,100)); const itemKind=p.detail??'apple';
      const unit=itemKind==='money'?`<circle r="28" fill="${ochre}"/>${t('€',0,10,29)}`:object(itemKind,p);
      drawing='';
      if(count===0) drawing=`<ellipse cy="12" rx="49" ry="25" fill="none" stroke-dasharray="5 5"/>`;
      else if(count>20 && count%10===0) {
        const groups=count/10;const cols=groups>5?5:3;const rows=Math.ceil(groups/cols);
        for(let g=0;g<groups;g++){
          const gx=(g%cols-(Math.min(groups,cols)-1)/2)*46;const gy=(Math.floor(g/cols)-(rows-1)/2)*52;
          if(itemKind==='money') drawing+=at(`<rect x="-20" y="-17" width="40" height="34" rx="3" fill="${teal}"/>${t('10 €',0,5,13)}`,gx,gy);
          else {drawing+=`<rect x="${gx-21}" y="${gy-23}" width="42" height="46" rx="5" fill="none" stroke="#d6cdb8"/>`;for(let j=0;j<10;j++)drawing+=at(unit,gx+(j%2-.5)*17,gy+(Math.floor(j/2)-2)*8,.075);}
        }
      } else {
        const cols=count>12?5:count>6?4:count>3?3:count; const rows=Math.ceil(count/cols); const scale=count>12?.18:count>6?.28:count>3?.37:count>1?.5:.9;
        for(let i=0;i<count;i++) drawing+=at(unit,(i%cols-(cols-1)/2)*(count>12?27:count>6?31:42),(Math.floor(i/cols)-(rows-1)/2)*(count>12?25:count>6?34:43),scale);
      }
      break;
    }
    case 'concept': {const [conceptName,v]= (p.detail??'').split(':'); drawing=concept(conceptName,Number(v)||0);break;}
    case 'scene': {const [item,setting]= (p.detail??'').split(':'); drawing=objectScene(item,setting);break;}
    case 'commerce': {const [meaning,v]=(p.detail??'').split(':');drawing=commerce(meaning,Number(v)||0);break;}
    case 'position': drawing=position(p.detail ?? 'sur'); break;
    case 'time': if(p.label?.includes('→')) {const clocks=p.label.split('→').map(x=>x.trim());drawing=at(clock(clocks[0]),-37,0,.62)+at(clock(clocks[1]),37,0,.62)+arrow(-10,-43,27,-43);}else drawing=clock(p.label ?? '10:00'); break;
    case 'price': drawing=at(object(p.detail ?? 'bread'),-15,-16,.75)+`<path d="M-2 26H58V57H-2L-13 41Z" fill="${cream}"/><circle cx="-3" cy="41" r="2"/>`+t(p.label ?? '3 €',28,48,18); break;
    case 'action': drawing=action(p.detail ?? 'avoir'); break;
    case 'grammar': drawing=grammar(p.detail ?? 'je'); break;
    default: drawing=object(p.kind,p);
  }
  const showLabel=p.label && p.kind!=='time' && p.kind!=='price' && (p.kind!=='clock' || !/^\d{1,2}[:h]\d{2}$/.test(p.label));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" role="img" aria-label="Illustration" class="pictogram"><rect x="1" y="1" width="238" height="178" rx="12" fill="${cream}"/><ellipse cx="120" cy="139" rx="67" ry="8" fill="#e7ddc7"/><g transform="translate(120 ${showLabel ? 78 : 86})" stroke="${ink}" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round">${drawing}</g>${showLabel ? labelSvg(p.label!) : ''}</svg>`;
}

function labelSvg(label: string): string {
  if(label.length <= 34) return t(label,120,163,label.length>27?12:14);
  const lines: string[]=[]; let line='';
  for(const word of label.split(' ')){if(line.length+word.length>36){lines.push(line);line=word;}else line+=(line?' ':'')+word;}
  if(line)lines.push(line);
  return lines.slice(0,2).map((part,index)=>t(part,120,lines.length>1?151+index*15:163,11)).join('');
}

const frenchObject: Record<string,string> = { table:'table',chaise:'chair',fenêtre:'window',crayon:'pencil',lettre:'letter',assiette:'plate',cuillère:'spoon',sucre:'sugar',menu:'menu',addition:'receipt',œuf:'egg',lait:'milk',poisson:'fish',fruit:'fruit',légume:'vegetable',panier:'basket',sac:'bag',maison:'house',livre:'book',clé:'key' };
function objectScene(item: string, setting: string): string {
  const shape=object(frenchObject[item]??item); let background='';
  if(setting==='market') background=`<path d="M-68-39H68V-24H-68ZM-61-24V48M61-24V48" fill="${cream}"/><path d="M-68-39H-46V-24H-68ZM-24-39H-2V-24H-24ZM20-39H42V-24H20Z" fill="${coral}"/><path d="M-68 35H68V48H-68Z" fill="${ochre}"/>`;
  else if(setting==='kitchen') background=`<path d="M-66-43H66V48H-66Z" fill="${cream}"/><path d="M-66 22H66M-66 31H-31V47H-66ZM41-42V-18M51-42V-18M61-42V-18" fill="none"/><path d="M-58-32H-29V-6H-58Z" fill="${teal}"/>`;
  else if(setting==='meal') background=at(object('table'),0,32,1.08)+at(object('plate'),0,14,.88);
  else if(setting==='shelf') background=`<path d="M-65 35H65M-65-45V47M65-45V47M-65-45H65" fill="none"/>`;
  else if(setting==='person') background=human(-40,10,.8,true,coral);
  else if(setting==='garden') background=at(object('tree'),-49,-4,.52)+`<path d="M-65 44Q0 33 65 44" fill="none"/>`;
  else background=at(object('table'),0,30,1.07);
  return background+at(shape,setting==='person'?25:0,setting==='meal'?-14:-5,setting==='market'?.66:.67);
}
function commerce(meaning: string, v: number): string {
  const item=['bread','fish','basket'][v%3];
  if(meaning==='marché') return objectScene(['fruit','vegetable','fish'][v%3],'market')+human(-49,15,.4,false,ochre);
  if(meaning==='payer') return human(-44,14,.75)+human(43,14,.75,true,coral)+at(object(item),28,21,.34)+at(object('money'),-3,-9,.34)+arrow(-14,15,17,15);
  if(meaning==='coûter') return at(object(item),-24,-5,.7)+at(object('price',{kind:'price'}),0,0,0)+`<path d="M15 9H64V43H15L3 26Z" fill="${cream}"/><circle cx="15" cy="26" r="2"/>`+t(['2 €','6 €','12 €'][v%3],40,34,18);
  if(meaning==='cher') return at(object(['bread','cheese','bag'][v]),-35,-8,.45)+at(object(['bread','cheese','bag'][v]),34,-8,.45)+t(['1 €','5 €','10 €'][v],-35,39,16)+t(['10 €','50 €','100 €'][v],34,39,16)+`<path d="M12 46H58" stroke="${coral}" stroke-width="4"/>`;
  if(meaning==='unused') return at(object(item),-35,-8,.45)+at(object(item),34,-8,.45)+t('5 €',-35,39,16)+t('50 €',34,39,16)+`<path d="M12 46H58" stroke="${coral}" stroke-width="4"/>`;
  if(meaning==='frais') return at(object(['fish','bread','cheese'][v%3]),0,-4,.75)+`<path d="M-57 37L-37 20L-19 40L0 24L22 43L43 22L61 39" fill="none" stroke="#8fb6c2"/><path d="M-50-38V-55M-59-47H-41M45-29V-46M36-37H54" fill="none" stroke="${teal}"/>`;
  if(meaning==='bon') return human(-30,10,.85)+at(object(['bread','cheese','coffee'][v]),31,4,.5)+`<path d="M-37-15Q-30-8-23-15M27-47Q33-56 39-47Q48-56 53-47Q53-38 40-29Q27-38 27-47Z" fill="${coral}"/>`;
  if(meaning==='euro') {
    if(v===0) return `<circle r="46" fill="${ochre}"/><circle r="37" fill="none"/>${t('€',0,17,52)}`;
    if(v===1) return `<rect x="-61" y="-34" width="122" height="68" rx="5" fill="${teal}"/><circle r="25" fill="${cream}"/>${t('10 €',0,8,23)}`;
    return at(object('money'),-16,0,.8)+at(`<circle r="24" fill="${ochre}"/>${t('€',0,9,25)}`,46,27,.7);
  }
  if(meaning==='tout') return ['bread','apple','cheese'].map((k,i)=>at(object(v===1?['egg','milk','fish'][i]:v===2?['book','key','box'][i]:k),(i-1)*42,0,.4)).join('')+`<rect x="-68" y="-43" width="136" height="88" rx="14" fill="none" stroke="${coral}" stroke-width="4"/>`;
  return objectScene(item,['market','kitchen','meal'][v%3]);
}
function sky(night: boolean, x = 43, y = -35, scale=1): string {
  return at(night?`<path d="M0-20Q-24-3-2 19Q-29 19-27-6Q-23-26 0-20Z" fill="${ochre}"/><path d="M14-10V0M9-5H19"/>`:`<circle r="16" fill="${ochre}"/><path d="M0-26V-22M0 22V26M-26 0H-22M22 0H26M-18-18L-15-15M18-18L15-15M-18 18L-15 15M18 18L15 15"/>`,x,y,scale);
}
function temperature(hot: boolean, strong=false): string {
  return `<path d="M-4-39Q-4-48 5-48Q14-48 14-39V24Q25 32 20 44Q14 55 3 51Q-13 45-10 33Q-9 27-4 23Z" fill="${cream}"/><path d="M5 ${hot?(strong?-37:-14):13}V36" fill="none" stroke="${hot?coral:'#6dacc2'}" stroke-width="7"/><circle cx="5" cy="37" r="10" fill="${hot?coral:'#6dacc2'}" stroke="none"/><path d="M20-31H29M20-15H29M20 1H29M20 17H29" fill="none"/>`;
}
function kinship(target: string, v:number): string {
  const isChild=['enfant','sœur','frère'].includes(target); const highlight=target==='sœur'?'Claire':target==='frère'?'Luc':'';
  let out=human(-35,-16,.58,true,target==='parent'?coral:teal)+human(35,-16,.58,false,target==='parent'?coral:teal)+human(-28,38,.48,true,isChild?coral:ochre)+human(28,38,.48,false,isChild?coral:ochre)+`<path d="M-35 9V18H35V9M0 18V27M-28 27H28M-28 27V33M28 27V33" fill="none"/>`;
  if(target==='famille')out+=`<rect x="-60" y="-48" width="120" height="116" rx="10" fill="none" stroke="${coral}" stroke-width="3"/>`;
  if(target==='enfant')out+=`<ellipse cy="43" rx="54" ry="27" fill="none" stroke="${coral}"/>`;
  if(target==='parent')out+=`<ellipse cy="-18" rx="60" ry="32" fill="none" stroke="${coral}"/>`;
  if(highlight)out+=`<circle cx="${highlight==='Claire'?-28:28}" cy="24" r="13" fill="none" stroke="${coral}" stroke-width="3"/>`+t('Claire',-29,75,10)+t('Luc',30,75,10);
  if(v===1)out=at(out,0,1,.88)+`<rect x="-68" y="-55" width="136" height="124" rx="3" fill="none" stroke="${ochre}" stroke-width="5"/>`;
  if(v===2)out=at(out,-20,0,.8)+at(object('house'),49,8,.48);
  return out;
}
function concept(name: string, v: number): string {
  v=((v%3)+3)%3; const item=['key','coffee','letter'][v];
  if(['marché','euro','tout','payer','coûter','cher','frais','bon'].includes(name))return commerce(name,v);
  if(name==='œuf') {
    if(v===0)return at(object('egg'),0,0,.9)+at(object('box'),46,28,.3);
    if(v===1)return `<path d="M-39-31Q-48-11-31-4L-22-13L-10-6L-4-22Q-13-50-39-31ZM9-24L16-9L28-15L37-5Q57-20 39-37Q24-48 9-24Z" fill="${cream}"/><path d="M-43 18H43Q36 49 0 49Q-36 49-43 18Z" fill="${teal}"/><ellipse cy="17" rx="43" ry="11" fill="${cream}"/><circle cy="15" r="10" fill="${ochre}"/>`;
    return at(object('plate'),0,13,1)+`<path d="M-31-1Q-19-24-4-13Q17-30 34-6Q45 19 19 23Q-4 40-27 21Q-42 10-31-1Z" fill="#fffef5"/><circle cy="6" r="15" fill="${ochre}"/>`+at(object('egg'),51,-34,.25);
  }
  if(name==='lait') {
    if(v===0)return objectScene('milk','market');
    if(v===1)return at(object('coffee'),-17,20,.75)+at(object('milk'),35,-22,.57)+`<path d="M14-9L5 9" stroke="#f8f4df" stroke-width="7"/>`;
    return human(-38,4,.82)+at(object('glass'),-16,-3,.38)+at(object('milk'),36,18,.7)+`<path d="M-24-7H-7V7H-23Z" fill="#f7f1dd" stroke="none"/>`;
  }
  if(name==='poisson') {
    if(v===0)return object('fish')+`<path d="M-62-39Q-30-49 0-39Q30-29 62-39M-62 43Q-30 33 0 43Q30 53 62 43" fill="none" stroke="#82adb9"/><circle cx="-53" cy="-18" r="4" fill="none"/>`;
    if(v===1)return commerce('frais',0);
    return at(object('plate'),0,15,1.1)+`<path d="M-45 10L-23-7V24Z" fill="#9cb6b5"/><path d="M34 8L55-10V26Z" fill="#9cb6b5"/><path d="M-22 8H35M-15-1L-5 8L-15 18M2-1L12 8L2 18M19-1L29 8L19 18" fill="none"/><circle cx="-33" cy="6" r="2"/>`;
  }
  if(name==='fruit')return v===0?at(object('tree'),-17,3,.9)+at(object('apple'),-38,-22,.27)+at(object('apple'),1,-32,.27):v===1?at(object('basket',{kind:'basket',detail:'food'}),0,12,.95)+at(object('apple',{kind:'apple',color:'vert'}),3,-12,.45):objectScene('fruit','market');
  if(name==='légume')return v===0?object('vegetable')+`<path d="M-63 30Q0 20 63 30M-62 41H62" fill="none"/>`:v===1?at(object('vegetable'),-27,-8,.65)+`<path d="M-58 35H59M12-25L50 9L43 17L5-17Z" fill="${cream}"/>`:objectScene('vegetable','market');
  if(name==='panier')return v===0?object('basket',{kind:'basket',detail:'food'}):v===1?human(-34,5,.86,true,coral)+at(object('basket',{kind:'basket',detail:'food'}),27,20,.65):at(object('table'),0,25,1.04)+at(object('basket',{kind:'basket',detail:'empty'}),-31,-7,.53)+at(object('bread'),29,-14,.36)+at(object('cheese'),45,2,.28);
  if(name==='sac')return v===0?object('bag'):v===1?human(0,0,.95)+at(object('bag'),-42,32,.43)+at(object('bag',{kind:'bag',color:'rouge'}),42,32,.43)+at(object('bread'),42,10,.3):at(object('table'),0,27,1)+at(object('letter'),4,-25,.38)+at(object('bag'),0,-3,.63);
  if(name==='table')return at(object('table'),0,22,1.05)+at(object(['book','coffee','plate'][v]),-11,-9,.54)+(v===1?at(object('chair'),49,21,.48):v===2?at(object('plate'),36,-10,.35):'');
  if(name==='chaise')return v===0?at(object('chair'),0,16,.9)+human(0,-2,.76):v===1?at(object('table'),28,14,.78)+at(object('chair'),-41,23,.67):at(object('chair'),0,17,.9)+at(object('book'),0,3,.47);
  if(name==='fenêtre')return v===0?object('window')+at(object('tree'),-12,5,.35):v===1?object('window',{kind:'window',detail:'open-close'}):at(object('window'),0,-24,.64)+at(object('table'),0,36,.9);
  if(name==='crayon')return v===0?action('écrire'):v===1?at(object('book'),-18,14,.78)+at(object('pencil'),43,-5,.64):at(object('note'),-20,8,.75)+at(object('key'),-20,9,.38)+at(object('pencil'),43,-3,.64);
  if(name==='lettre')return v===0?human(-34,4,.84)+at(object('letter'),21,14,.69):v===1?action('écrire'):at(object('letter'),-26,-20,.64)+at(object('envelope'),10,21,.8);
  if(name==='assiette')return v===0?at(object('plate'),0,18,1.1)+at(object('bread'),0,1,.73):v===1?at(object('table'),0,30,.94)+at(object('plate'),0,6,.85)+at(object('cheese'),0,-10,.54):object('plate');
  if(name==='cuillère')return v===0?at(object('tea'),-11,17,.85)+at(object('spoon'),18,-15,.72):v===1?at(object('soup'),-9,20,.88)+at(object('spoon'),28,-10,.65):at(object('cup'),-37,8,.55)+at(object('spoon'),25,3,.9)+at(object('sugar'),27,-15,.23);
  if(name==='sucre')return v===0?at(object('coffee'),-5,22,.88)+at(object('sugar'),22,-30,.57):v===1?`<path d="M-35-19H35V32Q0 50-35 32Z" fill="${cream}"/><ellipse cy="-19" rx="35" ry="9" fill="${cream}"/>`+at(object('sugar'),0,-7,.48):at(object('spoon'),0,11,.95)+at(object('sugar'),-2,-20,.35);
  if(name==='menu')return v===0?object('menu'):v===1?human(-43,12,.8)+human(43,12,.8,true,coral)+at(object('menu'),0,-5,.5)+arrow(-14,28,16,28):at(object('table'),0,25,.94)+at(object('menu'),0,-2,.66);
  if(name==='addition')return v===0?object('receipt'):v===1?human(-34,8,.9)+at(object('receipt'),30,19,.65):at(object('receipt'),-19,0,.84)+[0,1,2].map(i=>at(`<circle r="14" fill="${ochre}"/>${t('1 €',0,4,10)}`,34+i%2*21,-16+i*22,.8)).join('');
  if(frenchObject[name])return objectScene(frenchObject[name],['shelf','person','garden'][v]);
  if(['blanc','noir'].includes(name)) {
    const c=colorValue(name);
    if(v===0)return `<path d="M-35-25H35V34Q0 48-35 34Z" fill="${c}"/><ellipse cy="-25" rx="35" ry="10" fill="${c}"/>`;
    if(v===1)return at(object('coat',{kind:'coat',color:name}),-28,3,.8)+at(object('shirt',{kind:'shirt',color:name}),35,15,.57);
    return at(object('note'),-11,4,.85)+`<path d="M-31-3H15M-31 10H21" stroke="${ink}" stroke-width="5"/>`+at(object('pencil'),45,5,.6);
  }
  if(['je','il','elle','nous','ils','elles'].includes(name)) {
    const plural=['nous','ils','elles'].includes(name);const female=['elle','elles'].includes(name);let people=plural?human(-26,12,.82,female,teal)+human(26,12,.82,female,coral):human(0,12,.96,female,teal);
    if(name==='je'||name==='nous')people+=`<circle cx="${plural?-26:0}" cy="${plural?-12:-17}" r="${plural?14:16}" fill="none" stroke="${ochre}" stroke-width="5"/>`+arrow(-58,-39,plural?-34:-12,-26);
    else people+=arrow(60,-40,plural?35:14,-22);
    return people+at(object(item),plural?54:43,36,.3);
  }
  if(name==='ici'||name==='là')return human(-43,17,.8)+at(object(name==='là'?['house','ticket','coffee'][v]:item),name==='ici'?-18:46,20,name==='ici'?.5:.35)+`<ellipse cx="${name==='ici'?-38:45}" cy="55" rx="${name==='ici'?31:21}" ry="8" fill="none" stroke="${coral}"/>`+arrow(-15,-7,name==='ici'?-30:39,-7);
  if(name==='et')return v===0?at(object('basket',{kind:'basket',detail:'empty'}),0,20,.85)+at(object('bread'),-20,-7,.44)+at(object('cheese'),21,-4,.4):v===1?human(-29,12,.88,true,coral)+human(29,12,.88):human(0,0,.92)+at(object('key'),-35,17,.39)+at(object('letter'),34,17,.4);
  if(name==='mais')return v===0?at(object('box',{kind:'box',detail:'open'}),-37,8,.63)+at(object('door'),41,0,.68):v===1?human(-36,10,.85)+human(36,10,.85,true,coral)+at(object('cup'),-36,17,.36)+`<ellipse cx="36" cy="17" rx="14" ry="12" fill="none" stroke-dasharray="3 4"/>`:at(object('basket',{kind:'basket',detail:'food'}),-36,9,.65)+at(object('bag'),39,10,.66)+`<path d="M22-4H55V33H22Z" fill="${cream}" stroke-dasharray="3 4"/>`;
  if(name==='oui'||name==='non') {
    const yes=name==='oui'; const gesture=yes?`<path d="M25-38L36-26L60-52" fill="none" stroke="${teal}" stroke-width="5"/>`:`<path d="M30-49L57-25M57-49L30-25" fill="none" stroke="${coral}" stroke-width="5"/>`;
    if(v===1)return at(object('box',{kind:'box',detail:yes?'open':undefined}),-10,16,.8)+gesture;
    return human(-20,8,.93)+ (yes?at(object(v===0?'bread':'key'),20,12,.52):`<ellipse cx="26" cy="17" rx="22" ry="18" fill="none" stroke-dasharray="3 4"/>`)+gesture;
  }
  if(name==='pour')return human(-42,13,.8)+human(44,13,.8,true,coral)+at(object(['letter','book','coffee'][v]),0,-8,.4)+arrow(-13,25,16,25);
  if(name==='serveur')return at(object('person',{kind:'person',detail:'server'}),-14,0,.9)+at(object(['coffee','soup','receipt'][v]),44,21,.35);
  if(name==='client')return human(-27,9,.9,v===1)+at(object('table'),24,31,.8)+at(object(['coffee','menu','money'][v]),30,3,.42);
  if(name==='chaud'||name==='froid')return at(object(name==='chaud'?['coffee','soup','tea'][v]:['water','milk','tea'][v]),-29,9,.7)+at(temperature(name==='chaud'),46,-3,.7)+(name==='chaud'?`<path d="M-48-29Q-59-40-47-49M-28-29Q-39-40-27-49" fill="none"/>`:`<path d="M-39-44V-22M-50-33H-28M-47-41L-31-25M-47-25L-31-41" fill="none" stroke="#6dacc2"/>`);
  if(name==='très') {
    if(v===0)return at(temperature(true,false),-32,3,.9)+at(temperature(true,true),32,3,.9)+arrow(-8,-46,20,-46);
    if(v===1)return at(object('water'),-34,8,.65)+at(object('water'),36,8,.65)+`<rect x="-38" y="5" width="10" height="10" fill="${cream}"/>`+[0,1,2,3,4,5].map(i=>`<rect x="${23+i%2*13}" y="${-15+Math.floor(i/2)*13}" width="10" height="10" fill="${cream}"/>`).join('')+arrow(-8,-43,23,-43);
    return at(object('bread'),-43,14,.39)+at(object('bread'),27,8,.87)+at(object('plate'),-1,45,.46)+at(object('plate'),52,45,.46)+arrow(-20,-39,34,-39);
  }
  if(name==='bien') {
    if(v===0)return human(-15,8,.9)+`<path d="M-57 3H59" stroke-width="4"/>`+[-33,5,40].map(x=>at(object('cup'),x,-11,.35)).join('');
    if(v===1)return `<path d="M-58 35H58V43H-58Z" fill="${ochre}"/>`+[-43,-20,3,26].map((x,i)=>`<rect x="${x}" y="-36" width="20" height="70" fill="${[teal,coral,ochre,'#92aaa3'][i]}"/><path d="M${x+5}-27V25" stroke="${cream}"/>`).join('');
    return `<rect x="-35" y="-50" width="70" height="101" fill="${ochre}"/><rect x="-26" y="-41" width="52" height="92" fill="#a7714f"/><path d="M11-1H40V9H11Z" fill="${teal}"/><circle cx="20" cy="4" r="3" fill="${cream}"/>`;
  }
  if(name==='bonsoir')return human(-30,16,.85)+human(31,16,.85,true,coral)+sky(true,46,-40,.65)+at(object(['house','cup','door'][v]),-55,-22,.27);
  if(name==='pardon'||name==='excuser')return human(-30,14,.86)+human(36,14,.86,true,coral)+at(object(['cup','plate','bottle'][v]),0,43,.25)+`<path d="M-4 16L8 39M10 15L-2 36M-10-38Q0-49 10-38" fill="none" stroke="${coral}"/>`;
  if(name==='à bientôt')return human(-40,15,.82)+human(40,15,.82,true,coral)+arrow(10,52,58,52)+at(object(['clock','calendar','house'][v],{kind:['clock','calendar','house'][v],label:'12:00',detail:'demain'}),0,-38,.36);
  if(['avant','maintenant','après','puis'].includes(name)) {
    if(name==='puis'){const left=v===0?object('cup'):v===1?object('menu'):object('money');const right=v===0?action('boire'):v===1?grammar('est-ce que'):action('partir');return at(left,-42,7,.48)+at(right,42,7,.48)+arrow(-11,-10,14,-10);}
    const phase=name==='avant'?0:name==='après'?2:1;
    const meal=[at(object('plate'),0,10,.8)+at(object('bread'),0,0,.6),action('manger'),object('plate')];
    const drink=[object('water'),action('boire'),object('glass')];
    const door=[object('door')+at(object('key'),-41,23,.38),action('ouvrir'),at(object('door'),-30,0,.7)+human(30,10,.78)];
    const letter=[object('box')+at(object('letter'),0,0,.4),action('lire'),action('donner')];
    const scenes=name==='maintenant'?[drink,door,letter][v]:[meal,drink,door][v];let out='';
    for(let i=0;i<3;i++)out+=`<rect x="${-71+i*49}" y="-40" width="45" height="83" rx="4" fill="${i===phase?'#ecd192':cream}" stroke="${i===phase?coral:ink}" stroke-width="${i===phase?4:2}"/>`+at(scenes[i],-48+i*49,1,.31);
    return out+arrow(-56,57,57,57);
  }
  if(name==='attendre')return human(-35,15,.9)+at(object(['train','house','coffee'][v]),39,16,.5)+at(clock(['10:00','14:00','18:00'][v]),8,-35,.35)+`<path d="M-55 56H-18" fill="none" stroke-dasharray="3 4"/>`;
  if(name==='répondre')return human(-39,17,.83)+human(40,17,.83,true,coral)+`<path d="M-23-48H4V-25H-5L-15-16V-25H-23Z" fill="${cream}"/>${t('?',-9,-31,20)}<path d="M16-28H53V-5H29L20 4V-5H16Z" fill="${cream}"/>`+at(object(item),35,-16,.18);
  if(name==='encore')return at(object(['cup','bread','letter'][v]),-36,8,.58)+at(object(['cup','bread','letter'][v]),36,8,.58)+`<path d="M-30-40Q0-65 35-38M35-38L24-40M35-38L34-49" fill="none"/>`;
  if(name==='aussi')return human(-35,15,.82)+human(35,15,.82,true,coral)+at(object(item),-35,17,.3)+at(object(item),35,17,.3)+`<path d="M-8-20H8M-8-11H8" stroke="${coral}" stroke-width="4"/>`;
  if(name==='ensemble')return human(-39,13,.85)+human(39,13,.85,true,coral)+(v===0?at(object('cup'),-12,18,.39)+at(object('cup'),13,18,.39):at(object(v===1?'table':'letter'),0,27,.6))+`<path d="M-56 55Q0 70 56 55" fill="none" stroke="${coral}"/>`;
  if(name==='matin'||name==='soir')return at(object(['house','train','coffee'][v]),-19,16,.75)+sky(name==='soir',41,-40,.9)+at(clock(name==='soir'?'20:00':'08:00'),-47,-34,.36);
  if(name==='demi')return `<path d="M0-37A43 43 0 0 0 0 49Z" fill="${ochre}"/><path d="M0-37A43 43 0 0 1 0 49Z" fill="none" stroke-dasharray="4 5"/>`+at(object(['bread','apple','cheese'][v]),0,9,.52)+`<path d="M0-45V57" stroke="${coral}" stroke-dasharray="4 4"/>`;
  if(['départ','partir','arrivée','arriver'].includes(name)){const arriving=name==='arrivée'||name==='arriver';return at(object(['train','person','bag'][v]),-30,14,.7)+at(object(['station','house','door'][v]),45,9,.55)+arrow(arriving?-10:24,-33,arriving?27:-15,-33);}
  if(name==='retard')return at(clock(['08:00','12:00','18:00'][v]),-37,0,.65)+at(clock(['08:15','12:30','18:45'][v]),38,0,.65)+arrow(-8,-43,26,-43)+`<path d="M30 45L38 33L46 45Z" fill="${coral}"/>`;
  if(name==='destination')return at(object(['house','station','cup'][v]),42,-8,.6)+`<path d="M-62 42L-36 16L-16 22L12-6L25-5" fill="none" stroke-dasharray="4 4"/>`+`<circle cx="42" cy="-8" r="42" fill="none" stroke="${coral}" stroke-width="3"/>`;
  if(name==='nord'||name==='sud')return `<circle r="49" fill="${cream}"/><path d="M-37 0H37M0-38V38" fill="none" stroke="#c8c5b5"/><path d="M0 ${name==='nord'?-39:39}L-12 0L0 ${name==='nord'?9:-9}L12 0Z" fill="${coral}"/>`+t('N',0,-55,13)+t('S',0,66,13)+t('O',-61,5,13)+t('E',61,5,13)+at(object(['map','train','house'][v]),40,41,.22);
  if(name==='plan')return at(object('map'),0,0,.95)+at(object(['house','station','cup'][v]),18,-10,.3);
  if(name==='pont')return `<path d="M-68 31Q-34 20 0 31Q34 42 68 31M-68 45Q-34 34 0 45Q34 56 68 45" fill="none" stroke="#7faab7"/><path d="M-64-2H64V15H37Q0-35-37 15H-64Z" fill="${ochre}"/><path d="M-64-19V-2M-43-19V-2M-22-19V-2M0-19V-2M22-19V-2M43-19V-2M64-19V-2M-64-19H64" fill="none"/>`+at(object(['person','train','bag'][v]),0,-29,.3);
  if(name==='rue')return at(object('house'),-45,-9,.48)+at(object('house'),47,-9,.48)+`<path d="M-18-17L-47 57M18-17L47 57M0-11V1M0 18V32M0 45V59" fill="none"/>`+at(object(['person','bag','cat'][v]),-24,34,.28);
  if(name==='place')return at(object('house'),-46,-25,.38)+at(object('house'),43,-25,.38)+at(object('house'),0,-43,.32)+`<ellipse cy="26" rx="65" ry="32" fill="none"/><ellipse cy="27" rx="24" ry="10" fill="#aac5bb"/><path d="M0 25V-4M-16 9Q0-23 16 9" fill="none"/>`+at(object(['person','tree','flower'][v]),48,31,.28);
  if(['famille','sœur','frère','enfant','parent'].includes(name))return kinship(name,v);
  if(name==='salon')return `<path d="M-45-9V-30Q0-47 45-30V-9M-53-8H-33V17H33V-8H53V42H-53Z" fill="${teal}"/><path d="M-42 42V49M42 42V49M0-30V16" fill="none"/>`+at(object(['book','cup','flower'][v]),0,-17,.34);
  if(name==='ami')return human(-35,13,.9)+human(35,13,.9,true,coral)+`<path d="M-14 16L-2 21L13 16M-52-34Q0-54 52-34" fill="none"/>`+at(object(item),0,-35,.28);
  if(name==='voisin')return at(object('house'),-38,9,.6)+at(object('house'),38,9,.6)+human(-37,25,.4)+human(37,25,.4,true,coral)+`<path d="M-6-12H6M-6-6H6" stroke="${coral}"/>`+at(object(['flower','tree','cat'][v]),0,42,.25);
  if(['ton','son','notre','votre','leur'].includes(name)) {
    const owned=at(object((name==='notre'||name==='leur'?['book','house','garden']:['book','coat','bag'])[v]),43,36,.39);const speaker=human(-52,11,.65)+`<circle cx="-52" cy="-8" r="12" fill="none" stroke="${ochre}" stroke-width="4"/>`;
    if(name==='ton')return speaker+human(12,9,.78,true,coral)+`<path d="M-28-34H1V-15H-11L-19-7V-15H-28Z" fill="${cream}"/>`+t('tu',-14,-20,11)+arrow(15,26,31,36)+owned;
    if(name==='son')return speaker+human(40,-5,.64,true,coral)+arrow(-19,-30,20,-37)+arrow(40,11,43,26)+owned;
    if(name==='notre')return speaker+human(-14,11,.65,true,coral)+`<path d="M-65 44Q-32 56 0 44" fill="none" stroke="${coral}"/>`+arrow(-2,36,28,36)+owned;
    const others=human(12,-5,.56,true,coral)+human(44,-5,.56,false,teal);
    if(name==='votre')return speaker+others+`<path d="M-30-37H-1V-18H-12L-20-10V-18H-30Z" fill="${cream}"/>`+t('vous',-15,-23,9)+arrow(28,15,39,27)+owned;
    return speaker+at(others,0,-9,.88)+arrow(-20,-33,13,-44)+arrow(27,2,39,27)+owned;
  }
  if(name==='nouveau'||name==='vieux'){const old=name==='vieux';return at(object(['book','coat','house'][v]),0,7,.86)+(old?`<path d="M-36-13L-23-2L-32 8L-18 18M18-30L11-15L24-4L16 10M-14 34L-3 26L7 33" fill="none" stroke="#986e4b" stroke-width="4"/><path d="M-36 48H31" stroke-dasharray="3 4"/>`:`<path d="M-48-30V-48M-57-39H-39M42-28V-46M33-37H51" fill="none" stroke="${ochre}" stroke-width="4"/>`);}
  if(name==='aider')return human(-42,14,.83)+human(42,14,.83,true,coral)+at(object(['box','bag','table'][v]),0,31,.55)+arrow(-21,0,-5,-15)+arrow(21,0,5,-15);
  if(name==='chercher')return at(object(['book','box','chair'][v]),-11,8,.75)+at(object(['key','letter','ticket'][v]),35,22,.27)+`<circle cx="-18" cy="-14" r="24" fill="#faf3df" fill-opacity=".45"/><path d="M-2 4L26 38" stroke-width="8"/>`+t('?',-18,-5,24);
  if(name==='chez')return at(object('house'),0,2,1)+human(0,24,.45,v===1,v===2?coral:teal)+at(object(item),47,44,.25);
  if(name==='toujours')return [0,1,2].map(i=>at(object(['coffee','book','flower'][v]),-45+i*45,16,.34)+at(clock(['08:00','12:00','18:00'][i]),-45+i*45,-33,.25)).join('')+arrow(-58,53,59,53);
  if(name==='déjà')return at(object(['letter','plate','box'][v]),-34,8,.65)+at(clock(['10:00','12:00','18:00'][v]),41,4,.6)+`<path d="M-53-39L-41-26L-17-52" fill="none" stroke="${teal}" stroke-width="5"/>`+arrow(-10,53,55,53);
  if(name==='enfin')return `<path d="M-65 41L-51 20L-55-1L-36-5L-35-30L-13-29L-13-5L11-5L12 20L30 19L43 1" fill="none" stroke-dasharray="4 4"/>`+at(object(['key','letter','house'][v]),43,-16,.5)+`<path d="M27-51L38-39L59-61" fill="none" stroke="${teal}" stroke-width="4"/>`;
  if(name==='bientôt')return at(clock(['11:55','17:55','07:55'][v]),-35,3,.65)+at(clock(['12:00','18:00','08:00'][v]),38,3,.65)+arrow(-9,-44,25,-44)+t('5 min',0,57,14);
  if(name==='histoire')return at(object('book'),0,20,.9)+[0,1,2].map(i=>at(object(['train','letter','house'][(i+v)%3]),-43+i*43,-33,.29)).join('')+arrow(-52,-3,52,-3);
  if(name==='souvenir')return human(-43,19,.8)+`<path d="M-5-50H64V12H15L3 25V12H-5Z" fill="${cream}"/>`+at(object(['family','portrait','garden'][v]),29,-18,.4);
  if(name==='promesse')return human(-40,18,.85)+human(40,18,.85,true,coral)+`<path d="M-16 18L0 23L16 18M-10-53H43V-17H15L3-5V-17H-10Z" fill="${cream}"/>`+at(object(['letter','calendar','house'][v],{kind:['letter','calendar','house'][v],detail:'demain'}),16,-34,.27);
  if(name==='rendez_vous'||name==='rendez-vous')return human(-48,25,.65)+human(48,25,.65,true,coral)+at(clock(['12:00','18:00','08:00'][v]),0,-24,.52)+arrow(-37,56,-4,39)+arrow(37,56,4,39)+at(object(['tree','cup','station'][v]),0,40,.32);
  if(name==='retrouver')return human(-34,14,.85)+human(35,14,.85,true,coral)+`<path d="M-17-16L0-5L17-16M-53-41Q0-64 53-41" fill="none"/>`+at(object(['letter','photo','key'][v]==='photo'?'portrait':['letter','photo','key'][v]),0,40,.3);
  if(name==='revenir')return at(object('house'),-40,5,.58)+human(41,19,.85,v===1)+`<path d="M-14-31Q36-59 58-30Q72 5 24 12" fill="none"/>`+arrow(21,13,-8,13)+at(object(item),40,40,.25);
  if(name==='oublier')return human(-37,18,.85)+at(object(item),44,24,.5)+`<path d="M-24-55H22V-22H-5L-13-12V-22H-24Z" fill="${cream}" stroke-dasharray="4 5"/>`+t('?',0,-31,20)+arrow(-4,53,-55,53);
  if(name==='savoir')return human(-36,18,.85)+`<path d="M-11-55H63V-4H20L8 7V-4H-11Z" fill="${cream}"/>`+at(object(['map','book','key'][v]),26,-28,.36)+`<path d="M-1 32L10 42L31 19" fill="none" stroke="${teal}" stroke-width="5"/>`;
  if(name==='comprendre')return human(-44,17,.85)+at(object(['letter','map','book'][v]),35,19,.52)+`<circle cx="14" cy="-35" r="14" fill="${ochre}"/><path d="M6-22V-14H22V-22M10-10H18M14-58V-63M-7-43L-12-46M35-43L40-46" fill="none"/>`;
  return objectScene(item,['shelf','person','garden'][v]);
}
