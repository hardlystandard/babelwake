import type { PlaceRelation, SceneObject, WorldAction, Zone } from '../content/types';

/** Physical state for the current attempt. Persistent progress remains in GameState. */
export interface InteractionState {
  held: string | null;
  placements: Record<string, { target: string; relation: PlaceRelation }>;
  opened: string[];
  delivered: Record<string, string>;
  combined: [string, string][];
  history: WorldAction[];
}

export function initialInteractions(zone: Zone): InteractionState {
  const objects = zone.scene ?? [];
  const placements = Object.fromEntries(objects.flatMap(object => {
    const placement = object.placement ?? (object.containedBy ? { target: object.containedBy, relation: 'in' as const } : undefined);
    return placement ? [[object.id, { target: placement.target, relation: placement.relation }]] : [];
  }));
  for (const actor of objects) {
    if (actor.pose?.holds && !placements[actor.pose.holds]) placements[actor.pose.holds] = { target: actor.id, relation: 'on' };
  }
  return { held: null, placements, opened: objects.filter(object => object.open).map(object => object.id), delivered: {}, combined: [], history: [] };
}

/** Stable physical action identity; independent of property order or solution state. */
export function actionKey(action: WorldAction): string {
  switch (action.kind) {
    case 'take': return JSON.stringify(['take', action.object]);
    case 'place': return JSON.stringify(['place', action.object, action.target, action.relation]);
    case 'combine': return JSON.stringify(['combine', action.object, action.target]);
    case 'operate': return JSON.stringify(['operate', action.object, action.operation, action.tool ?? null]);
    case 'deliver': return JSON.stringify(['deliver', action.object, action.target]);
  }
}

function inside(objectId: string, ancestor: string, state: InteractionState): boolean {
  const visited = new Set<string>();
  let current = objectId;
  while (state.placements[current]) {
    if (visited.has(current)) return true;
    visited.add(current);
    current = state.placements[current].target;
    if (current === ancestor) return true;
  }
  return false;
}

function accessible(object: SceneObject, byId: Map<string, SceneObject>, state: InteractionState): boolean {
  if (state.held === object.id) return false;
  let current = object.id;
  const visited = new Set<string>();
  while (state.placements[current]) {
    if (visited.has(current)) return false;
    visited.add(current);
    const placement = state.placements[current];
    const parent = byId.get(placement.target);
    if (!parent || state.delivered[parent.id] || state.held === parent.id) return false;
    if (placement.relation === 'in' && parent.container && !state.opened.includes(parent.id)) return false;
    current = parent.id;
  }
  return true;
}

/** Enumerates physical affordances. Never reads clues, sequence, pages, or answer IDs. */
export function availableActions(zone: Zone, state: InteractionState): WorldAction[] {
  const objects = zone.scene ?? [];
  const byId = new Map(objects.map(object => [object.id, object]));
  const actions: WorldAction[] = [];
  for (const object of objects) {
    if (!accessible(object, byId, state)) continue;
    if (state.held === null && object.portable) actions.push({ kind: 'take', object: object.id });
    const heldObject = state.held ? byId.get(state.held) : undefined;
    if (!object.toolKind || heldObject?.kind === object.toolKind) {
      for (const operation of object.operations ?? []) {
        // Physical tool class only: every key color can be tried in every key-operated door.
        actions.push({ kind: 'operate', object: object.id, operation, ...(object.toolKind && state.held ? { tool: state.held } : {}) });
      }
    }
    if (state.held === null || !byId.has(state.held) || inside(object.id, state.held, state)) continue;
    const relations = object.accepts ?? (object.container ? ['in' as const] : []);
    for (const relation of relations) {
      if (relation === 'in' && object.container && !state.opened.includes(object.id)) continue;
      actions.push({ kind: 'place', object: state.held, target: object.id, relation });
    }
    if (object.portable && !state.combined.some(pair => pair.includes(object.id) && pair.includes(state.held!))) {
      actions.push({ kind: 'combine', object: state.held, target: object.id });
    }
    if (object.recipient) actions.push({ kind: 'deliver', object: state.held, target: object.id });
  }
  return actions;
}

