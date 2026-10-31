import './style.css';
import { lexicon, loadZone, loadContent, zoneIds } from './content';
import type { Zone, ZoneId, JournalPage, WorldAction } from './content/types';
import { pictureSvg } from './ui/pictures';
import { World } from './game/world';
import { initialState, encounter, annotate, confirmPage, pageAvailable, solvePuzzle, puzzleCompletedForTravel, zoneOrder, type GameState } from './game/state';
import { saveGame, loadGame, exportSave, importSave } from './game/save';
import { GameAudio } from './game/audio';
import { initialInteractions, availableActions, applyWorldAction, validateWorldSequence, type InteractionState } from './game/interactions';
import { frenchFormOccurs } from './content/forms';
import { journalFrame } from './ui/journal-frame';

const $ = <T extends HTMLElement = HTMLElement>(selector: string, parent: ParentNode = document): T => parent.querySelector<T>(selector)!;
const esc = (s: string): string => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const mark = '<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M6 25C17 8 31 8 42 25C31 42 17 42 6 25Z" stroke="currentColor" stroke-width="2"/><circle cx="24" cy="25" r="7" stroke="currentColor" stroke-width="2"/><path d="M24 4V9M8 8L12 12M40 8L36 12" stroke="currentColor" stroke-width="2"/></svg>';
let state: GameState = initialState();
let zone: Zone;
const loaded = new Map<ZoneId, Zone>();
let playing = false;
let renderedWordsKey='';
const surfaceWords=new Map<string,{id:string;lemma:string;forms:string[];zone:ZoneId}>();
let activeTab = 'pages';
let pageId: string | undefined;
let assignments: Record<string, string> = {};
let selectedTile = '';
let journalFilter = 'all';
let puzzleAnswers: string[] = [];
let mechanismStep: number | undefined;
let interactions: InteractionState | undefined;
let focusedEntity:string|undefined;
let saveQueue = Promise.resolve();
const audio = new GameAudio();
$('#app').innerHTML = `<main id="stage"><div id="world"></div><div class="world-vignette"></div><header id="masthead"><a class="brand" href="#" aria-label="Babelwake">${mark}<span>BABELWAKE<small>LE FIL DES MOTS</small></span></a><div class="header-actions"><button class="icon-button" id="sound" aria-label="Toggle sound">♫</button><button id="menu" class="icon-button" aria-label="Menu">☰</button></div></header><section id="title-screen"><div class="title-copy"><div class="eyebrow"><span class="little-line"></span> AN EXPLORATION IN FRENCH</div><h1>A little village.<br><em>A world of words.</em></h1><p>A letter to deliver. Neighbours to meet.<br>Find your words, one small discovery at a time.</p><button class="primary" data-testid="start" id="start" disabled>Begin your journey <span>↗</span></button><button class="text-button" id="how">How to play <span>↗</span></button></div><div class="scene-caption"><span class="caption-line"></span><div><span>01 / 06</span><strong>L’atelier</strong><small>Tout commence par un mot.</small></div></div><div class="title-footer"><span>LOOK CLOSELY. MAKE CONNECTIONS. FIND YOUR WORDS.</span><button class="text-button" id="credits">Credits ↗</button></div></section><section id="hud" hidden><div class="zone-label"><span id="zone-number"></span><h1 id="zone-title"></h1><p id="zone-subtitle"></p></div><div class="hud-actions"><button id="journal" data-testid="journal" class="paper-button">▤ <span>Carnet</span><small id="page-count"></small></button></div><div class="reticle"></div><div class="world-toolbar"><div class="controls-hint" id="controls-hint"></div><button id="route" class="paper-button">⌁</button><button id="puzzle" class="primary">La porte <span>→</span></button></div></section><div id="overlay" hidden></div><div id="toast" role="status"></div></main>`;
const world = new World($('#world'), id => {
  if (!playing) return;
  if(id.startsWith('__word:')){wordEntry(id.slice(7));return;}
  if(id.startsWith('__talk:')){talkEntity(id.slice(7));return;}
  if(id.startsWith('__entity:')){interactEntity(id.slice(9));return;}
  if (id==='__door') { openPuzzle(); return; }
  if(id.startsWith('__action:') && mechanismStep !== undefined){ const choice=zone.puzzle.steps[mechanismStep].choices[Number(id.split(':')[1])]; if(choice){puzzleAnswers[mechanismStep]=choice;audio.cue('step');if(mechanismStep<zone.puzzle.steps.length-1)mechanismStep++;renderMechanism();}return;}
  inspect(id);
});
function persist(): void {
  const snapshot = structuredClone(state);
  saveQueue = saveQueue.catch(() => {}).then(() => saveGame(snapshot)).catch(() => toast('La sauvegarde n’est pas disponible.'));
}
function toast(message: string): void { $('#toast').textContent = message; $('#toast').classList.add('visible'); window.setTimeout(() => $('#toast').classList.remove('visible'), 3400); }
function applySettings(): void {
  document.documentElement.style.setProperty('--text-scale', String(state.settings.textSize));
  document.body.classList.toggle('high-contrast', state.settings.contrast);
  world.setControls(state.settings.controls); world.setContrast(state.settings.contrast); audio.setVolume(state.settings.volume);
}
async function changeZone(id: ZoneId): Promise<void> {
  const next = loaded.get(id) ?? await loadZone(id); loaded.set(id, next); zone = next; state = { ...state, zone: id };
  mechanismStep=undefined; $('#mechanism')?.remove(); world.setZone(zone, new Set(state.encountered));
  interactions=zone.design==='situated'?initialInteractions(zone):undefined;
  lastSpeech.clear();
  focusedEntity=undefined;
  if(interactions&&state.solved.includes(zone.puzzle.id))for(const action of zone.puzzle.world?.sequence??[])interactions=applyWorldAction(zone,interactions,action);
  if(interactions)world.setInteractionState(interactions);
  world.setPaused(!playing); puzzleAnswers = []; closeOverlay(); updateHud(); persist();
}
function updateHud(): void {
  $('#zone-number').textContent = `${String(zoneOrder.indexOf(zone.id) + 1).padStart(2, '0')} / 06`;
  $('#zone-title').textContent = zone.title; $('#zone-subtitle').textContent = zone.subtitle;
  $('#page-count').textContent = `${zone.pages.filter(p => state.confirmed.includes(p.id)).length}/${zone.pages.length}`;
  $('#controls-hint').innerHTML = `<kbd>${esc(state.settings.controls.forward.replace('Key',''))}</kbd><kbd>${esc(state.settings.controls.left.replace('Key',''))}</kbd><kbd>${esc(state.settings.controls.back.replace('Key',''))}</kbd><kbd>${esc(state.settings.controls.right.replace('Key',''))}</kbd><span>↔</span><span>◉</span><span>·</span><kbd>${esc(state.settings.controls.journal.replace('Key',''))}</kbd> ▤`;
  world.updateSeen(new Set(state.encountered));
  const wordsKey=JSON.stringify([state.guesses,state.confirmed]);if(wordsKey!==renderedWordsKey){renderedWordsKey=wordsKey;world.setWordRenderer((text,evidence)=>french(text,evidence?.senses).replace(/<button /g,'<span ').replace(/<\/button>/g,'</span>'));}
  $('#puzzle').hidden=zone.design==='situated';
  renderPhysicalControls();
}
function openOverlay(html: string, cls = ''): void {
  if (document.pointerLockElement) document.exitPointerLock();
  world.setPaused(true); const el = $('#overlay'); el.className = cls; el.innerHTML = html; el.hidden = false;
  el.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeOverlay));
  requestAnimationFrame(() => el.querySelector<HTMLElement>('button,input,textarea')?.focus());
}
function closeOverlay(): void { $('#overlay').hidden = true; $('#overlay').innerHTML = ''; world.setPaused(!playing); }
function shell(title: string, body: string, overline = '', cls = ''): string {
  return `<section class="panel ${cls}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header class="panel-header"><div><div class="eyebrow">${overline}</div><h2>${title}</h2></div><button class="close" data-close aria-label="Fermer">×</button></header>${body}</section>`;
}
const canonicalIds=new Map(lexicon.map(w=>[w.id,lexicon.find(l=>l.id===w.lemma)?.id??lexicon.find(l=>l.lemma===w.lemma)?.id??w.id]));
const canonicalId=(id:string):string=>canonicalIds.get(id)??id;
const guessFor = (id:string):string => state.guesses[canonicalId(id)] ?? '';
world.setWordRenderer((text,evidence)=>french(text,evidence?.senses).replace(/<button /g,'<span ').replace(/<\/button>/g,'</span>'));
const allForms = lexicon.flatMap(word => [...new Set([word.lemma, ...word.forms])].map(form => ({ form, lower:form.toLocaleLowerCase('fr'), id: word.id }))).sort((a,b) => b.form.length-a.form.length);
function french(text: string, senses:Record<string,string>={}): string {
  let output = ''; let at = 0;const lowerText=text.toLocaleLowerCase('fr');
  while (at < text.length) {
    const found = allForms.find(({form,lower,id}) => (!senses[lower]||senses[lower]===id) && lowerText.startsWith(lower,at) && (at === 0 || !/[\p{L}]/u.test(text[at-1])) && (/['’]$/.test(form)||!/[\p{L}]/u.test(text[at+form.length] ?? '')));
    if (found) { const confirmed = [...loaded.values()].some(z=>z.pages.some(p=>state.confirmed.includes(p.id)&&p.words.some(id=>canonicalId(id)===canonicalId(found.id))));
      output += `<button class="word ${confirmed ? 'confirmed' : ''}" data-word="${found.id}"><span>${esc(text.slice(at, at+found.form.length))}</span>${guessFor(found.id) ? `<small>${esc(guessFor(found.id))}</small>` : ''}</button>`; at += found.form.length;
    } else { const surface=/^[\p{L}]+(?:[’'-][\p{L}]+)*/u.exec(text.slice(at))?.[0];if(surface){const id='@'+surface.toLocaleLowerCase('fr');surfaceWords.set(id,{id,lemma:surface,forms:[surface],zone:zone?.id??'atelier'});output+=`<button class="word" data-word="${esc(id)}"><span>${esc(surface)}</span>${guessFor(id)?`<small>${esc(guessFor(id))}</small>`:''}</button>`;at+=surface.length;}else{output+=esc(text[at]);at++;} }
  }
  return output;
}
function bindWords(parent: ParentNode = $('#overlay')): void { parent.querySelectorAll<HTMLElement>('[data-word]').forEach(el => el.addEventListener('click', () => wordEntry(el.dataset.word!,(el.classList.contains('vocabulary-row')?el.querySelector('strong'):el.querySelector('span'))?.textContent??undefined))); }
function wordEntry(id: string, formLabel?:string): void {
  if($('#overlay').hidden) openOverlay('', 'annotation-overlay');
  const word = lexicon.find(w=>w.id===id)??surfaceWords.get(id)??(id.startsWith('@')?{id,lemma:id.slice(1),forms:[id.slice(1)],zone:zone.id}:undefined); if (!word) return;
  $('#word-entry')?.remove();
  const form = document.createElement('form'); form.id = 'word-entry'; form.className = 'word-entry';
  const observedForms=word.forms.filter(f=>[...loaded.values()].some(z=>z.evidence.some(e=>state.encountered.includes(e.id)&&frenchFormOccurs(e.text,f))));
  form.innerHTML = `<div class="eyebrow">MON HYPOTHÈSE</div><label for="guess">${esc(formLabel??observedForms[0]??word.forms[0])}</label><input data-testid="guess-input" id="guess" maxlength="200" autocomplete="off" value="${esc(guessFor(id) ?? '')}" placeholder="…"><div class="word-entry-bottom"><span>${[...loaded.values()].some(z=>z.pages.some(p=>p.kind==='grammar'&&state.confirmed.includes(p.id)&&p.words.some(w=>canonicalId(w)===canonicalId(id))))?observedForms.map(esc).join(' · '):'✎'}</span><button type="submit" class="round-button" aria-label="Enregistrer">↗</button><button type="button" class="round-button" id="dismiss-word" aria-label="Fermer">×</button></div>`;
  $('#overlay').append(form); $('#guess').focus();
  form.addEventListener('submit',e=>{e.preventDefault(); state=annotate(state,canonicalId(id),$<HTMLInputElement>('#guess').value);persist();updateHud(); form.remove(); if(!$('#overlay').querySelector('.panel'))closeOverlay(); $('#overlay').querySelectorAll<HTMLElement>(`[data-word="${id}"]`).forEach(el=>{const small=el.querySelector('small')??document.createElement('small');small.textContent=guessFor(id);el.append(small);});});
  $('#dismiss-word').onclick = ()=>{form.remove();if(!$('#overlay').querySelector('.panel'))closeOverlay();};
}
function inspect(id: string): void {
  const evidence = zone.evidence.find(e=>e.id===id); if (!evidence) return;
  if(zone.design==='situated'){
    if(!$('#overlay').hidden)closeOverlay();
    focusedEntity=evidence.anchor;if(evidence.surface==='speech'&&evidence.anchor)lastSpeech.set(evidence.anchor,id);state=encounter(state,id);persist();updateHud();world.focusEvidence(id);audio.cue('open');void audio.playLine(id);return;
  }
  const contexts=zone.evidence.filter(e=>(e.station??e.id)===(evidence.station??evidence.id));const contextIndex=contexts.findIndex(e=>e.id===id);
  state = encounter(state, id); persist(); updateHud(); audio.cue('open'); void audio.playLine(id);
  openOverlay(shell(esc(evidence.title), `<div class="evidence-art">${pictureSvg(evidence.picture)}</div><div class="evidence-text">${french(evidence.text)}</div><nav class="context-tabs" aria-label="Les scènes">${contexts.length>1?`<button id="previous-context" aria-label="Précédent">←</button><span>${contexts.map((e,i)=>`<button data-context="${e.id}" class="${i===contextIndex?'current':''}" aria-label="${i+1}">${state.encountered.includes(e.id)?'●':'○'}</button>`).join('')}</span><button id="next-context" aria-label="Suivant">→</button>`:''}</nav><div class="evidence-footer"><span>◉ ${zone.evidence.filter(e=>state.encountered.includes(e.id)).length} / ${zone.evidence.length}</span><button class="text-button" id="evidence-journal">▤ Carnet ↗</button></div>`, zone.title, 'evidence-panel'), 'evidence-overlay');
  bindWords(); $('#evidence-journal').onclick=()=>openJournal();
  document.querySelectorAll<HTMLElement>('[data-context]').forEach(b=>b.onclick=()=>inspect(b.dataset.context!));
  const previous=$('#previous-context'),next=$('#next-context');if(previous)previous.onclick=()=>inspect(contexts[(contextIndex-1+contexts.length)%contexts.length].id);if(next)next.onclick=()=>inspect(contexts[(contextIndex+1)%contexts.length].id);
}
function renderPhysicalControls():void {
  $('#physical-controls')?.remove();
  if(zone.design!=='situated'||!interactions)return;
  const element=document.createElement('div');element.id='physical-controls';
  const held=zone.scene?.find(object=>object.id===interactions?.held);
  element.innerHTML=`<div class="carried-object" data-held="${esc(held?.id??'')}">${held?pictureSvg({kind:held.kind,color:held.color}):'<span aria-hidden="true">✋</span>'}${held?.label?`<span>${french(held.label)}</span>`:''}</div><button id="leave-focus" class="paper-button" aria-label="↶">↶</button><button id="reset-world" class="paper-button" aria-label="↺" ${!interactions.history.length?'disabled':''}>↺</button>${state.solved.includes(zone.puzzle.id)?'<span class="world-complete" role="status">✓</span>':''}`;
  $('#hud').append(element);bindWords(element);
  $('#leave-focus').onclick=()=>world.clearFocus();
  $('#reset-world').onclick=()=>{interactions=initialInteractions(zone);world.setInteractionState(interactions);world.clearFocus();renderPhysicalControls();};
}
function commitWorldPuzzle():boolean {
  if(!interactions||!zone.puzzle.world)return false;
  if(state.solved.includes(zone.puzzle.id))return true;
  if(!zone.puzzle.requiredPages.every(id=>state.confirmed.includes(id))||!validateWorldSequence(zone.puzzle,interactions))return false;
  state={...state,solved:[...state.solved,zone.puzzle.id]};persist();audio.cue('confirm');toast('✓');updateHud();return true;
}
function performWorldAction(action:WorldAction):boolean {
  if(!interactions||zone.design!=='situated')return false;
  const next=applyWorldAction(zone,interactions,action);
  if(next===interactions)return false;
  interactions=next;world.setInteractionState(interactions);audio.cue('step');renderPhysicalControls();commitWorldPuzzle();return true;
}
/** Physical diagrams describe an affordance, without supplying French labels. */
function physicalActionDiagram(action:WorldAction):{drawing:string;description:string} {
  const dot=(x:number,y:number)=>`<circle cx="${x}" cy="${y}" r="9" fill="currentColor" stroke="none"/>`;
  const arrow=(path:string)=>`<path d="${path}" fill="none" marker-end="url(#action-arrow)"/>`;
  const frame='<path d="M39 37H95V83H39Z" fill="none"/>';
  let drawing='',description='';
  switch(action.kind){
    case 'place':
      drawing=frame+dot(67,action.relation==='on'?25:action.relation==='under'?104:60)+arrow(action.relation==='on'?'M12 24H47':action.relation==='under'?'M12 104H47':'M10 60H47');
      description=action.relation==='on'?'Circle resting at the upper edge of a rectangle':action.relation==='under'?'Circle beneath the lower edge of a rectangle':'Circle enclosed by a rectangle';break;
    case 'combine': drawing=dot(50,64)+'<circle cx="72" cy="64" r="13" fill="none"/>'+arrow('M17 64H34');description='Two objects joined together';break;
    case 'deliver': drawing='<circle cx="86" cy="29" r="10" fill="none"/><path d="M72 90V51Q86 38 100 51V90M73 55L58 66" fill="none"/>'+dot(45,66)+arrow('M10 66H29');description='An object moving into a person’s hand';break;
    case 'take': drawing='<path d="M77 82V54Q77 45 83 45Q89 45 89 54V65L96 58Q104 57 102 66L95 89H76L67 77Q65 70 72 72Z" fill="none"/>'+dot(29,64)+arrow('M43 64H65');description='A hand lifting an object';break;
    case 'operate':
      if(action.operation==='open'||action.operation==='close'){
        drawing='<path d="M34 93V23H92V93" fill="none"/><path d="M39 28L74 41V94L39 88Z" fill="none"/>'+arrow(action.operation==='open'?'M102 57Q116 82 87 96':'M105 93Q119 62 97 50');
        description=action.operation==='open'?'A hinged panel swinging away from its frame':'A hinged panel returning to its frame';
      }else if(action.operation==='turn'){
        drawing='<circle cx="65" cy="65" r="20" fill="none"/>'+arrow('M35 41A38 38 0 1 1 30 82');description='A circular handle rotating';
      }else{drawing='<path d="M35 85H98V97H35Z" fill="none"/><path d="M45 83V69H88V83" fill="none"/>'+arrow('M67 21V53');description='A button moving downward';}
      break;
  }
  return {drawing:`<svg viewBox="0 0 130 125" aria-hidden="true"><defs><marker id="action-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0L5 2.5L0 5Z" fill="currentColor" stroke="none"/></marker></defs><g stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${drawing}</g></svg>`,description};
}
function chooseWorldAction(id:string,actions:WorldAction[]):void {
  if(actions.length===1){world.focusEntity(id);performWorldAction(actions[0]);return;}
  world.focusEntity(id);
  const diagrams=actions.map(physicalActionDiagram);
  openOverlay(shell('◉ → ◇',`<div class="physical-action-options">${diagrams.map((diagram,index)=>`<button class="physical-action-option" data-physical-action="${index}" aria-label="${esc(diagram.description)}">${diagram.drawing}</button>`).join('')}</div>`,'','physical-action-panel'),'physical-action-overlay');
  document.querySelectorAll<HTMLButtonElement>('[data-physical-action]').forEach(button=>button.onclick=()=>{
    const action=actions[Number(button.dataset.physicalAction)];
    closeOverlay();world.focusEntity(id);performWorldAction(action);
  });
}
function interactEntity(id:string):void {
  if(zone.design!=='situated'||!interactions)return;
  const physical=interactions;
  const object=zone.scene?.find(item=>item.id===id);if(!object)return;
  if(state.solved.includes(zone.puzzle.id)&&zone.puzzle.world?.exit===id){const next=zoneIds[zoneIds.indexOf(zone.id)+1];if(next)void changeZone(next);else openEnding();return;}
  const lines=zone.evidence.filter(e=>e.anchor===id);
  if(lines.length&&!object.recipient&&(!world.getViewState().focused||focusedEntity!==id)){
    focusedEntity=id;inspect((lines.find(e=>!state.encountered.includes(e.id))??lines[0]).id);return;
  }
  const actions=availableActions(zone,physical).filter(action=>'target'in action?action.target===id:action.object===id);
  if(actions.length){chooseWorldAction(id,actions);return;}
  if(lines.length){const next=lines.find(e=>!state.encountered.includes(e.id))??lines[(lines.findIndex(e=>e.id===lastSpeech.get(id))+1)%lines.length];lastSpeech.set(id,next.id);inspect(next.id);return;}
  world.focusEntity(id);
}
const lastSpeech=new Map<string,string>();
function talkEntity(id:string):void {
  if(zone.design!=='situated')return;
  const lines=zone.evidence.filter(e=>e.anchor===id&&e.surface==='speech');if(!lines.length)return;
  const request=(zone.puzzle.world?.clues??[]).map(clue=>zone.evidence.find(e=>e.id===clue)).reverse().find(e=>e?.anchor===id);
  const next=lines.find(e=>!state.encountered.includes(e.id))??request??lines.find(e=>e.id===lastSpeech.get(id))??lines[0];
  inspect(next.id);
}
function talkNearest():void {
  if(zone.design!=='situated')return;
  const player=world.getPlayerPosition();
  const actors=(zone.scene??[]).filter(o=>o.recipient).map(o=>({id:o.id,distance:Math.hypot(o.position[0]-player.x,o.position[1]-player.z)})).sort((a,b)=>a.distance-b.distance);
  if(actors[0]?.distance<3.5)talkEntity(actors[0].id);
}
function openJournal(tab = activeTab): void {
  activeTab = tab;
  openOverlay(shell('Le carnet', `<nav class="journal-tabs"><button data-tab="pages" class="${tab==='pages'?'active':''}">Les pages</button><button data-tab="words" class="${tab==='words'?'active':''}">Les mots</button><button data-tab="notes" class="${tab==='notes'?'active':''}">Mes notes</button></nav><div id="journal-body"></div>`, 'CE QUE JE COMPRENDS', 'journal-panel'), 'journal-overlay');
  document.querySelectorAll<HTMLElement>('[data-tab]').forEach(el=>el.onclick=()=>openJournal(el.dataset.tab));
  if(tab==='pages') renderPages(); else if(tab==='words') renderWords(); else {
    $('#journal-body').innerHTML='<textarea id="notes" class="notes" placeholder="…" aria-label="Mes notes" maxlength="100000"></textarea>';
    $<HTMLTextAreaElement>('#notes').value=state.notes; $('#notes').oninput=()=>{state={...state,notes:$<HTMLTextAreaElement>('#notes').value};persist();};
  }
}
function renderPages(): void {
  const pages = [...loaded.values()].flatMap(z=>z.pages);
  $('#journal-body').innerHTML = `<div class="journal-intro"><span>${pages.filter(page=>state.confirmed.includes(page.id)).length} / ${pages.length}</span><p>Observer. Relier. Comprendre.</p></div><div class="page-grid">${pages.map((p,i)=>{const available=pageAvailable(state,p,loaded.get(p.zone)!); const done=state.confirmed.includes(p.id); const count=[...p.words,...(p.distractors??[])].filter(w=>pageAvailable(state,{...p,words:[w],distractors:[]},loaded.get(p.zone)!)).length;return `<button class="page-card ${done?'done':''}" data-page="${p.id}" data-testid="journal-page-${p.id}" ${!available?'disabled':''}><span class="page-card-top">${String(i+1).padStart(2,'0')}<span>${done?'✓':available?'↗':'◌'}</span></span><div class="mini-picture">${pictureSvg(p.slots[0].picture)}</div><h3>${esc(p.title)}</h3><small>${done?'◆':available?'◇':`${count} / ${p.words.length+(p.distractors?.length??0)}`} ${loaded.get(p.zone)?.design==='situated'?'◇':p.kind==='grammar'?'Les liens':'Les mots'}</small></button>`;}).join('')}</div>`;
  document.querySelectorAll<HTMLElement>('[data-page]').forEach(b=>b.onclick=()=>openPage(b.dataset.page!));
}
function openPage(id: string): void {
  const p = [...loaded.values()].flatMap(z=>z.pages).find(p=>p.id===id); if(!p) return;
  const situated=loaded.get(p.zone)?.design==='situated';
  const frame=journalFrame(p,situated);
  if(situated){const panel=$('.journal-panel');panel.setAttribute('aria-label',frame.dialog);$('.panel-header h2',panel).textContent=frame.dialog;$('.panel-header .eyebrow',panel).textContent=frame.overline;$('.panel-header [data-close]',panel).setAttribute('aria-label',frame.close);$('.journal-tabs',panel).hidden=true;}
  if(pageId!==id){assignments={};selectedTile='';} pageId=id;
  const done = state.confirmed.includes(id);
  $('#journal-body').innerHTML=`<button class="text-button" id="back-pages">${frame.back}</button><div class="matching-heading"><div><div class="eyebrow">${frame.section}</div><h3>${esc(p.title)}</h3></div><span>${done?'◆':'◇'}</span></div><div class="matching-slots">${p.slots.map(s=>`<button class="match-slot ${done?'locked':''}" data-slot="${s.id}" aria-label="${esc(s.id)}"><div>${pictureSvg(s.picture)}</div><span class="slot-answer">${done?esc(lexicon.find(w=>w.id===s.answer)?.forms[0]??s.answer):assignments[s.id]?esc(lexicon.find(w=>w.id===assignments[s.id])?.forms[0]??''):'＋'}</span></button>`).join('')}</div>${done?'<div class="confirmed-seal">✧</div>':`<div class="word-tiles">${[...p.words,...(p.distractors??[])].map(id=>`<button draggable="true" class="word-tile ${selectedTile===id?'selected':''}" data-tile="${id}">${esc(lexicon.find(w=>w.id===id)?.forms[0]??id)}${guessFor(id)?`<small>${esc(guessFor(id))}</small>`:''}</button>`).join('')}</div><div class="matching-foot">◉ → ◇</div>`}`;
  $('#back-pages').onclick=()=>{pageId=undefined;if(situated)openJournal('pages');else renderPages();};
  if(done) return;
  document.querySelectorAll<HTMLElement>('[data-tile]').forEach(tile=>{
    tile.onclick=()=>{selectedTile=tile.dataset.tile!;document.querySelectorAll('[data-tile]').forEach(t=>t.classList.toggle('selected',t===tile));};
    tile.ondragstart=e=>{selectedTile=tile.dataset.tile!;e.dataTransfer?.setData('text/plain',selectedTile);};
  });
  document.querySelectorAll<HTMLElement>('[data-slot]').forEach(slot=>{
    const assign=(word:string)=>{if(![...p.words,...(p.distractors??[])].includes(word)) return;const previous=Object.entries(assignments).find(([s,w])=>w===word&&s!==slot.dataset.slot); if(previous) delete assignments[previous[0]];assignments[slot.dataset.slot!]=word; const result=confirmPage(state,p,assignments,loaded.get(p.zone)!);if(result.confirmed){state=result.state;persist();updateHud();audio.cue('confirm');commitWorldPuzzle();}selectedTile='';openPage(id);};
    slot.onclick=()=>{if(selectedTile)assign(selectedTile);else if(assignments[slot.dataset.slot!]){delete assignments[slot.dataset.slot!];openPage(id);}};
    slot.ondragover=e=>e.preventDefault();slot.ondrop=e=>{e.preventDefault();assign(e.dataTransfer?.getData('text/plain')??selectedTile);};
  });
}
function renderWords(): void {
  const observed=[...loaded.values()].flatMap(z=>z.evidence.filter(e=>state.encountered.includes(e.id)));observed.forEach(e=>{french(e.text);if(zone.design!=='situated')french(e.title);});
  const encounteredIds=new Set([...loaded.values()].flatMap(z=>z.evidence.filter(e=>state.encountered.includes(e.id)).flatMap(e=>e.words)));
  $('#journal-body').innerHTML=`<div class="word-filters"><input data-testid="journal-search" type="search" id="word-search" placeholder="⌕" aria-label="Rechercher"><select id="zone-filter" aria-label="Lieu"><option value="all">Tous les lieux</option>${[...loaded.values()].map(z=>`<option value="${z.id}">${esc(z.title)}</option>`).join('')}</select></div><div id="vocabulary-list"></div>`;
  $<HTMLSelectElement>('#zone-filter').value=journalFilter;
  const fill=()=>{const q=$<HTMLInputElement>('#word-search').value.toLocaleLowerCase('fr');journalFilter=$<HTMLSelectElement>('#zone-filter').value;$('#vocabulary-list').innerHTML=[...lexicon,...[...surfaceWords.values()].filter(w=>observed.some(e=>(zone.design==='situated'?e.text:e.title+' '+e.text).toLocaleLowerCase('fr').includes(w.lemma.toLocaleLowerCase('fr'))))].filter(w=>(encounteredIds.has(w.id)||w.id.startsWith('@'))&&(journalFilter==='all'||w.zone===journalFilter)&&[w.lemma,...w.forms,guessFor(w.id)??''].some(s=>s.toLocaleLowerCase('fr').includes(q))).map(w=>`<button class="vocabulary-row" data-word="${w.id}"><strong>${esc(w.forms.find(form=>observed.some(e=>frenchFormOccurs(e.text,form)))??w.forms[0])}</strong><span>${esc(guessFor(w.id)??'…')}</span><small>↗</small></button>`).join('');bindWords($('#vocabulary-list'));};
  $('#word-search').oninput=fill;$('#zone-filter').onchange=fill;fill();
}
function openPuzzle(): void {
  if(zone.design==='situated'){const clue=zone.puzzle.world?.clues[0];if(state.solved.includes(zone.puzzle.id)&&zone.puzzle.world?.exit)world.focusEntity(zone.puzzle.world.exit);else if(clue)inspect(clue);return;}
  const p=zone.puzzle;const done=state.solved.includes(p.id);const ready=p.requiredPages.every(id=>state.confirmed.includes(id));
  openOverlay(shell(esc(p.title),done?`<div class="success-art">${mark}</div><p class="success-text">${french(p.success)}</p><button id="next-zone" class="primary">${zone.id==='lettres'?'Le fil des mots':'Continuer'} <span>→</span></button>`:`<div class="mechanism-intro-art">${pictureSvg(p.steps[0].picture)}</div><p class="puzzle-instruction">${french(p.instruction)}</p>${!ready?'<div class="locked-notice">▤ → ◇</div><button id="puzzle-journal" class="primary">Le carnet <span>↗</span></button>':'<button id="begin-mechanism" class="primary">→</button>'}`,zone.title,'puzzle-panel'),'puzzle-overlay');
  bindWords();
  const begin=$('#begin-mechanism');if(begin)begin.onclick=()=>{mechanismStep=0;closeOverlay();renderMechanism();};
  const journal=$('#puzzle-journal');if(journal)journal.onclick=()=>openJournal();
  const next=$('#next-zone');if(next)next.onclick=async()=>{const id=zoneIds[zoneIds.indexOf(zone.id)+1];if(id){await changeZone(id);toast(zone.intro);}else openEnding();};
}
function renderMechanism():void {
  $('#mechanism')?.remove();if(mechanismStep===undefined)return;
  const step=zone.puzzle.steps[mechanismStep];world.setMechanism(zone.puzzle,mechanismStep,puzzleAnswers);
  const el=document.createElement('section');el.id='mechanism';el.innerHTML=`<div class="mechanism-prompt"><div class="eyebrow">${esc(zone.puzzle.title)} · ${mechanismStep+1} / ${zone.puzzle.steps.length}</div><p>${french(step.prompt)}</p></div><div class="mechanism-sequence">${zone.puzzle.steps.map((_,i)=>`<button data-step="${i}" class="${i===mechanismStep?'current':''}"><span>${String(i+1).padStart(2,'0')}</span><strong>${puzzleAnswers[i]?esc(puzzleAnswers[i]):'◇'}</strong></button>`).join('')}<button id="apply-mechanism" aria-label="Appliquer" ${puzzleAnswers.filter(Boolean).length!==zone.puzzle.steps.length?'disabled':''}>↗</button><button id="leave-mechanism" aria-label="Fermer">×</button></div>`;
  $('#hud').append(el);bindWords(el);
  el.querySelectorAll<HTMLElement>('[data-step]').forEach(b=>b.onclick=()=>{mechanismStep=Number(b.dataset.step);renderMechanism();});
  $('#leave-mechanism').onclick=()=>{mechanismStep=undefined;el.remove();world.clearMechanism();updateHud();};
  $('#apply-mechanism').onclick=()=>{const result=solvePuzzle(state,zone.puzzle,puzzleAnswers);if(result.solved){state=result.state;persist();audio.cue('confirm');mechanismStep=undefined;el.remove();world.clearMechanism();openPuzzle();}};
}
function openEnding(): void {
  openOverlay(shell('Le fil retrouvé',`<div class="ending-art">${mark}</div><p class="ending-line">Une lettre. Six lieux.<br>Et maintenant, vos mots.</p><p class="ending-count">${state.confirmed.length} ◇ · ${Object.keys(state.guesses).length} ✎</p><button id="ending-route" class="primary">Les lieux <span>→</span></button>`,'BABELWAKE','ending-panel'));$('#ending-route').onclick=openRoute;
}
function openRoute(): void {
  openOverlay(shell('Les lieux',`<div class="route-list">${zoneOrder.map((id,i)=>{const z=loaded.get(id);const previous=loaded.get(zoneOrder[i-1]);const unlocked=zoneIds.includes(id)&&(i===0||id===state.zone||!!previous&&puzzleCompletedForTravel(state,previous.puzzle));return `<button class="route-item" data-route="${id}" ${!unlocked?'disabled':''}><span>${String(i+1).padStart(2,'0')}</span><strong>${esc(z?.title??['L’atelier','Le marché','Le café','La gare','La maison','Les lettres'][i])}</strong><small>${state.solved.includes(z?.puzzle.id??'')?'✓':unlocked?'↗':'◌'}</small></button>`;}).join('')}</div>`, 'LE FIL DES MOTS','route-panel'));
  document.querySelectorAll<HTMLElement>('[data-route]').forEach(b=>b.onclick=()=>void changeZone(b.dataset.route as ZoneId));
}
function openMenu(): void {
  openOverlay(shell('A moment of quiet',`<div class="menu-list"><button id="resume">${playing?'Resume journey':'Back'} <span>↗</span></button>${zone.design==='situated'?'<button id="reset-attempt">Reset objects <span>↺</span></button>':''}<button id="settings" data-testid="settings-toggle">Settings <span>↗</span></button><button id="export">Export save <span>↓</span></button><label class="import-button">Import save <span>↑</span><input id="import" type="file" accept="application/json,.json" hidden></label><button id="help-menu">How to play <span>↗</span></button><button id="credits-menu">Credits <span>↗</span></button></div><p class="menu-foot">Your journey is saved on this device.</p>`,'BABELWAKE','menu-panel'),'menu-overlay');
  const reset=$('#reset-attempt');if(reset)reset.onclick=()=>{interactions=initialInteractions(zone);world.setInteractionState(interactions);world.clearFocus();closeOverlay();renderPhysicalControls();};
  $('#resume').onclick=closeOverlay;$('#settings').onclick=openSettings;$('#help-menu').onclick=openHelp;$('#credits-menu').onclick=openCredits;
  $('#export').onclick=()=>{const url=URL.createObjectURL(new Blob([exportSave(state)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='babelwake.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  $('#import').onchange=async()=>{const file=$<HTMLInputElement>('#import').files?.[0];if(!file)return;try{state=importSave(await file.text());await hydrate();applySettings();playing=true;$('#title-screen').hidden=true;$('#hud').hidden=false;await changeZone(state.zone);toast('✓');}catch{toast('This file is not a valid Babelwake save.');}};
}
function openHelp(): void {
  openOverlay(shell('Find your own words',`<div class="help-list"><div><span>01</span><p>Stroll with WASD, the arrow keys, or select a path to walk there. Select an object, a person, or a sign to look closely. Inspecting brings the camera closer. People speak above their heads; select their … button to continue the conversation, including while holding something. E interacts with the closest object; Shift+E talks to a nearby person.</p></div><div><span>02</span><p>Look at the pictures and what is happening. Select a French word and write your own guess, in any language. Your notes follow the word.</p></div><div><span>03</span><p>Open your journal with J. A page becomes available after you have seen each word in three distinct scenes. Drag the words onto the pictures, or select a word and then a picture. A whole correct page seals itself.</p></div><div><span>04</span><p>Use what you understand to open the way onward. Look closely at a portable object, then select it again to hold it. Select a container, mechanism, or person to place, use, or deliver it. The whole arrangement is checked together; you can move things again or reset the objects in this place with ↺. There is no clock and no penalty.</p></div></div><button id="help-close" class="primary">Ready to explore <span>↗</span></button>`,'HOW TO PLAY','help-panel'),'menu-overlay');$('#help-close').onclick=closeOverlay;
}
function openCredits(): void {openOverlay(shell('Made of small discoveries',`<div class="credits-copy"><p><strong>BABELWAKE</strong><br>Le fil des mots</p><p>A browser game about observation, language, and the connections we make.</p><p>Built with TypeScript, Three.js & Web Audio.<br>Original procedural scenery and SVG illustrations.<br>Inspired by the discovery-led language play of Chants of Sennaar.</p><p>French text awaits independent native-speaker review. See content/REVIEW.md in the source.</p><p>No accounts. No analytics. Your notes stay on your device.</p></div>`,'CREDITS','menu-panel'),'menu-overlay');}
function openSettings(): void {
  openOverlay(shell('Make yourself at home',`<div class="settings-list"><label>Text size <input data-testid="settings-text-size" id="text-size" type="range" min="0.85" max="1.6" step="0.05" value="${state.settings.textSize}"></label><label>High contrast <input id="contrast" type="checkbox" ${state.settings.contrast?'checked':''}></label><label>Sound <input id="volume" type="range" min="0" max="1" step="0.05" value="${state.settings.volume}"></label><div class="eyebrow">KEYBOARD · SELECT A KEY TO REMAP</div>${Object.entries(state.settings.controls).map(([action,key])=>`<label>${esc(action)}<button class="key-binding" data-control="${action}">${esc(key)}</button></label>`).join('')}<p>Gamepad: left stick moves, A interacts, X talks, Y opens the journal, B pauses. Select a path to stroll there, or select an object to look closely.</p></div>`,'SETTINGS','menu-panel'),'menu-overlay');
  $('#text-size').oninput=()=>{state.settings.textSize=Number($<HTMLInputElement>('#text-size').value);applySettings();persist();};$('#contrast').onchange=()=>{state.settings.contrast=$<HTMLInputElement>('#contrast').checked;applySettings();persist();};$('#volume').oninput=()=>{state.settings.volume=Number($<HTMLInputElement>('#volume').value);applySettings();persist();};
  document.querySelectorAll<HTMLElement>('[data-control]').forEach(button=>button.onclick=()=>{button.textContent='Press a key…';button.onkeydown=e=>{e.preventDefault();e.stopPropagation();if(e.code==='Escape'){button.textContent=state.settings.controls[button.dataset.control!];button.onkeydown=null;return;}const other=Object.keys(state.settings.controls).find(k=>state.settings.controls[k]===e.code&&k!==button.dataset.control);if(other)state.settings.controls[other]=state.settings.controls[button.dataset.control!];state.settings.controls[button.dataset.control!]=e.code;applySettings();updateHud();persist();openSettings();};});
}
async function hydrate():Promise<void> {for(const id of zoneIds){if(id===state.zone||state.confirmed.some(p=>p.startsWith(id))||zoneOrder.indexOf(id)<=zoneOrder.indexOf(state.zone)){if(!loaded.has(id))loaded.set(id,await loadZone(id));}}}
$('#start').onclick=async()=>{playing=true;$('#title-screen').hidden=true;$('#hud').hidden=false;await audio.start();await changeZone(state.zone);if(zone.design!=='situated'&&zone.intro)toast(zone.intro);};
$('#how').onclick=openHelp;$('#credits').onclick=openCredits;$('#menu').onclick=openMenu;$('#journal').onclick=()=>openJournal();$('#puzzle').onclick=openPuzzle;$('#route').onclick=openRoute;
$('#sound').onclick=()=>{state.settings.volume=state.settings.volume?0:0.35;applySettings();persist();$('#sound').classList.toggle('muted',!state.settings.volume);};
document.addEventListener('keydown',e=>{
  if(playing&&zone.design==='situated'&&$('#overlay').hidden&&e.shiftKey&&e.code===state.settings.controls.interact){e.preventDefault();e.stopPropagation();talkNearest();return;}
  if(e.code==='Escape') {if($('#word-entry')){$('#word-entry').remove();if(!$('#overlay').querySelector('.panel'))closeOverlay();return;} if(!$('#overlay').hidden){closeOverlay();return;}if(playing&&world.getViewState().focused){world.clearFocus();return;}if(playing)openMenu();return;}
  if(e.code==='Tab'&&!$('#overlay').hidden){const items=[...$('#overlay').querySelectorAll<HTMLElement>('button:not(:disabled),input,textarea,select,a[href]')].filter(el=>el.offsetParent!==null);if(items.length){const i=items.indexOf(document.activeElement as HTMLElement);if(i<0||(e.shiftKey&&i===0)||(!e.shiftKey&&i===items.length-1)){e.preventDefault();items[e.shiftKey?items.length-1:0].focus();}}}
  if((e.target as HTMLElement).matches('input,textarea,select')||!playing)return;
  if(e.code===state.settings.controls.journal){e.preventDefault();if($('#overlay').hidden)openJournal();else closeOverlay();}
});
let previousPadButtons:boolean[]=[];let padMovedAt=0;
function gamepadUi():void {
  const pad=navigator.getGamepads?.()[0];
  if(pad){
    [3,1,9,0,2].forEach((b,i)=>{const pressed=pad.buttons[b]?.pressed??false;if(pressed&&!previousPadButtons[i]){
      if(i===4&&playing&&$('#overlay').hidden)talkNearest();
      else if(i===0&&playing)openJournal();
      else if(i===1||i===2){if($('#overlay').hidden){if(playing)openMenu();}else closeOverlay();}
      else if(i===3&&!$('#overlay').hidden)(document.activeElement as HTMLElement)?.click();
      else if(i===3&&!playing)$<HTMLButtonElement>('#start').click();
    }previousPadButtons[i]=pressed;});
    if(!$('#overlay').hidden){const direction=pad.buttons[13]?.pressed||pad.buttons[15]?.pressed||pad.axes[1]>.6||pad.axes[0]>.6?1:pad.buttons[12]?.pressed||pad.buttons[14]?.pressed||pad.axes[1]<-.6||pad.axes[0]<-.6?-1:0;
      if(direction&&performance.now()-padMovedAt>230){padMovedAt=performance.now();const items=[...$('#overlay').querySelectorAll<HTMLElement>('button:not(:disabled),input,textarea,select')].filter(el=>el.offsetParent!==null);if(items.length){const i=items.indexOf(document.activeElement as HTMLElement);items[(i+direction+items.length)%items.length].focus();}}
    }
  }requestAnimationFrame(gamepadUi);
}gamepadUi();
try{state=await loadGame()??initialState();}catch{state=initialState();toast('Your saved file could not be read. You can import a backup from the menu.');}
await hydrate();zone=loaded.get(state.zone)??await loadZone(state.zone);loaded.set(zone.id,zone);world.setZone(zone,new Set(state.encountered));interactions=zone.design==='situated'?initialInteractions(zone):undefined;if(interactions)world.setInteractionState(interactions);world.setPaused(true);applySettings();updateHud();
$<HTMLButtonElement>('#start').disabled=false;
if(state.encountered.length)$<HTMLButtonElement>('#start').innerHTML='Continue your journey <span>↗</span>';
if('serviceWorker' in navigator && import.meta.env.PROD){const register=()=>{void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(()=>{});};if(document.readyState==='complete')register();else window.addEventListener('load',register,{once:true});}
if(new URLSearchParams(location.search).get('debug')==='1'){
  const debug = {
    getState:()=>structuredClone(state), view:()=>world.getViewState(), content:()=>loadContent(),
    loadZone:async(id:ZoneId)=>{const i=zoneOrder.indexOf(id);if(i<0||!zoneIds.includes(id))throw Error('Unknown zone');if(i>0){const prev=loaded.get(zoneOrder[i-1])??await loadZone(zoneOrder[i-1]);if(!puzzleCompletedForTravel(state,prev.puzzle))throw Error('Locked zone');}await changeZone(id);},
    encounter:(id:string)=>{if(!zone.evidence.some(e=>e.id===id))throw Error('Unknown evidence');inspect(id);},
    annotate:(id:string,guess:string)=>{state=annotate(state,canonicalId(id),guess);persist();updateHud();},
    confirm:(id:string,a:Record<string,string>)=>{const page=zone.pages.find(p=>p.id===id);if(!page)throw Error('Unknown page');const result=confirmPage(state,page,a,zone);state=result.state;if(result.confirmed){persist();updateHud();commitWorldPuzzle();}return result.confirmed;},
    solve:(answers:string[])=>{const result=solvePuzzle(state,zone.puzzle,answers);state=result.state;if(result.solved)persist();return result.solved;},
    interactions:()=>interactions?structuredClone(interactions):undefined,
    physicalState:()=>world.physicalState(),
    actions:()=>interactions?availableActions(zone,interactions):[],
    act:(action:WorldAction)=>performWorldAction(action),
    commit:()=>commitWorldPuzzle(),
    interact:(id:string)=>interactEntity(id),
  };Object.assign(window,{__BABELWAKE__:debug});
}
