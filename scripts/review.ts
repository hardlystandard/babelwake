import { writeFile, mkdir } from 'node:fs/promises';
import { canonicalLexemeId, loadContent } from '../src/content/index';
import { renderedPictureText, situatedMigrationDebt, situatedVisibleText } from '../src/content/validator';
import { journalFrame } from '../src/ui/journal-frame';
const content=await loadContent();
const testedCanonical=new Set(content.zones.flatMap(z=>z.pages.flatMap(p=>p.words.map(canonicalLexemeId))));
const migration=situatedMigrationDebt(content);
const situated=content.zones.filter(zone=>zone.design==='situated');
const flags:[string,string][]=[
 ['Le livre va dans la boîte. La boîte est sous la table rouge.', 'Replaces the old elliptical workorder with two complete short sentences. Native review of the linked spatial referent is still pending.'],
 ['Pour lui. Il a la bouteille verte.', 'Check the short addressed payment request against the actual bottle-holder and the deliberately plausible wrong recipient.'],
 ['Tu portes bien le plateau.', 'The balanced carrying scene teaches bien; check whether this is the most natural short encouragement in metropolitan French.'],
 ['Anne, mon parent.', 'The singular generic kinship noun needs native review; the family scene supplies the mother relationship without an English gloss.'],
 ['Je veux retrouver ma lettre. La même lettre.', 'Check the repetition and whether it naturally distinguishes recovering the same object from meeting a person again.']
];
const superseded:[string,string][]=[
 ['Le livre. → Dans la boîte sous la table rouge.', 'Two complete workorder sentences now identify the object, destination and nested location.'],
 ['La bouteille verte est avec le panier.', 'The bottle is now physically placed on a specified table; avec is taught by actual basket contents.'],
 ['Le train va de la gare à la maison de Claire.', 'The timetable now routes to the gare du Nord or gare du Sud, with actual platforms.'],
 ['Attendez devant le train.', 'Waiting now happens sur le quai, safely beside the train.'],
 ['Le train pour la maison de Claire', 'The destination is now a named station service.']
];
const mark=(line:string)=>flags.some(([match])=>line.includes(match))?' ⚑':'';
const escape=(line:string)=>line.replaceAll('|','\\|').replaceAll('\n',' ');
const lines=['# Babelwake — revue du français','',
 '> Generated with `npm run content:review`. This is a review inventory, not a claim of native-speaker approval. All visible French, including puzzle alternatives and labels, is listed below. World content remains untranslated.','',
 `Six zones; ${content.lexicon.length} lexicon entries; ${testedCanonical.size} distinct canonical lemmas tested across ${content.zones.reduce((n,z)=>n+z.pages.length,0)} confirmation pages. Inflected entries share a lemma; entry count is not a count of distinct lemmas.`, '',
 '## Portée de la migration située','',
 `Situated validation applies to: ${situated.map(zone=>zone.title).join(', ')}. Remaining legacy zones: ${migration.length}. The same physical evidence, text budgets, tracked forms and action rules apply throughout the journey.`, '',
 '| Zone deferred to PR B | New-rule violations | Untracked-text records | Encounter-order cap |',
 '| --- | --- | --- | --- |',
 ...migration.map(debt=>`| ${debt.zone} | ${debt.violations.length} | ${debt.violations.filter(error=>error.includes('untracked French tokens')).length} | ${content.zones.find(zone=>zone.id===debt.zone)?.encounterOrder?'checked':'not measurable: no situated encounter order'} |`), '',
 ...migration.flatMap(debt=>debt.violations.filter(error=>error.includes('untracked French tokens')).slice(0,2).map(error=>`- PR B debt (${debt.zone}): ${escape(error)}`)), '',
 '## Phrases à revoir','',...flags.map(([quote,note])=>`- ⚑ « ${quote} » — ${note}`),'', '## Earlier review flags replaced by authored corrections','',...superseded.map(([quote,note])=>`- « ${quote} » — ${note}`),'','These replacements address the design/setting concerns; they do not constitute native-speaker approval.','',
 '## Review boundaries','',
 '- Check accents, elision, gender, number, register, and metropolitan usage.',
 '- Review every scenery exemption: it must be a proper name or noninteractive set dressing, never a tested target or required operational instruction.',
 '- Confirm every illustrated context is semantically distinct. Automated checks compare actual rendered SVGs and physical references, but cannot prove that a scene teaches a meaning without ambiguity.',
 '- For situated content, verify every spoken/sign/note token, the two-new-surface-form encounter order, environmental grammar contrasts and physical puzzle clues. Passing those checks is not native-speaker or beginner acceptance.',
 '- Check that every puzzle answer follows from visible evidence; automated golden paths establish reachability, not educational inferability.',
 '- No native-speaker review or zero-French timed playtest has been performed by this generator.',''];
