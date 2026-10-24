import type { Lexeme } from './types';

export const normalizeFrench = (text: string): string => text.normalize('NFC').replace(/[’`]/g, "'").toLocaleLowerCase('fr');

export function frenchFormOccurs(text: string, form: string): boolean {
  const normalized = normalizeFrench(form);
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}${normalized.endsWith("'") ? '' : '(?![\\p{L}\\p{N}])'}`, 'iu').test(normalizeFrench(text));
}

/** Matching tiles display forms[0], except the two-part negation construction.
 * Use the same predicate when checking data and counting inspected encounters. */
export function representativeFormOccurs(word: Pick<Lexeme, 'id' | 'forms'>, text: string): boolean {
  if (word.id === 'ne…pas') {
    return /(?<![\p{L}\p{N}])(?:ne\s+|n')[^.!?;:]{0,80}(?<![\p{L}\p{N}])pas(?![\p{L}\p{N}])/iu.test(normalizeFrench(text));
  }
  return !!word.forms[0] && frenchFormOccurs(text, word.forms[0]);
}
