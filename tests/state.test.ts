import { describe, expect, it } from 'vitest';
import type { JournalPage, Lexeme, Zone } from '../src/content/types';
import { annotate, confirmPage, encounter, encounteredWords, initialState, linkForm, pageAvailable, solvePuzzle } from '../src/game/state';
const page: JournalPage = { id: 'objects', title: 'Objets', zone: 'atelier', kind: 'vocabulary', words: ['cle', 'livre', 'boite'], slots: ['cle', 'livre', 'boite'].map(answer => ({ id: `slot-${answer}`, answer, picture: { kind: answer } })) };
const zone: Zone = { id: 'atelier', title: 'L’atelier', subtitle: '', color: '', accent: '', intro: '', evidence: [0, 1, 2].map(i => ({ id: `context-${i}`, title: '', text: 'Une clé, un livre et une boîte.', words: page.words, picture: { kind: 'shelf' }, position: [i, i], kind: 'object' })), pages: [page], puzzle: { id: 'door', title: '', instruction: '', success: '', requiredPages: [page.id], steps: [{ id: 'step1', prompt: '', choices: ['Ouvrez', 'Fermez'], answer: 'Ouvrez', picture: { kind: 'door' } }, { id: 'step2', prompt: '', choices: ['Entrez', 'Sortez'], answer: 'Entrez', picture: { kind: 'door' } }] } };
const seenState = () => zone.evidence.reduce((state, e) => encounter(state, e.id), initialState());
const correct = { 'slot-cle': 'cle', 'slot-livre': 'livre', 'slot-boite': 'boite' };
describe('encounters and journal', () => {
  it('requires three distinct contexts per word, not repeated clicks', () => {
    let state = encounter(initialState(), 'context-0');
    state = encounter(state, 'context-0');
    state = encounter(state, 'context-1');
    expect(state.encountered).toHaveLength(2);
    expect(pageAvailable(state, page, zone)).toBe(false);
    expect(pageAvailable(encounter(state, 'context-2'), page, zone)).toBe(true);
  });
  it('requires encountering distractors before exposing the page', () => {
    const withDistractor = { ...page, distractors: ['autre'] };
    const extended: Zone = { ...zone, evidence: [...zone.evidence, ...[0,1,2].map(i=>({ ...zone.evidence[i], id: `other-${i}`, words: ['autre'] }))] };
    let state = seenState();
    expect(pageAvailable(state, withDistractor, extended)).toBe(false);
    state = encounter(encounter(state,'other-0'),'other-1');
    expect(pageAvailable(state, withDistractor, extended)).toBe(false);
    expect(pageAvailable(encounter(state,'other-2'), withDistractor, extended)).toBe(true);
  });
  it('collects only actually seen word evidence', () => {
    expect([...encounteredWords(initialState(), [zone])]).toEqual([]);
    expect(encounteredWords(encounter(initialState(), 'context-0'), [zone])).toEqual(new Set(page.words));
  });
  it('annotates without translating or mutating prior state', () => {
    const state = initialState();
    const next = annotate(state, 'cle', 'my own guess');
    expect(next.guesses.cle).toBe('my own guess');
    expect(state.guesses).toEqual({});
    expect(annotate(state, '__proto__', 'bad')).toBe(state);
  });
  it('never confirms locked, incomplete, or partly wrong pages', () => {
    const unseen = initialState();
    expect(confirmPage(unseen, page, correct, zone)).toEqual({ state: unseen, confirmed: false });
    const seen = seenState();
    const attempts: Record<string, string>[] = [{}, { 'slot-cle': 'cle' }, { ...correct, 'slot-boite': 'cle' }];
    for (const assignments of attempts) {
      const result = confirmPage(seen, page, assignments, zone);
      expect(result).toEqual({ state: seen, confirmed: false });
      expect(result.state).toBe(seen);
      expect(Object.keys(result)).toEqual(['state', 'confirmed']);
    }
  });
  it('locks the complete correct page and preserves player guesses', () => {
    const seen = annotate(seenState(), 'cle', 'key?');
    const result = confirmPage(seen, page, correct, zone);
    expect(result.confirmed).toBe(true);
    expect(result.state.confirmed).toEqual(['objects']);
    expect(result.state.guesses.cle).toBe('key?');
    expect(confirmPage(result.state, page, {}, zone).state).toBe(result.state);
  });
  it('checks an entire applied sequence without giving partial feedback', () => {
    const state = seenState();
    expect(solvePuzzle(state, zone.puzzle, ['Ouvrez', 'Entrez']).solved).toBe(false);
    const confirmed = confirmPage(state, page, correct, zone).state;
    expect(solvePuzzle(confirmed, zone.puzzle, ['Ouvrez']).solved).toBe(false);
    expect(solvePuzzle(confirmed, zone.puzzle, ['Ouvrez', 'Sortez']).state).toBe(confirmed);
    const result = solvePuzzle(confirmed, zone.puzzle, ['Ouvrez', 'Entrez']);
    expect(result.solved).toBe(true);
    expect(result.state.solved).toEqual(['door']);
  });
});
describe('lemma linking', () => {
  const lexicon: Lexeme[] = [{ id: 'etre', lemma: 'être', forms: ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'], zone: 'atelier' }, { id: 'arbre', lemma: 'arbre', forms: ['arbres'], zone: 'atelier' }, { id: 'avoir', lemma: 'avoir', forms: ['ai', 'as', 'a', 'avons', 'avez', 'ont'], zone: 'atelier' }];
  it('links conjugations to one lemma', () => {
    expect(linkForm('SUIS', lexicon)?.id).toBe('etre');
    expect(linkForm('êtes,', lexicon)?.id).toBe('etre');
    expect(linkForm('sommes', lexicon)?.id).toBe('etre');
  });
  it('handles apostrophes and punctuation while preserving accents', () => {
    expect(linkForm('l’arbre', lexicon)?.id).toBe('arbre');
    expect(linkForm("j’ai", lexicon)?.id).toBe('avoir');
    expect(linkForm('etes', lexicon)).toBeUndefined();
    expect(linkForm('unknown', lexicon)).toBeUndefined();
  });
});