for(const zone of content.zones){
 lines.push(`## ${zone.title}`,'',...(zone.subtitle?[`**${zone.subtitle}**`,'']:[]),...(zone.intro?[zone.intro+mark(zone.intro),'']:[]),zone.design==='situated'?'**Situated design checks apply.**':'**PR B debt — legacy content, not yet migrated.**','','### Rencontres','','| ID | Texte français |','| --- | --- |');
 for(const e of zone.evidence)lines.push(`| ${e.id} | ${zone.design==='situated'?'':`**${escape(e.title)}** — `}${escape(e.text)}${mark(e.text)}${e.picture.label?` · « ${escape(e.picture.label)} »`:''} |`);
 if(zone.scene?.length){lines.push('','### Écriture sur les objets','');for(const object of zone.scene){if(object.label)lines.push(`- ${object.id} : « ${escape(object.label)} »`);for(const label of object.labels??[])lines.push(`- ${object.id} (${label.surface}) : « ${escape(label.text)} »`);}}
 const drawn=[...situatedVisibleText(zone).filter(line=>line.id.includes('/picture/')),...(zone.design==='situated'?[]:zone.evidence.flatMap(e=>renderedPictureText(e.picture).map((text,i)=>({id:`${e.id}/picture/${i}`,text}))))];
 if(drawn.length){lines.push('','### Texte dans les illustrations','');for(const line of drawn)lines.push(`- ${line.id} : « ${escape(line.text)} »`);}
 lines.push('','### Carnet','');
 for(const page of zone.pages){lines.push(`- **${page.id} — ${page.title}** : ${page.words.join(' · ')}${page.distractors?.length?` ; autres mots : ${page.distractors.join(' · ')}`:''}`);if(zone.design!=='situated')lines.push(`  - Interface : ${Object.values(journalFrame(page,false)).map(escape).join(' · ')}`);if(page.requiresEvidence?.length)lines.push(`  - Contrastes déjà rencontrés : ${page.requiresEvidence.join(' · ')}`);for(const slot of page.slots)if(slot.picture.label)lines.push(`  - ${slot.id} : « ${slot.picture.label} »`);}
 lines.push('','### Mécanisme','',`**${zone.puzzle.title}**`, '',zone.puzzle.instruction,'');
 if(zone.puzzle.world){lines.push('Expected physical sequence (internal data for review, never a player translation):','');for(const [index,action] of zone.puzzle.world.sequence.entries())lines.push(`- ${index+1}. ${JSON.stringify(action)} · preuve : ${zone.puzzle.world.clues[index]??'MISSING'}`);lines.push('');}
 for(const step of zone.puzzle.steps){lines.push(`- **${step.id}** : ${step.prompt}${mark(step.prompt)}`);for(const choice of step.choices)lines.push(`  - « ${choice} »${mark(choice)}`);if(step.picture.label)lines.push(`  - Illustration : « ${step.picture.label} »`);}
 lines.push('',zone.puzzle.success,'');
}
lines.push('## Formes liées aux lemmes','','| Entrée | Lemme | Formes |','| --- | --- | --- |');
for(const word of content.lexicon)lines.push(`| ${word.id} | ${word.lemma} | ${word.forms.join(' · ')} |`);
await mkdir('content',{recursive:true});
await writeFile('content/REVIEW.md',lines.join('\n')+'\n');
console.log(`Generated content/REVIEW.md (${content.zones.reduce((n,z)=>n+z.evidence.length,0)} encounter records).`);
