import { beforeAll, describe, expect, it } from 'vitest';
import { canonicalLexemeId, loadContent } from '../src/content';
import type { Content } from '../src/content/types';
import { situatedMigrationDebt, validateContent } from '../src/content/validator';
import {naiveActionAudit} from '../src/game/interactions';

/** Counts canonical learning targets, not inflections, repeated pages, or words
 * merely mentioned in the inventory. Human inference remains a playtest task. */
describe('authored complete-game coverage', () => {
  let content: Content;
  beforeAll(async () => { content = await loadContent(); });

  it('contains all six authored places in progression order', () => {
    expect(content.zones.map(zone => zone.id)).toEqual(['atelier', 'marche', 'cafe', 'gare', 'maison', 'lettres']);
  });

  it('enforces the situated contract on every zone without migration exemptions',()=>{
    expect(content.zones.every(zone=>zone.design==='situated')).toBe(true);
    expect(situatedMigrationDebt(content)).toEqual([]);
    for(const zone of content.zones){
      expect(zone.evidence.every(e=>e.id.startsWith(`${zone.id}-v2-`))).toBe(true);
      expect(zone.pages.every(p=>p.id.startsWith(`${zone.id}-v2-`))).toBe(true);
      expect(zone.puzzle.steps).toEqual([]);
      expect(zone.scene?.some(object=>object.id===zone.puzzle.world?.exit)).toBe(true);
    }
  });

  it('rejects every highest-overlap candidate at every physical puzzle decision',()=>{
    for(const zone of content.zones){
      const audit=naiveActionAudit(zone);
      expect(audit.passes,zone.id).toBe(true);expect(audit.steps.length).toBeGreaterThanOrEqual(6);
      for(const step of audit.steps){expect(step.applicable).toBe(true);expect(step.fails).toBe(true);expect(step.expectedScore).toBeLessThan(step.maxScore);}
    }
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
  it('keeps the two dated letters and the promised reunion on the same day',()=>{
    const letters=content.zones.find(zone=>zone.id==='lettres')!;
    const first=letters.evidence.find(e=>e.id==='lettres-v2-e-luc-letter')!.text;
    const reply=letters.evidence.find(e=>e.id==='lettres-v2-e-claire-letter')!.text;
    const firstDay=Number(/^\d+/u.exec(first)![0]),replyDay=Number(/^\d+/u.exec(reply)![0]);
    expect(replyDay).toBe(firstDay+1);
    expect(first).toContain('Je reviens demain à six heures.');
    expect(reply).toContain('Aujourd’hui, notre rendez-vous est à six heures.');
  });

  it('passes every structural and encounter-content invariant', () => {
    expect(validateContent(content)).toEqual([]);
  }, 30_000);
});
