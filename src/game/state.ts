import {lexicon} from '../content/lexicon';
import {representativeFormOccurs} from '../content/forms';
import type { JournalPage, Lexeme, Puzzle, Zone, ZoneId } from '../content/types';

export interface Settings {
  textSize: number;
  contrast: boolean;
  volume: number;
  controls: Record<string, string>;
}
export interface GameState {
  version: 1;
  zone: ZoneId;
  encountered: string[];
  guesses: Record<string, string>;
  confirmed: string[];
  solved: string[];
  notes: string;
  settings: Settings;
}
export const zoneOrder: ZoneId[] = ['atelier', 'marche', 'cafe', 'gare', 'maison', 'lettres'];
export function initialState(): GameState {
  return {
    version: 1, zone: 'atelier', encountered: [], guesses: {}, confirmed: [], solved: [], notes: '',
    settings: { textSize: 1, contrast: false, volume: 0.35, controls: { forward: 'KeyW', back: 'KeyS', left: 'KeyA', right: 'KeyD', interact: 'KeyE', journal: 'KeyJ' } },
  };
}
export function encounter(state: GameState, evidenceId: string): GameState {
  return state.encountered.includes(evidenceId) ? state : { ...state, encountered: [...state.encountered, evidenceId] };
}
export function encounteredWords(state: GameState, zones: Zone[]): Set<string> {
  const ids = new Set(state.encountered);
  return new Set(zones.flatMap(zone => zone.evidence.filter(e => ids.has(e.id)).flatMap(e => e.words)));
}
export function pageAvailable(state: GameState, page: JournalPage, zone: Zone): boolean {
  const ids = new Set(state.encountered);
  return [...page.words,...(page.distractors ?? [])].every(word => zone.evidence.filter(e => ids.has(e.id) && e.words.includes(word) && (!lexicon.find(w=>w.id===word)||representativeFormOccurs(lexicon.find(w=>w.id===word)!,e.title+' '+e.text))).length >= 3);
}
export function annotate(state: GameState, lemmaId: string, guess: string): GameState {
  if (!lemmaId || ['__proto__', 'constructor', 'prototype'].includes(lemmaId)) return state;
  return { ...state, guesses: { ...state.guesses, [lemmaId]: guess.slice(0, 200) } };
}
export function confirmPage(state: GameState, page: JournalPage, assignments: Record<string, string>, zone: Zone): { state: GameState; confirmed: boolean } {
  if (state.confirmed.includes(page.id)) return { state, confirmed: true };
  const correct = pageAvailable(state, page, zone) && page.slots.length > 0 && page.slots.every(slot => assignments[slot.id] === slot.answer);
  if (!correct) return { state, confirmed: false };
  return { state: { ...state, confirmed: [...state.confirmed, page.id] }, confirmed: true };
}
export function solvePuzzle(state: GameState, puzzle: Puzzle, answers: string[]): { state: GameState; solved: boolean } {
  if (state.solved.includes(puzzle.id)) return { state, solved: true };
  const correct = puzzle.requiredPages.every(id => state.confirmed.includes(id)) && answers.length === puzzle.steps.length && puzzle.steps.length > 0 && puzzle.steps.every((step, i) => answers[i] === step.answer);
  if (!correct) return { state, solved: false };
  return { state: { ...state, solved: [...state.solved, puzzle.id] }, solved: true };
}
export function nextZone(zone: ZoneId): ZoneId | undefined { return zoneOrder[zoneOrder.indexOf(zone) + 1]; }
const normalizeForm = (form: string): string => form.toLocaleLowerCase('fr-FR').trim().replace(/[’‘]/g, "'").replace(/^[.,!?;:«»“”()\s]+|[.,!?;:«»“”()\s]+$/g, '');
/** Accents are significant; elision and typographic apostrophes are normalized. */
export function linkForm(form: string, lexicon: Lexeme[]): Lexeme | undefined {
  const normalized = normalizeForm(form);
  const exact = lexicon.find(word => [word.lemma, ...word.forms].some(f => normalizeForm(f) === normalized));
  if (exact) return exact;
  const elided = normalized.replace(/^(?:l|j|d|n|s|c|m|t|qu)'/, '');
  if (elided !== normalized) return lexicon.find(word => [word.lemma, ...word.forms].some(f => normalizeForm(f) === elided));
  return undefined;
}
