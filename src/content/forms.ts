import type { Lexeme } from './types';

export const normalizeFrench = (text: string): string => text.normalize('NFC').replace(/[’`]/g, "'").toLocaleLowerCase('fr');

export function frenchFormOccurs(text: string, form: string): boolean {
  const normalized = normalizeFrench(form);
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}${normalized.endsWith("'") ? '' : '(?![\\p{L}\\p{N}])'}`, 'iu').test(normalizeFrench(text));
}

/** Homographs in an authored line can name different lemmas (la porte / elle
 * porte). Prefer the dictionary's first sense unless the author pins a sense;
 * all aliases within that chosen lemma still share their encounter evidence. */
export function visibleLexemeIds(text:string,lexicon:Lexeme[],senses:Record<string,string>={}):string[] {
 return lexicon.filter(word=>word.forms.some(form=>{
  if(!frenchFormOccurs(text,form))return false;
  const normalized=normalizeFrench(form);
  const chosen=senses[normalized]?lexicon.find(entry=>entry.id===senses[normalized]):lexicon.find(entry=>entry.forms.some(candidate=>normalizeFrench(candidate)===normalized));
  return chosen?.lemma===word.lemma;
 })).map(word=>word.id);
}

/** Matching tiles display forms[0], except the two-part negation construction.
 * Use the same predicate when checking data and counting inspected encounters. */
export function representativeFormOccurs(word: Pick<Lexeme, 'id' | 'forms'>, text: string): boolean {
  if (word.id === 'ne…pas') {
    return /(?<![\p{L}\p{N}])(?:ne\s+|n')[^.!?;:]{0,80}(?<![\p{L}\p{N}])pas(?![\p{L}\p{N}])/iu.test(normalizeFrench(text));
  }
  return !!word.forms[0] && frenchFormOccurs(text, word.forms[0]);
}

export interface FrenchFormSpan {
  /** Normalized visible form, including elisions and complete lexical phrases. */
  form: string;
  start: number;
  end: number;
  lexemeIds: string[];
  scenery: boolean;
}
export interface FrenchTextMapping {
  forms: FrenchFormSpan[];
  unmapped: { form: string; start: number; end: number }[];
}

const normalizedSurface = (text: string): string => normalizeFrench(text).replace(/\s+/g, ' ').trim();
const letterOrNumber = (char: string | undefined): boolean => !!char && /[\p{L}\p{N}]/u.test(char);

/** Cover every written French component with the longest exact lexical form.
 * A prefix such as l’ or j’ can be followed by another mapped form; hyphens
 * separate components unless an entire known phrase/inversion matches first.
 * Numerals and punctuation are not French lexical tokens. Accents matter. */
export function mapFrenchText(text: string, lexicon: Pick<Lexeme, 'id' | 'forms'>[], sceneryForms: string[] = []): FrenchTextMapping {
  const source = normalizedSurface(text);
  const candidates = new Map<string, { lexemeIds: string[]; scenery: boolean }>();
  for (const word of lexicon) for (const raw of word.forms) {
    const form = normalizedSurface(raw);
    if (!form || !/\p{L}/u.test(form)) continue;
    const existing = candidates.get(form);
    if (existing) existing.lexemeIds.push(word.id);
    else candidates.set(form, { lexemeIds: [word.id], scenery: false });
  }
  for (const raw of sceneryForms) {
    const form = normalizedSurface(raw);
    if (form && !candidates.has(form)) candidates.set(form, { lexemeIds: [], scenery: true });
  }
  const ordered = [...candidates].sort((a, b) => b[0].length - a[0].length);
  const result: FrenchTextMapping = { forms: [], unmapped: [] };
  let at = 0;
  while (at < source.length) {
    if (!/\p{L}/u.test(source[at])) { at++; continue; }
    const match = ordered.find(([form]) => source.startsWith(form, at)
      && !letterOrNumber(source[at - 1])
      && (form.endsWith("'") || !letterOrNumber(source[at + form.length])));
    if (match) {
      const [form, entry] = match;
      result.forms.push({ form, start: at, end: at + form.length, lexemeIds: [...new Set(entry.lexemeIds)], scenery: entry.scenery });
      at += form.length;
      continue;
    }
    const unknown = /^\p{L}+/u.exec(source.slice(at))![0];
    result.unmapped.push({ form: unknown, start: at, end: at + unknown.length });
    at += unknown.length;
  }
  return result;
}

/** Written-word budget: elisions and hyphenated words count as one word. */
export function frenchWordCount(text: string): number {
  return (text.match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu) ?? []).length;
}
export function frenchSentences(text: string): string[] {
  return text.split(/[.!?]+/u).map(sentence => sentence.trim()).filter(Boolean);
}
