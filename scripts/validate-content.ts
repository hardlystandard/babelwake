import { canonicalLexemeId, loadContent } from '../src/content/index';
import { situatedMigrationDebt, validateContent } from '../src/content/validator';
const content = await loadContent();
const errors = validateContent(content);
if (errors.length) {
  console.error(`Content validation failed (${errors.length}):\n${errors.map(e => `  • ${e}`).join('\n')}`);
  process.exitCode = 1;
} else {
  const canonical = new Set(content.lexicon.map(word => canonicalLexemeId(word.id)));
  const tested = new Set(content.zones.flatMap(zone => zone.pages.flatMap(page => page.words.map(canonicalLexemeId))));
  console.log(`Structural content verified: ${content.zones.length} zones, ${canonical.size} canonical lemmas (${content.lexicon.length} lexical entries), ${tested.size} tested canonical lemmas, ${content.zones.reduce((n,z) => n + z.pages.length, 0)} required journal pages. Semantic ambiguity and idiom require human review.`);
  const migrated = content.zones.filter(zone => zone.design === 'situated');
  const debt = situatedMigrationDebt(content);
  console.log(`Situated design validation: ${migrated.map(zone => zone.id).join(', ') || 'none'}; ${debt.length} legacy zones explicitly deferred to PR B.`);
  for (const row of debt) console.log(`  PR B debt — ${row.zone}: ${row.violations.length} new-rule violations (${row.violations.filter(error => error.includes('untracked French tokens')).length} untracked-text records; ${content.zones.find(zone => zone.id === row.zone)?.encounterOrder ? 'encounter cap checked' : 'encounter cap not measurable without a situated order'}).`);

}