/** Apply any physically available action, including wrong solutions, without correctness feedback. */
export function applyWorldAction(zone: Zone, state: InteractionState, action: WorldAction): InteractionState {
  const available = availableActions(zone, state).find(candidate => actionKey(candidate) === actionKey(action));
  if (!available) return state;
  const next: InteractionState = {
    held: state.held, placements: { ...state.placements }, opened: [...state.opened],
    delivered: { ...state.delivered }, combined: state.combined.map(pair => [...pair]),
    history: [...state.history, { ...available }],
  };
  switch (available.kind) {
    case 'take':
      next.held = available.object;
      delete next.placements[available.object];
      delete next.delivered[available.object];
      next.combined = next.combined.filter(([, child]) => child !== available.object);
      break;
    case 'place':
      next.held = null;
      next.placements[available.object] = { target: available.target, relation: available.relation };
      break;
    case 'combine':
      next.combined.push([available.object, available.target]);
      next.placements[available.target] = { target: available.object, relation: 'on' };
      break;
    case 'operate':
      if (available.operation === 'open' && !next.opened.includes(available.object)) next.opened.push(available.object);
      if (available.operation === 'close') next.opened = next.opened.filter(id => id !== available.object);
      if (available.tool) {
        // Every tool stays in the operated mechanism; this is generic physical behavior.
        next.placements[available.tool] = { target: available.object, relation: 'in' };
        next.held = null;
      }
      break;
    case 'deliver':
      next.held = null;
      next.delivered[available.object] = available.target;
      delete next.placements[available.object];
      break;
  }
  return next;
}

/** A commit checks complete dependencies and final arrangements, never a prefix. */
export function validateWorldSequence(puzzle: Zone['puzzle'], state: InteractionState): boolean {
  const sequence = puzzle.world?.sequence;
  if (!sequence?.length) return false;
  const remaining = new Map<string, number>();
  for (const action of sequence) remaining.set(actionKey(action), (remaining.get(actionKey(action)) ?? 0) + 1);
  for (const action of state.history) {
    const key = actionKey(action);
    if (remaining.has(key)) remaining.set(key, Math.max(0, remaining.get(key)! - 1));
  }
  if ([...remaining.values()].some(count => count > 0)) return false;
  const placements = new Map<string, { target: string; relation: PlaceRelation }>();
  const delivered = new Map<string, string>();
  const operated = new Map<string, Extract<WorldAction, { kind: 'operate' }>>();
  const combined: [string, string][] = [];
  let held: string | null = null;
  for (const action of sequence) {
    switch (action.kind) {
      case 'take': placements.delete(action.object); delivered.delete(action.object); held = action.object; break;
      case 'place': placements.set(action.object, { target: action.target, relation: action.relation }); held = null; break;
      case 'combine': combined.push([action.object, action.target]); placements.set(action.target, { target: action.object, relation: 'on' }); break;
      case 'operate':
        operated.set(action.object, action);
        // Using a tool is not an instruction to store it permanently in the mechanism.
        if (action.tool) held = null;
        break;
      case 'deliver': delivered.set(action.object, action.target); placements.delete(action.object); held = null; break;
    }
  }
  if (held && state.held !== held) return false;
  for (const [object, placement] of placements) {
    if (state.placements[object]?.target !== placement.target || state.placements[object]?.relation !== placement.relation || state.held === object || state.delivered[object]) return false;
  }
  for (const [object, recipient] of delivered) if (state.delivered[object] !== recipient) return false;
  for (const [object, expected] of operated) {
    const last = [...state.history].reverse().find(action => action.kind === 'operate' && action.object === object);
    if (!last || actionKey(last) !== actionKey(expected)) return false;
    if (expected.operation === 'open' && !state.opened.includes(object)) return false;
    if (expected.operation === 'close' && state.opened.includes(object)) return false;
  }
  return combined.every(([object, target]) => state.combined.some(pair => pair[0] === object && pair[1] === target));
}

