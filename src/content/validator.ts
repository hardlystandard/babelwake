import type { Content, Picture, Zone } from './types';
import { referenceForms } from './reference';
import { pictureSvg } from '../ui/pictures';
import { representativeFormOccurs } from './forms';
import { situatedVisibleText, validateSituatedZone } from './situated-validator';
export { renderedPictureText, situatedMigrationDebt, situatedVisibleText, validateSituatedZone } from './situated-validator';

/** A deliberately conservative spelling reference: unaccented homographs such as
 * a/à, ou/où, sur/sûr and trouve/trouvé are excluded because context needs a human reviewer. */
export const accentReference = [
  'être', 'êtes', 'été', 'café', 'thé', 'école', 'garçon', 'français', 'française',
  'fenêtre', 'derrière', 'à côté de', 'lumière', 'étage', 'numéro', 'mère', 'père',
  'frère', 'sœur', 'déjà', 'très', 'après', 'bientôt', 'à bientôt', 'près', 'prêt',
  'clé', 'clés', 'marché', 'entrée', 'sortie', 'arrivée', 'départ', 'première',
  'deuxième', 'troisième', 'quatrième', 'cinquième', 'sixième', 'à gauche',
  'réponse', 'répondre', 'réparer', 'réparé', 'décidé', 'acheté', 'achetée',
  'préparé', 'préparée', 'trouvée', 'retrouvée',
  'désolé', 'désolée', 's’il vous plaît', "s'il vous plaît", 'voilà',
  'où est', 'où sont', 'à quelle heure', 'à droite', 'à demain',
  'j’ai été', "j'ai été", 'vous êtes', 'nous sommes allés', 'août',
];
const fold = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').replaceAll('œ', 'oe').toLocaleLowerCase('fr');
const normalize = (value: string) => value.normalize('NFC').replace(/[’`]/g, "'").replace(/\s+/g, ' ').trim().toLocaleLowerCase('fr');
const boundary = (value: string) => `(?<![\\p{L}\\p{N}])${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${value.endsWith("'") ? '' : '(?![\\p{L}\\p{N}])'}`;
const english = /\b(?:the|with|your|you|hello|goodbye|please|click|drag|drop|choose|match|confirm|settings|journal page|red|green|yellow|purple|bread|water|cheese|bottle|window|door|picture|behind|under|next to|how much|what time)\b/iu;
export const pictureSignature = (picture: Picture): string => pictureSvg(picture);
// Present forms and common homographs must not be mistaken for accent errors.
const acceptedUnaccentedForms = new Set(['a', 'ou', 'sur', 'trouve', 'trouves', 'retrouve', 'retrouves', 'ferme', 'fermes', 'donne', 'donnes', 'marche', 'marches', 'porte', 'portes', 'passe', 'passes', 'reste', 'restes', 'entre', 'entres', 'coupe', 'coupes', 'mange', 'manges', 'demande', 'demandes', 'cherche', 'cherches', 'cote', 'cotes']);
const spellingReference = [...new Set([...accentReference, ...referenceForms])].filter(correct => !acceptedUnaccentedForms.has(normalize(fold(correct))));

export function visibleZoneStrings(zone: Zone): string[] {
  if (zone.design === 'situated') return situatedVisibleText(zone).map(line => line.text);
  return [zone.title, zone.subtitle, zone.intro,
    ...zone.evidence.flatMap(e => [e.title, e.text, e.picture.label ?? '']),
    ...zone.pages.flatMap(p => [p.title, ...p.slots.map(s => s.picture.label ?? '')]),
    zone.puzzle.title, zone.puzzle.instruction, zone.puzzle.success,
    ...zone.puzzle.steps.flatMap(s => [s.prompt, ...s.choices, s.picture.label ?? ''])];
}

/** Structural checks are deterministic. Semantic/idiomatic correctness still
 * requires the native-speaker review and zero-French playtest in docs/PLAYTEST. */
export function validateContent(content: Content): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const lemmaIds = new Set<string>();
  const seenZoneIds = new Set<string>();
  const used = new Set<string>();
  const lexicon = new Map(content.lexicon.map(word => [word.id, word]));
  const zoneIds = new Set(content.zones.map(z => z.id));
  const checkId = (id: string, path: string) => {
    if (!id || ids.has(id)) errors.push(`${path}: duplicate or empty ID ${id}`);
    ids.add(id);
  };
  const wordRef = (id: string, path: string) => {
    if (!lexicon.has(id)) errors.push(`${path}: orphan lemma reference ${id}`);
    else used.add(id);
  };
  const checkSpelling = (line: string, path: string) => {
    if (english.test(line)) errors.push(`${path}: English in world content: ${line}`);
    if (line !== line.normalize('NFC')) errors.push(`${path}: spelling must use NFC Unicode`);
    const normalized = normalize(line);
    for (const correct of spellingReference) {
      const plain = normalize(fold(correct));
      if (plain !== normalize(correct) && new RegExp(boundary(plain), 'iu').test(normalized)) {
        errors.push(`${path}: missing accent: use « ${correct} »`);
      }
    }
  };
  for (const word of content.lexicon) {
    if (!word.id || lemmaIds.has(word.id)) errors.push(`lexicon: duplicate or empty lemma ID ${word.id}`);
    lemmaIds.add(word.id);
    if (!word.lemma.trim() || !word.forms.length || word.forms.some(f => !f.trim())) errors.push(`lexicon/${word.id}: orphan or empty lemma/forms`);
    const hasLemmaTarget = content.lexicon.some(parent => parent.id === word.lemma || parent.forms.some(form => normalize(form) === normalize(word.lemma)));
    if (!hasLemmaTarget) errors.push(`lexicon/${word.id}: orphan lemma target ${word.lemma}`);
    if (!zoneIds.has(word.zone)) errors.push(`lexicon/${word.id}: unknown zone ${word.zone}`);
    if (new Set(word.forms.map(normalize)).size !== word.forms.length) errors.push(`lexicon/${word.id}: duplicate forms`);
    [word.lemma, ...word.forms].forEach(f => checkSpelling(f, `lexicon/${word.id}`));
  }
  for (const zone of content.zones) {
    if (seenZoneIds.has(zone.id)) errors.push(`zone: duplicate ID ${zone.id}`);
    seenZoneIds.add(zone.id);
    visibleZoneStrings(zone).forEach(line => checkSpelling(line, zone.id));
    if (zone.design === 'situated') errors.push(...validateSituatedZone(zone, content.lexicon, { testedWordIds: content.zones.flatMap(place => place.pages.flatMap(page => [...page.words, ...(page.distractors ?? [])])) }));
    if (!zone.evidence.length) errors.push(`${zone.id}: no encounters`);
    for (const evidence of zone.evidence) {
      checkId(evidence.id, zone.id);
      if (!evidence.text.trim() || !evidence.picture.kind) errors.push(`${evidence.id}: missing encounter context`);
      if (!evidence.position.every(Number.isFinite)) errors.push(`${evidence.id}: invalid position`);
      for (const id of evidence.words) {
        wordRef(id, evidence.id);
        const word = lexicon.get(id);
        if (word && !word.forms.some(f => new RegExp(boundary(normalize(f)), 'iu').test(normalize(evidence.text + (zone.design === 'situated' ? '' : ' ' + evidence.title))))) {
          errors.push(`${evidence.id}: encountered lemma ${id} has no visible French form`);
        }
      }
    }
    const allPageIds = new Set(content.zones.flatMap(z => z.pages.map(p => p.id)));
    for (const page of zone.pages) {
      checkId(page.id, zone.id);
      if (page.zone !== zone.id) errors.push(`${page.id}: page belongs to another zone`);
      if (page.slots.length < 3 || page.slots.length > 5) errors.push(`${page.id}: a page needs 3–5 vignettes`);
      if (new Set(page.words).size !== page.words.length) errors.push(`${page.id}: duplicate tested words`);
      const visibleTiles = [...page.words, ...(page.distractors ?? [])].map(id => lexicon.get(id)?.forms[0]).filter((form): form is string => !!form).map(normalize);
      const repeatedTiles = [...new Set(visibleTiles.filter((form, index) => visibleTiles.indexOf(form) !== index))];
      if (repeatedTiles.length) errors.push(`${page.id}: duplicate visible matching tiles: ${repeatedTiles.join(', ')}`);

      if (new Set(page.slots.map(s => s.id)).size !== page.slots.length) errors.push(`${page.id}: duplicate slot IDs`);
      if (new Set(page.slots.map(s => s.answer)).size !== page.slots.length) errors.push(`${page.id}: ambiguous or repeated answers`);
      if (new Set(page.slots.map(s => pictureSignature(s.picture))).size !== page.slots.length) errors.push(`${page.id}: ambiguous duplicate vignettes`);
      const answers = new Set(page.slots.map(s => s.answer));
      if (page.words.some(id => !answers.has(id)) || page.slots.some(s => !page.words.includes(s.answer))) errors.push(`${page.id}: unsolvable word/slot mapping`);
      for (const id of [...page.words, ...(page.distractors ?? [])]) {
        wordRef(id, page.id);
        const encounters = zone.evidence.filter(e => e.words.includes(id));
        const texts = new Set(encounters.map(e => normalize(e.text)));
        const pictures = new Set(encounters.map(e => pictureSignature(e.picture)));
        if (encounters.length < 3 || zone.design !== 'situated' && (texts.size < 3 || pictures.size < 3)) errors.push(`${page.id}: ${id} needs 3 distinct encounter contexts before testing`);
        const word = lexicon.get(id);
        if (word?.forms[0]) {
          // The matching interface displays forms[0]. Learning an inflected form
          // alone must not silently introduce an unseen infinitive on the page.
          const visible = encounters.filter(e => representativeFormOccurs(word, (zone.design === 'situated' ? '' : e.title + ' ') + e.text));
          if (visible.length < 3 || zone.design !== 'situated' && (new Set(visible.map(e => normalize(e.text))).size < 3 || new Set(visible.map(e => pictureSignature(e.picture))).size < 3)) {
            errors.push(`${page.id}: displayed form ${id === 'ne…pas' ? 'ne…pas' : word.forms[0]} needs 3 distinct visible contexts`);
          }
        }

      }
      for (const distractor of page.distractors ?? []) {
        if (page.words.includes(distractor)) errors.push(`${page.id}: distractor duplicates a tested word`);
      }
    }
    const puzzle = zone.puzzle;
    checkId(puzzle.id, zone.id);
    if (!puzzle.steps.length && !puzzle.world?.sequence.length) errors.push(`${puzzle.id}: no solution`);
    for (const page of zone.pages) {
      if (!puzzle.requiredPages.includes(page.id)) errors.push(`${puzzle.id}: local page ${page.id} is not required for progression`);
    }
    for (const page of puzzle.requiredPages) {
      if (!allPageIds.has(page)) errors.push(`${puzzle.id}: unknown required page ${page}`);
      const owner = content.zones.findIndex(z => z.pages.some(p => p.id === page));
      if (owner > content.zones.indexOf(zone)) errors.push(`${puzzle.id}: unsolvable prerequisite requires a later zone page ${page}`);
    }
    for (const step of puzzle.steps) {
      checkId(`${puzzle.id}/${step.id}`, puzzle.id);
      if (step.choices.length < 3 || new Set(step.choices).size !== step.choices.length) errors.push(`${step.id}: choices must be distinct and include at least 3 alternatives`);
      if (!step.choices.includes(step.answer)) errors.push(`${step.id}: unsolvable answer absent from choices`);
      // Choice wording may describe the action shown in a drawing. Requiring a
      // literal repeated sentence would turn environmental inference into copying.
      if (!step.prompt.trim() || !step.picture.kind) errors.push(`${step.id}: missing in-world puzzle evidence`);
    }
  }
  for (const word of content.lexicon) if (!used.has(word.id)) errors.push(`lexicon/${word.id}: orphan lemma has no encounter or journal use`);
  return [...new Set(errors)];
}
