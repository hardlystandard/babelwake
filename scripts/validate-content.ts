import { canonicalLexemeId, loadContent } from '../src/content/index';
import { validateContent } from '../src/content/validator';
const content = await loadContent();
const errors = validateContent(content);
if (errors.length) {
  console.error(`Content validation failed (${errors.length}):\n${errors.map(e => `  • ${e}`).join('\n')}`);
  process.exitCode = 1;
} else {
  const canonical = new Set(content.lexicon.map(word => canonicalLexemeId(word.id)));
  const tested = new Set(content.zones.flatMap(zone => zone.pages.flatMap(page => page.words.map(canonicalLexemeId))));
  console.log(`Content verified: ${content.zones.length} zones, ${canonical.size} canonical lemmas (${content.lexicon.length} lexical entries), ${tested.size} tested canonical lemmas, ${content.zones.reduce((n,z) => n + z.pages.length, 0)} required journal pages. Semantic ambiguity and idiom require human review.`);
}
