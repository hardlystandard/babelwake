import { beforeAll, describe, expect, it } from 'vitest';
import { canonicalLexemeId, loadContent } from '../src/content';
import type { Content } from '../src/content/types';
import { validateContent } from '../src/content/validator';

/** Counts canonical learning targets, not inflections, repeated pages, or words
 * merely mentioned in the inventory. Human inference remains a playtest task. */
describe('authored complete-game coverage', () => {
  let content: Content;
  beforeAll(async () => { content = await loadContent(); });

  it('contains all six authored places in progression order', () => {
    expect(content.zones.map(zone => zone.id)).toEqual(['atelier', 'marche', 'cafe', 'gare', 'maison', 'lettres']);
  });

  it('keeps the canonical lexicon within the 200–300 learning target', () => {
    const lemmas = new Set(content.lexicon.map(word => canonicalLexemeId(word.id)));
    expect(lemmas.size).toBeGreaterThanOrEqual(200);
    expect(lemmas.size).toBeLessThanOrEqual(300);
  });

  it('requires confirmation of at least 200 distinct canonical words', () => {
    const tested = new Set(content.zones.flatMap(zone => zone.pages.flatMap(page => page.words.map(canonicalLexemeId))));
    expect(tested.size).toBeGreaterThanOrEqual(200);
  });

  it('requires every local journal page before its zone can be completed', () => {
    for (const zone of content.zones) {
      for (const page of zone.pages) expect(zone.puzzle.requiredPages, `${zone.id}/${page.id}`).toContain(page.id);
    }
  });

  it('passes every structural and encounter-content invariant', () => {
    expect(validateContent(content)).toEqual([]);
  }, 30_000);
});
