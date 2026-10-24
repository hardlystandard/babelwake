import { Color } from 'three';
import type { Evidence, Lexeme, Picture, SceneObject, ScenePose, WorldAction, Zone } from './types';
import { frenchFormOccurs, frenchSentences, frenchWordCount, mapFrenchText, normalizeFrench, representativeFormOccurs } from './forms';
import { pictureSvg } from '../ui/pictures';
import { journalFrame } from '../ui/journal-frame';
import { actionKey, applyWorldAction, availableActions, initialInteractions, naiveActionAudit } from '../game/interactions';

export interface VisibleFrench { id: string; text: string; }
export interface SituatedValidationOptions {
  /** Already encountered surface forms from earlier migrated zones, never lemmas. */
  initialKnownForms?: readonly string[];
  /** Include later-zone targets when checking that scenery is never tested. */
  testedWordIds?: readonly string[];
}
const normalize = (text: string): string => normalizeFrench(text).replace(/\s+/g, ' ').trim();
export const renderedPictureText = (picture: Picture): string[] => [...pictureSvg(picture).matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/gu)].map(match => match[1].replace(/<[^>]*>/gu, '').replace(/&#39;|&apos;/gu, "'").replace(/&quot;/gu, '"').replace(/&lt;/gu, '<').replace(/&gt;/gu, '>').replace(/&amp;/gu, '&'));
const sceneText = (object: SceneObject): string[] => [object.label, ...(object.labels ?? []).map(label => label.text)].filter((text): text is string => !!text);
const actionReferences = (action: WorldAction): string[] => [action.object, ...('target' in action ? [action.target] : []), ...(action.kind === 'operate' && action.tool ? [action.tool] : [])];
const isActor = (object: SceneObject | undefined): boolean => !!object && /person|npc|guardian|neighbor/.test(object.kind);

/** Language/SVG metadata cannot manufacture an environmental contrast. */
export function physicalSituationSignature(zone: Zone, evidence: Evidence): string {
  const objects = new Map((zone.scene ?? []).map(object => [object.id, object]));
  // These model families/heights and world-space placement offsets mirror SituatedLayer.
  const model = (object: SceneObject): string => {
    const kind = object.kind;
    for (const [pattern, family] of [[/key/, 'key'], [/box|crate|chest/, 'box'], [/door|gate/, 'door'], [/table|bench|counter|shelf/, /shelf/.test(kind) ? 'shelf' : 'table'], [/book/, 'book'], [/person|npc|guardian|neighbor/, /female|woman/.test(kind) ? 'npc-female' : 'npc-male'], [/letter|note|paper/, 'letter'], [/bottle|pot|paint/, 'bottle'], [/chair/, 'chair'], [/window/, 'window'], [/mat|floor/, 'mat'], [/notice/, 'notice']] as [RegExp, string][]) if (pattern.test(kind)) return family;
    return 'sign';
  };
  const scale = (object: SceneObject): [number, number, number] => typeof object.size === 'number' ? [object.size, object.size, object.size] : object.size ?? [1, 1, 1];
  const heights: Record<string, number> = { key: .25, box: 1.55, door: 3.6, table: 1.3, shelf: 1.3, book: .35, 'npc-female': 2.3, 'npc-male': 2.3, letter: .15, bottle: 1.1, chair: 1.7, window: 2.4, mat: .07, notice: 3.6, sign: 2.1 };
  const colors: Record<string, string> = { rouge: '#ad5540', bleu: '#52748c', bleue: '#52748c', jaune: '#c5a04d', vert: '#54754b', verte: '#54754b', blanc: '#e5ddc7', blanche: '#e5ddc7', noir: '#273a34', noire: '#273a34' };
  const poses = new Map<string, ScenePose>();
  for (const object of objects.values()) if (isActor(object)) poses.set(object.id, object.pose ?? {});
  if (evidence.anchor && isActor(objects.get(evidence.anchor)) && evidence.pose) poses.set(evidence.anchor, evidence.pose);
  for (const [id, override] of Object.entries(evidence.actorPoses ?? {})) if (isActor(objects.get(id))) poses.set(id, { ...poses.get(id), ...override });
  const holders = new Map<string, string>();
  for (const [id, pose] of poses) if (pose.holds) holders.set(pose.holds, id);
  const placements = initialInteractions(zone).placements;
  type Location = { position: [number, number, number]; visible: boolean };
  const positions = new Map<string, Location | null>();
  const resolve = (id: string, chain = new Set<string>()): Location | null => {
    if (positions.has(id)) return positions.get(id)!;
    const object = objects.get(id);
    if (!object || chain.has(id)) return null;
    const next = new Set(chain).add(id);
    let result: Location = { position: [object.position[0], 0, object.position[1]], visible: true };
    const holder = holders.get(id);
    if (holder) {
      const actor = resolve(holder, next);
      if (!actor) return null;
      result = { position: [actor.position[0] + .6, actor.position[1] + .95, actor.position[2] + .3], visible: true };
    } else {
      const placement = placements[id];
      if (placement) {
        const parent = objects.get(placement.target), location = resolve(placement.target, next);
        if (!parent || !location) return null;
        const parentScale = scale(parent)[1];
        const y = placement.relation === 'under' ? .1 : placement.relation === 'on'
          ? model(parent) === 'chair' ? .73 * parentScale + .03 : heights[model(parent)] * parentScale + .12
          : model(parent) === 'box' ? .8 * parentScale : .27;
        const z = placement.relation === 'under' ? model(parent) === 'chair' ? .07 : .28 : 0;
        const authored = object.placement;
        const offset = authored?.target === placement.target && authored.relation === placement.relation ? authored.offset ?? [0, 0, 0] : [0, 0, 0];
        result = { position: [location.position[0] + offset[0], location.position[1] + y + offset[1], location.position[2] + z + offset[2]], visible: location.visible && !(placement.relation === 'in' && parent.container && !parent.open) };
        if (isActor(parent)) { result.position[0] += .55; result.position[1] += .75; result.position[2] += .3; }
      }
    }
    positions.set(id, result); return result;
  };
  const precise = (value: number): number => Number(value.toFixed(9));
  const describe = (id: string | undefined): unknown => {
    const object = id ? objects.get(id) : undefined;
    if (!object) return null;
    const family = model(object), location = resolve(object.id);
    const defaultColor = family === 'table' || family === 'shelf' ? '#806044' : family === 'letter' || family === 'notice' || family === 'sign' ? '#d8c7a4' : '#7b8a64';
    const color = family === 'window' ? '#5b7c80' : family === 'notice' || family === 'sign' ? '#d8c7a4' : colors[object.color ?? ''] ?? object.color ?? defaultColor;
    const turn = Math.PI * 2, rawRotation = object.rotation ?? (family === 'notice' ? Math.atan2(18, 22) : 0);
    const rotation = precise((rawRotation % turn + turn) % turn);
    return [family, location?.position.map(precise) ?? null, Math.abs(rotation - turn) < 1e-9 ? 0 : rotation, new Color(color).getHexString(), scale(object).map(precise), object.open ?? false, location?.visible ?? false];
  };
  const actorPoses = [...new Set([...poses].filter(([, pose]) => pose.holds || pose.pointsTo).map(([id, pose]) => JSON.stringify([describe(id), describe(pose.holds), describe(pose.pointsTo)])))].sort();
  const demo = evidence.demonstration;
  const animation = demo ? [describe(demo.actor), demo.action.kind, demo.action.kind === 'operate' ? demo.action.operation : null, demo.action.kind === 'place' ? demo.action.relation : null, actionReferences(demo.action).map(describe)] : null;
  return JSON.stringify({ anchor: describe(evidence.anchor), actorPoses, demonstration: animation });
}


/** Actual situated French. Evidence titles are internal and are deliberately absent. */
export function situatedVisibleText(zone: Zone): VisibleFrench[] {
  return [
    { id: `${zone.id}/title`, text: zone.title }, { id: `${zone.id}/subtitle`, text: zone.subtitle }, { id: `${zone.id}/intro`, text: zone.intro },
    ...zone.evidence.map(e => ({ id: `${e.id}/text`, text: e.text })),
    ...(zone.scene ?? []).flatMap(object => sceneText(object).map((text, i) => ({ id: `${object.id}/label/${i}`, text }))),
    ...zone.pages.flatMap(page => [{ id: `${page.id}/title`, text: page.title }, ...Object.entries(journalFrame(page, true)).map(([part, text]) => ({ id: `${page.id}/frame/${part}`, text })), ...page.slots.flatMap(slot => renderedPictureText(slot.picture).map((text, i) => ({ id: `${page.id}/${slot.id}/picture/${i}`, text })))]),
    { id: `${zone.puzzle.id}/title`, text: zone.puzzle.title }, { id: `${zone.puzzle.id}/instruction`, text: zone.puzzle.instruction }, { id: `${zone.puzzle.id}/success`, text: zone.puzzle.success },
    ...zone.puzzle.steps.flatMap(step => [{ id: `${step.id}/prompt`, text: step.prompt }, ...step.choices.map((text, i) => ({ id: `${step.id}/choice/${i}`, text })), ...renderedPictureText(step.picture).map((text, i) => ({ id: `${step.id}/picture/${i}`, text }))]),
  ].filter(line => !!line.text.trim());
}

/** Strict by default, including test fixtures. Only validateContent's explicit
 * migration dispatch decides which shipped zones have adopted situated design. */
export function validateSituatedZone(zone: Zone, lexicon: Lexeme[], options: SituatedValidationOptions = {}): string[] {
  const errors: string[] = [];
  const report = (id: string, message: string) => errors.push(`${id}: ${message}`);
  const scenery = zone.scenery ?? [];
  const normalizedScenery = scenery.map(normalize);
  if (!zone.scenery) report(zone.id, 'situated scenery allowlist must be explicit');
  if (scenery.length > 15 || new Set(scenery.flatMap(text => normalize(text).match(/\p{L}+(?:['-]\p{L}+)*/gu) ?? [])).size > 15) report(zone.id, 'scenery allowlist exceeds 15 words');
  if (new Set(normalizedScenery).size !== scenery.length || scenery.some(text => !text.trim())) report(zone.id, 'scenery allowlist contains duplicate or empty forms');
  const testedIds = new Set(options.testedWordIds ?? zone.pages.flatMap(page => [...page.words, ...(page.distractors ?? [])]));
  const tested = lexicon.filter(word => testedIds.has(word.id));
  const testedLemmas = new Set(tested.map(word => word.lemma));
  const answerForms = lexicon.filter(word => testedIds.has(word.id) || testedLemmas.has(word.lemma)).flatMap(word => word.forms);
  for (const form of scenery) {
    if (answerForms.some(answer => frenchFormOccurs(form, answer) || frenchFormOccurs(answer, form))) report(zone.id, `scenery form « ${form} » is tested; scenery may never exempt learning targets`);
  }
  for (const line of situatedVisibleText(zone)) {
    const untracked = [...new Set(mapFrenchText(line.text, lexicon, scenery).unmapped.map(token => token.form))];
    if (untracked.length) report(line.id, `untracked French tokens: ${untracked.join(', ')}`);
  }

  const objects = zone.scene ?? [];
  const byObject = new Map(objects.map(object => [object.id, object]));
  if (!objects.length) report(zone.id, 'situated scene must contain physical objects');
  if (byObject.size !== objects.length) report(zone.id, 'duplicate scene object IDs');
  for (const object of objects) {
    if (!object.id || !object.position.every(Number.isFinite)) report(object.id || zone.id, 'invalid physical object ID or position');
    for (const parent of [object.containedBy, object.placement?.target].filter((id): id is string => !!id)) if (!byObject.has(parent) || parent === object.id) report(object.id, 'invalid initial placement/container reference');
    if (object.pose) { if (!isActor(object)) report(object.id, 'physical poses require an NPC actor'); checkPose(object.pose, object.id, object.id); }
    const visited = new Set<string>([object.id]);
    let parent = object.placement?.target ?? object.containedBy;
    while (parent && byObject.has(parent)) {
      if (visited.has(parent)) { report(object.id, 'cyclic initial physical containment'); break; }
      visited.add(parent); const container = byObject.get(parent)!; parent = container.placement?.target ?? container.containedBy;
    }
    if (object.label) checkBudget(object.label, 'sign', `${object.id}/label`);
    for (const [i, label] of (object.labels ?? []).entries()) checkBudget(label.text, label.surface, `${object.id}/label/${i}`);
  }
  const initial = initialInteractions(zone);
  for (const object of objects) {
    const seen = new Set<string>([object.id]); let parent = initial.placements[object.id]?.target;
    while (parent) {
      if (seen.has(parent)) { report(object.id, 'cyclic initial physical placement/holding'); break; }
      seen.add(parent); parent = initial.placements[parent]?.target;
    }
  }
  const byEvidence = new Map(zone.evidence.map(evidence => [evidence.id, evidence]));
  const paradigm = /(?<!\p{L})(je|tu|il|elle|nous|vous|ils|elles)\s+(?:suis|es|est|sommes|êtes|sont|ai|as|a|avons|avez|ont|vais|vas|va|allons|allez|vont|veux|veut|voulons|voulez|veulent|peux|peut|pouvons|pouvez|peuvent)(?!\p{L})/giu;
  for (const evidence of zone.evidence) {
    if (!evidence.anchor || !byObject.has(evidence.anchor)) report(evidence.id, 'situated evidence needs an existing physical anchor');
    if (!evidence.surface) report(evidence.id, 'situated evidence needs an explicit text surface');
    if (evidence.kind === 'person' && evidence.surface !== 'speech') report(evidence.id, 'NPC dialogue must use an anchored speech surface');
    if (evidence.surface === 'speech' && !isActor(byObject.get(evidence.anchor ?? ''))) report(evidence.id, 'speech needs a physical NPC actor');
    if (evidence.kind === 'note' && evidence.surface !== 'note') report(evidence.id, 'note evidence must use the physical note surface');
    if (evidence.pose) { if (!isActor(byObject.get(evidence.anchor ?? ''))) report(evidence.id, 'evidence poses require an NPC anchor'); checkPose(evidence.pose, evidence.id, evidence.anchor); }
    for (const [actor, pose] of Object.entries(evidence.actorPoses ?? {})) {
      if (!isActor(byObject.get(actor))) report(evidence.id, `actorPoses references an unknown or non-NPC actor ${actor}`);
      checkPose(pose, `${evidence.id}/actorPoses/${actor}`, actor);
    }
    if (evidence.demonstration) {
      if (!isActor(byObject.get(evidence.demonstration.actor))) report(evidence.id, 'demonstration actor must reference a physical NPC');
      if (actionReferences(evidence.demonstration.action).some(id => !byObject.has(id))) report(evidence.id, 'demonstration action references unknown scene objects');
    }
    const isFinaleLetter = zone.id === 'lettres' && evidence.kind === 'note' && /letter/.test(byObject.get(evidence.anchor ?? '')?.kind ?? '');
    if (!isFinaleLetter) checkBudget(evidence.text, evidence.surface ?? (evidence.kind === 'person' ? 'speech' : evidence.kind === 'note' ? 'note' : 'sign'), evidence.id);
    const pairs = [...normalize(evidence.text).matchAll(paradigm)];
    const tokens = normalize(evidence.text).match(/\p{L}+/gu) ?? [];
    const subjects = new Set(['je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles']);
    const bareSubjects = new Set(tokens.filter(token => subjects.has(token)));
    if (new Set(pairs.map(pair => pair[1])).size >= 3 || bareSubjects.size >= 3 && tokens.every(token => subjects.has(token) || token === 'et')) report(evidence.id, 'conjugation paradigms must be replaced by situated dialogue');
    if (/\n\s*\n/u.test(evidence.text)) report(evidence.id, 'paragraph-style evidence is forbidden');
  }

  const order = zone.encounterOrder ?? [];
  if (!zone.encounterOrder) report(zone.id, 'situated encounterOrder must be explicit');
  if (new Set(order).size !== order.length) report(zone.id, 'encounterOrder repeats an evidence ID');
  for (const id of order) if (!byEvidence.has(id)) report(zone.id, `encounterOrder references unknown evidence ${id}`);
  for (const evidence of zone.evidence) if (!order.includes(evidence.id)) report(zone.id, `encounterOrder omits ${evidence.id}`);
  const known = new Set((options.initialKnownForms ?? []).map(normalize));
  for (const id of order) {
    const evidence = byEvidence.get(id);
    if (!evidence) continue;
    const object = byObject.get(evidence.anchor ?? '');
    const visible = [evidence.text, ...(object ? sceneText(object) : [])].join(' ');
    const mapping = mapFrenchText(visible, lexicon, scenery);
    const forms = [...new Set([...mapping.forms.filter(token => !token.scenery).map(token => token.form), ...mapping.unmapped.map(token => token.form)])];
    const introduced = forms.filter(form => !known.has(form));
    if (introduced.length > 2) report(evidence.id, `encounter introduces ${introduced.length} new visible forms (maximum 2): ${introduced.join(', ')}`);
    forms.forEach(form => known.add(form));
  }

  for (const object of objects) {
    const unseen = [...new Set(sceneText(object).flatMap(text => mapFrenchText(text, lexicon, scenery).forms.filter(token => !token.scenery && !known.has(token.form)).map(token => token.form)))];
    if (unseen.length) report(object.id, `scene label forms have no ordered encounter exposure: ${unseen.join(', ')}`);
  }

  for (const page of zone.pages) {
    const pageAnswers = new Set(page.slots.map(slot => slot.answer));
    const families = new Set(lexicon.filter(word => pageAnswers.has(word.id)).map(word => word.lemma));
    const forms = lexicon.filter(word => pageAnswers.has(word.id) || families.has(word.lemma)).flatMap(word => word.forms);
    const labels = [{ id: `${page.id}/title`, text: page.title }, ...Object.entries(journalFrame(page, true)).map(([part, text]) => ({ id: `${page.id}/frame/${part}`, text })), ...page.slots.flatMap(slot => renderedPictureText(slot.picture).map((text, i) => ({ id: `${page.id}/${slot.id}/label/${i}`, text })))];
    for (const label of labels) {
      const ellipses = [...label.text.matchAll(/…|(?:\.\s*){3,}/gu)];
      const missingWords = ellipses.some(match => frenchWordCount(label.text.slice(match.index! + match[0].length)) > 0)
        || ellipses.length > 0 && frenchWordCount(label.text) === 0;
      if (/[_□▢]|\[\s*\]|\(\s*\)/u.test(label.text) || missingWords) report(label.id, 'fill-in-the-blank journal labels are forbidden');
      const exposed = [...new Set(forms.filter(form => frenchFormOccurs(label.text, form)))];
      if (exposed.length) report(label.id, `journal label reveals an answer form: ${exposed.join(', ')}`);
    }
    for (const id of [...page.words, ...(page.distractors ?? [])]) {
      const word = lexicon.find(entry => entry.id === id);
      if (!word) continue;
      const contexts = zone.evidence.filter(evidence => evidence.words.includes(id) && representativeFormOccurs(word, evidence.text));
      if (new Set(contexts.map(evidence => physicalSituationSignature(zone, evidence))).size < 3) report(page.id, `${id} needs 3 distinct physical encounter situations`);
    }
    const contrasts = page.requiresEvidence ?? [];
    if (new Set(contrasts).size !== contrasts.length) report(page.id, 'contrast evidence references must be distinct');
    for (const id of contrasts) if (!byEvidence.has(id)) report(page.id, `unknown contrast evidence ${id}`);
    if (page.kind === 'grammar') {
      if (contrasts.length < 3) report(page.id, 'grammar contrast requires at least 3 environmental evidence contexts');
      const evidence = contrasts.map(id => byEvidence.get(id)).filter((entry): entry is Evidence => !!entry);
      if (new Set(evidence.map(entry => physicalSituationSignature(zone, entry))).size < 3) report(page.id, 'grammar contrast needs 3 distinct physical situations');
      for (const entry of evidence) if (!entry.anchor || !byObject.has(entry.anchor)) report(page.id, `contrast ${entry.id} has no physical situation`);
    }
  }

  const world = zone.puzzle.world;
  if (zone.puzzle.steps.length) report(zone.puzzle.id, 'situated puzzle cannot use legacy multiple-choice steps');
  if (!world?.sequence.length) report(zone.puzzle.id, 'situated puzzle needs a physical action sequence');
  if (world) {
    if (world.exit && !byObject.has(world.exit)) report(zone.puzzle.id, 'physical exit references an unknown scene object');
    if (world.clues.length !== world.sequence.length) report(zone.puzzle.id, 'physical sequence needs one environmental clue per action');
    for (const id of world.clues) if (!byEvidence.has(id)) report(zone.puzzle.id, `physical sequence references unknown clue ${id}`);
    let state = initialInteractions(zone);
    for (const [index, action] of world.sequence.entries()) {
      const refs = actionReferences(action);
      if (refs.some(id => !byObject.has(id))) report(zone.puzzle.id, `physical action ${index + 1} references unknown scene objects`);
      const allowed = availableActions(zone, state).some(candidate => actionKey(candidate) === actionKey(action));
      if (!allowed) { report(zone.puzzle.id, `physical action ${index + 1} is not applicable after the preceding actions`); break; }
      state = applyWorldAction(zone, state, action);
    }
    for (const step of naiveActionAudit(zone).steps) {
      if (step.applicable && !step.fails) report(zone.puzzle.id, `naive token-overlap solver can choose physical action ${step.index + 1}; every highest-score candidate must be wrong`);
    }
  }
  return [...new Set(errors)];

  function checkPose(pose: ScenePose, id: string, actor?: string): void {
    if ([pose.holds, pose.pointsTo].some(ref => !!ref && !byObject.has(ref))) report(id, 'pose references unknown scene objects');
    if (pose.holds && pose.holds === actor) report(id, 'an NPC cannot hold itself');
  }

  function checkBudget(text: string, surface: string, id: string): void {
    if (surface === 'note') {
      const sentences = frenchSentences(text);
      if (sentences.length > 2 || sentences.some(sentence => frenchWordCount(sentence) > 8)) report(id, 'notes allow at most 2 short sentences of at most 8 words');
    } else {
      const limit = surface === 'speech' ? 8 : 4;
      if (frenchWordCount(text) > limit) report(id, `${surface === 'speech' ? 'NPC speech' : 'sign/label'} exceeds ${limit} words`);
    }
  }
}

export interface SituatedMigrationDebt { zone: Zone['id']; violations: string[]; }
/** Transparent migration inventory; deferred zones do not silently pass v2 rules. */
export function situatedMigrationDebt(content: { lexicon: Lexeme[]; zones: Zone[] }): SituatedMigrationDebt[] {
  const testedWordIds = content.zones.flatMap(zone => zone.pages.flatMap(page => [...page.words, ...(page.distractors ?? [])]));
  return content.zones.filter(zone => zone.design !== 'situated').map(zone => ({ zone: zone.id, violations: validateSituatedZone(zone, content.lexicon, { testedWordIds }) }));
}