export type CurrentSpeech = Readonly<Record<string, string>>;
export function initialSpeech(zone: Zone): Record<string, string> {
  const speech: Record<string, string> = {};
  for (const evidence of zone.evidence) if (evidence.surface === 'speech' && evidence.anchor && !(evidence.anchor in speech)) speech[evidence.anchor] = evidence.text;
  return speech;
}

/** Actual chosen-object text. The shared held item/tool is not the candidate being ranked. */
export function visibleActionLabel(zone: Zone, action: WorldAction, speech: CurrentSpeech = initialSpeech(zone)): string {
  const id = 'target' in action ? action.target : action.object;
  const object = zone.scene?.find(candidate => candidate.id === id);
  if (!object) return '';
  return [object.label, ...(object.labels ?? []).map(label => label.text), speech[id]].filter((text): text is string => !!text).join(' ');
}

/** Distinct literal French word overlap; repetition cannot inflate the score. */
export function tokenOverlap(prompt: string, label: string): number {
  const tokens = (text: string) => new Set(text.normalize('NFC').toLocaleLowerCase('fr').match(/[\p{L}\p{N}]+/gu) ?? []);
  const candidates = tokens(label);
  return [...tokens(prompt)].filter(token => candidates.has(token)).length;
}
export interface NaiveActionStep {
  index: number;
  clue: string;
  expected: WorldAction;
  applicable: boolean;
  expectedScore: number;
  maxScore: number;
  winners: WorldAction[];
  fails: boolean;
}
export interface NaiveActionAudit { passes: boolean; steps: NaiveActionStep[]; }

/** Even a solver that already knows the action verb must fail to identify the
 * target by literal overlap. Every maximum within that action kind is wrong. */
export function naiveActionAudit(zone: Zone, options: { speech?: CurrentSpeech } = {}): NaiveActionAudit {
  const world = zone.puzzle.world;
  if (!world?.sequence.length) return { passes: false, steps: [] };
  let state = initialInteractions(zone);
  const speech = { ...initialSpeech(zone) };
  // Focusing each encountered line selects the active utterance, matching the renderer.
  for (const id of zone.encounterOrder ?? []) {
    const evidence = zone.evidence.find(candidate => candidate.id === id);
    if (evidence?.surface === 'speech' && evidence.anchor) speech[evidence.anchor] = evidence.text;
  }
  Object.assign(speech, options.speech);
  const steps = world.sequence.map((expected, index): NaiveActionStep => {
    const clue = zone.evidence.find(evidence => evidence.id === world.clues[index]);
    if (clue?.surface === 'speech' && clue.anchor) speech[clue.anchor] = clue.text;
    const actions = availableActions(zone, state).filter(action=>action.kind===expected.kind);
    const applicable = actions.some(action => actionKey(action) === actionKey(expected));
    const scores = actions.map(action => ({ action, score: tokenOverlap(clue?.text ?? '', visibleActionLabel(zone, action, speech)) }));
    const maxScore = scores.length ? Math.max(...scores.map(item => item.score)) : -1;
    const winners = scores.filter(item => item.score === maxScore).map(item => item.action);
    const expectedScore = tokenOverlap(clue?.text ?? '', visibleActionLabel(zone, expected, speech));
    state = applyWorldAction(zone, state, expected);
    return { index, clue: clue?.id ?? world.clues[index] ?? '', expected, applicable, expectedScore, maxScore, winners, fails: !!clue && applicable && winners.length > 0 && winners.every(action => actionKey(action) !== actionKey(expected)) };
  });
  return { passes: steps.every(step => step.fails), steps };
}
