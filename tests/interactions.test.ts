import { describe, expect, it } from 'vitest';
import type { Evidence, WorldAction, Zone } from '../src/content/types';
import { actionKey, applyWorldAction, availableActions, initialInteractions, initialSpeech, naiveActionAudit, tokenOverlap, validateWorldSequence, visibleActionLabel, type InteractionState } from '../src/game/interactions';
const take = (object: string): WorldAction => ({ kind: 'take', object });
const open = (object: string, tool?: string): WorldAction => ({ kind: 'operate', object, operation: 'open', ...(tool ? { tool } : {}) });
const place = (object: string, target: string): WorldAction => ({ kind: 'place', object, target, relation: 'in' });
const deliver = (target: string): WorldAction => ({ kind: 'deliver', object: 'letter', target });
const sequence: WorldAction[] = [take('yellow'), open('large', 'yellow'), take('book'), place('book', 'red-box'), take('letter'), deliver('claire')];
const texts = ['La clé rouge ? Non.', 'La petite porte ? Non.', 'La lettre attend.', 'La boîte verte ? Non.', 'Le livre bleu attend.', 'Donne la lettre à elle.'];
const evidence: Evidence[] = texts.map((text, i) => ({ id: `clue-${i}`, title: `internal-${i}`, text, words: [], picture: { kind: 'person' }, position: [0, 0], kind: i === 5 ? 'person' : 'sign', surface: i === 5 ? 'speech' : 'sign', ...(i === 5 ? { anchor: 'paul' } : {}) }));
const zone: Zone = {
  id: 'atelier', design: 'situated', title: 'L’atelier', subtitle: '', color: '', accent: '', intro: '',
  evidence, encounterOrder: evidence.map(e => e.id), pages: [],
  scene: [
    { id: 'yellow', kind: 'key', label: 'La clé jaune', portable: true, position: [0, 0] },
    { id: 'red', kind: 'key', label: 'La clé rouge', portable: true, position: [1, 0] },
    { id: 'large', kind: 'door', label: 'La grande porte', operations: ['open', 'close'], toolKind: 'key', position: [0, 1] },
    { id: 'small', kind: 'door', label: 'La petite porte', operations: ['open', 'close'], toolKind: 'key', position: [1, 1] },
    { id: 'book', kind: 'book', label: 'Le livre bleu', portable: true, placement: { target: 'table', relation: 'on', offset: [-0.6, 0, 0] }, position: [0, 2] },
    { id: 'letter', kind: 'letter', label: 'La lettre', portable: true, placement: { target: 'table', relation: 'on' }, position: [1, 2] },
    { id: 'red-box', kind: 'box', label: 'La boîte rouge', container: true, open: true, operations: ['open', 'close'], accepts: ['in'], position: [0, 3] },
    { id: 'green-box', kind: 'box', label: 'La boîte verte', container: true, open: true, operations: ['open', 'close'], accepts: ['in'], position: [1, 3] },
    { id: 'table', kind: 'table', label: 'La table', accepts: ['on'], position: [0, 4] },
    { id: 'claire', kind: 'person', label: 'Claire', recipient: true, position: [1, 4] },
    { id: 'paul', kind: 'person', label: 'Paul', recipient: true, position: [0, 5] },
  ],
  puzzle: { id: 'world', title: 'Le passage', instruction: '', requiredPages: [], steps: [], world: { sequence, clues: evidence.map(e => e.id), exit: 'large' }, success: '' },
};
const run = (actions: WorldAction[], state: InteractionState = initialInteractions(zone), content = zone) => actions.reduce((previous, action) => applyWorldAction(content, previous, action), state);
describe('physical actions without per-step correctness', () => {
  it('initializes authored placements, open states and NPC-held demonstrations', () => {
    const content: Zone = { ...zone, scene: [...zone.scene!, { id: 'demo-key', kind: 'key', position: [0, 0] }, { id: 'actor', kind: 'person', position: [0, 0], pose: { holds: 'demo-key' } }] };
    const state = initialInteractions(content);
    expect(state.placements.book).toEqual({ target: 'table', relation: 'on' });
    expect(state.placements['demo-key']).toEqual({ target: 'actor', relation: 'on' });
    expect(state.opened).toEqual(['red-box', 'green-box']);
    expect(state.history).toEqual([]);
  });
  it('accepts any key color in any compatible door and leaves the tool in its lock', () => {
    const before = initialInteractions(zone);
    const next = run([take('red'), open('small', 'red')], before);
    expect(next.opened).toContain('small');
    expect(next.placements.red).toEqual({ target: 'small', relation: 'in' });
    expect(next.held).toBeNull();
    expect(next.history).toHaveLength(2);
    expect(before.history).toEqual([]);
    expect(Object.keys(next).sort()).toEqual(['held', 'placements', 'opened', 'delivered', 'combined', 'history'].sort());
    expect(validateWorldSequence(zone.puzzle, next)).toBe(false);
  });
  it('derives affordances from physical capabilities, never from expected answers or confirmed pages', () => {
    const other: Zone = { ...zone, puzzle: { ...zone.puzzle, requiredPages: ['unconfirmed'], world: { sequence: [take('red')], clues: [] } } };
    const state = initialInteractions(zone);
    expect(availableActions(other, state)).toEqual(availableActions(zone, state));
    expect(applyWorldAction(other, state, take('red'))).toEqual(applyWorldAction(zone, state, take('red')));
  });
  it('requires a compatible physical tool and a free hand, without checking key/door solution IDs', () => {
    const state = initialInteractions(zone);
    expect(applyWorldAction(zone, state, open('large'))).toBe(state);
    const bookHeld = run([take('book')]);
    expect(applyWorldAction(zone, bookHeld, open('large', 'book'))).toBe(bookHeld);
    expect(applyWorldAction(zone, bookHeld, take('yellow'))).toBe(bookHeld);
    expect(availableActions(zone, run([take('red')]))).toContainEqual(open('large', 'red'));
  });
  it('opens ordinary containers without consuming the held book as a tool', () => {
    const held = run([take('book')]);
    expect(availableActions(zone, held)).toContainEqual(open('green-box'));
    expect(availableActions(zone, held)).not.toContainEqual(open('green-box', 'book'));
    const opened = applyWorldAction(zone, held, open('green-box'));
    expect(opened.held).toBe('book');
    expect(opened.placements.book).toBeUndefined();
    expect(applyWorldAction(zone, opened, place('book', 'green-box')).held).toBeNull();
  });
  it('blocks inaccessible contents and self-containing placement cycles', () => {
    let state = run([take('book'), place('book', 'red-box'), { kind: 'operate', object: 'red-box', operation: 'close' }]);
    expect(availableActions(zone, state)).not.toContainEqual(take('book'));
    state = applyWorldAction(zone, state, open('red-box'));
    expect(availableActions(zone, state)).toContainEqual(take('book'));
    const content: Zone = { ...zone, scene: ['a', 'b'].map(id => ({ id, kind: 'box', position: [0, 0], container: true, open: true, portable: true })) };
    const nested = run([take('a'), place('a', 'b'), take('b')], initialInteractions(content), content);
    expect(availableActions(content, nested)).not.toContainEqual(place('b', 'a'));
  });
  it('combines portable objects as a movable bundle and can separate it again', () => {
    const state = run([take('book'), { kind: 'combine', object: 'book', target: 'letter' }]);
    expect(state.combined).toEqual([['book', 'letter']]);
    expect(state.placements.letter).toEqual({ target: 'book', relation: 'on' });
    const separated = run([{ kind: 'place', object: 'book', target: 'table', relation: 'on' }, take('letter')], state);
    expect(separated.held).toBe('letter');
    expect(separated.combined).toEqual([]);
  });
});
describe('whole-attempt commits with reversible exploration', () => {
  it('never validates incomplete attempts and validates all final dependencies together', () => {
    for (let count = 0; count < sequence.length; count++) expect(validateWorldSequence(zone.puzzle, run(sequence.slice(0, count)))).toBe(false);
    expect(validateWorldSequence(zone.puzzle, run(sequence))).toBe(true);
  });
  it('allows independent chores in a different order', () => {
    const reordered = [...sequence.slice(4), ...sequence.slice(2, 4), ...sequence.slice(0, 2)];
    expect(validateWorldSequence(zone.puzzle, run(reordered))).toBe(true);
  });
  it('accepts exploration, mistaken placements and correction without resetting', () => {
    const actions = [take('red'), { kind: 'place', object: 'red', target: 'table', relation: 'on' } as WorldAction, ...sequence.slice(0, 3), place('book', 'green-box'), take('book'), ...sequence.slice(3)];
    const state = run(actions);
    expect(state.history.length).toBeGreaterThan(sequence.length);
    expect(validateWorldSequence(zone.puzzle, state)).toBe(true);
    expect(validateWorldSequence(zone.puzzle, run([take('book'), place('book', 'green-box')], run(sequence)))).toBe(false);
  });
  it('lets the player recover a letter delivered to the wrong person', () => {
    const wrong = run([...sequence.slice(0, 5), deliver('paul')]);
    expect(validateWorldSequence(zone.puzzle, wrong)).toBe(false);
    expect(availableActions(zone, wrong)).toContainEqual(take('letter'));
    const corrected = run([take('letter'), deliver('claire')], wrong);
    expect(corrected.delivered.letter).toBe('claire');
    expect(validateWorldSequence(zone.puzzle, corrected)).toBe(true);
  });
  it('allows retrieving and putting away the used key without adding an unstated storage goal', () => {
    const putKeyAway: WorldAction[] = [take('yellow'), { kind: 'place', object: 'yellow', target: 'table', relation: 'on' }];
    const attempts = [
      [...sequence, ...putKeyAway],
      [...sequence.slice(0, 2), ...putKeyAway, ...sequence.slice(2)],
    ];
    for (const attempt of attempts) {
      const state = run(attempt);
      expect(state.placements.yellow).toEqual({ target: 'table', relation: 'on' });
      expect(state.opened).toContain('large');
      expect(validateWorldSequence(zone.puzzle, state)).toBe(true);
    }
  });
  it('requires the door to stay open with the correct last tool, not just a past success', () => {
    const solved = run(sequence);
    const closed = run([take('yellow'), { kind: 'operate', object: 'large', operation: 'close', tool: 'yellow' }], solved);
    expect(closed.opened).not.toContain('large');
    expect(validateWorldSequence(zone.puzzle, closed)).toBe(false);
    const wrong = run([take('red'), open('large', 'red')], solved);
    expect(validateWorldSequence(zone.puzzle, wrong)).toBe(false);
    const corrected = run([take('yellow'), open('large', 'yellow')], wrong);
    expect(validateWorldSequence(zone.puzzle, corrected)).toBe(true);
  });
});
describe('literal visible-object overlap audit', () => {
  it('ranks chosen targets, excludes shared held objects/tools, and never reveals opaque IDs', () => {
    expect(visibleActionLabel(zone, open('large', 'yellow'))).toBe('La grande porte');
    expect(visibleActionLabel(zone, place('book', 'red-box'))).toBe('La boîte rouge');
    expect(visibleActionLabel(zone, { kind: 'take', object: 'nonexistent-La-clé-jaune' })).toBe('');
    expect(tokenOverlap('La clé jaune jaune', 'La clé rouge jaune')).toBe(3);
  });
  it('includes only the currently selected NPC utterance', () => {
    const content: Zone = { ...zone, evidence: [...zone.evidence, { ...evidence[5], id: 'paul-next', text: 'Je suis Paul.' }] };
    expect(initialSpeech(content).paul).toBe('Donne la lettre à elle.');
    expect(visibleActionLabel(content, deliver('paul'))).not.toContain('Je suis Paul');
    expect(visibleActionLabel(content, deliver('paul'), { paul: 'Je suis Paul.' })).toBe('Paul Je suis Paul.');
  });
  it('rejects token matching at every physical step using all highest-scoring candidates', () => {
    const audit = naiveActionAudit(zone);
    expect(audit.passes).toBe(true);
    expect(audit.steps).toHaveLength(sequence.length);
    expect(audit.steps.every(step => step.applicable && step.fails && step.expectedScore < step.maxScore)).toBe(true);
    expect(audit.steps[5].winners).toContainEqual(deliver('paul'));
  });
  it('does not count ties or ordering of opaque IDs as a solver failure', () => {
    const content: Zone = { ...zone, scene: zone.scene!.map(object => ({ ...object, label: 'objet', labels: [] })), evidence: zone.evidence.map(item => ({ ...item, surface: 'sign', anchor: undefined })) };
    const audit = naiveActionAudit(content);
    expect(audit.passes).toBe(false);
    expect(audit.steps[0].winners.map(actionKey)).toContain(actionKey(sequence[0]));
    expect(audit.steps[0].fails).toBe(false);
    expect(naiveActionAudit({ ...content, scene: [...content.scene!].reverse() }).steps[0].fails).toBe(false);
  });
});
