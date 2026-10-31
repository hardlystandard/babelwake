import { writeFile, mkdir } from 'node:fs/promises';
import { canonicalLexemeId, loadContent } from '../src/content/index';
import { renderedPictureText, situatedMigrationDebt, situatedVisibleText } from '../src/content/validator';
import { journalFrame } from '../src/ui/journal-frame';
const content=await loadContent();
const testedCanonical=new Set(content.zones.flatMap(z=>z.pages.flatMap(p=>p.words.map(canonicalLexemeId))));
const migration=situatedMigrationDebt(content);
const situated=content.zones.filter(zone=>zone.design==='situated');
const flags:[string,string][]=[
 ['Le livre. → Dans la boîte sous la table rouge.', 'Elliptical workshop instruction split across an object label and an arrow-led destination. Native review should check its punctuation and clarity on the physical notice board.'],
 ['La bouteille verte est avec le panier.', 'Grammatical but less natural than a precise spatial phrase; review whether the pictured grouping makes « avec » idiomatic.'],
 ['Le train va de la gare à la maison de Claire.', 'Fictional miniature railway stops beside a house; verify the destination wording reads naturally in this setting.'],
 ['Attendez devant le train.', 'Spatial teaching sentence: review against the platform illustration so « devant » means in front of the visible train, without implying standing on the track.'],
 ['Le train pour la maison de Claire', 'Fictional destination; native review should confirm that a named house works as the stop label.']
];
const mark=(line:string)=>flags.some(([match])=>line.includes(match))?' ⚑':'';
const escape=(line:string)=>line.replaceAll('|','\\|').replaceAll('\n',' ');
const lines=['# Babelwake — revue du français','',
 '> Generated with `npm run content:review`. This is a review inventory, not a claim of native-speaker approval. All visible French, including puzzle alternatives and labels, is listed below. World content remains untranslated.','',
 `Six zones; ${content.lexicon.length} lexicon entries; ${testedCanonical.size} distinct canonical lemmas tested across ${content.zones.reduce((n,z)=>n+z.pages.length,0)} confirmation pages. Inflected entries share a lemma; entry count is not a count of distinct lemmas.`, '',
 '## Portée de la migration située','',
 `PR A validates the situated design only for: ${situated.map(zone=>zone.title).join(', ') || 'none yet'}. The other ${migration.length} zones retain their existing structural checks and are explicitly deferred to PR B. Their paragraph evidence, incidental vocabulary, captioned journal pages and multiple-choice mechanisms have not been declared corrected.`, '',
 '| Zone deferred to PR B | New-rule violations | Untracked-text records | Encounter-order cap |',
 '| --- | --- | --- | --- |',
 ...migration.map(debt=>`| ${debt.zone} | ${debt.violations.length} | ${debt.violations.filter(error=>error.includes('untracked French tokens')).length} | ${content.zones.find(zone=>zone.id===debt.zone)?.encounterOrder?'checked':'not measurable: no situated encounter order'} |`), '',
 ...migration.flatMap(debt=>debt.violations.filter(error=>error.includes('untracked French tokens')).slice(0,2).map(error=>`- PR B debt (${debt.zone}): ${escape(error)}`)), '',
 '## Phrases à revoir','',...flags.map(([quote,note])=>`- ⚑ « ${quote} » — ${note}`),'',
 '## Review boundaries','',
 '- Check accents, elision, gender, number, register, and metropolitan usage.',
 '- Review every scenery exemption: it must be a proper name or noninteractive set dressing, never a tested target or required operational instruction.',
 '- Confirm every illustrated context is semantically distinct. Automated checks compare actual rendered SVGs and physical references, but cannot prove that a scene teaches a meaning without ambiguity.',
 '- For situated content, verify every spoken/sign/note token, the two-new-surface-form encounter order, environmental grammar contrasts and physical puzzle clues. Passing those checks is not native-speaker or beginner acceptance.',
 '- Check that every puzzle answer follows from visible evidence; automated golden paths establish reachability, not educational inferability.',
 '- No native-speaker review or zero-French timed playtest has been performed by this generator.',''];
for(const zone of content.zones){
 lines.push(`## ${zone.title}`,'',...(zone.subtitle?[`**${zone.subtitle}**`,'']:[]),...(zone.intro?[zone.intro+mark(zone.intro),'']:[]),zone.design==='situated'?'**PR A — situated design checks apply.**':'**PR B debt — legacy content, not yet migrated.**','','### Rencontres','','| ID | Texte français |','| --- | --- |');
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
