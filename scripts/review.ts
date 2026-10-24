import { writeFile, mkdir } from 'node:fs/promises';
import { loadContent } from '../src/content/index';
const content=await loadContent();
const testedCanonical=new Set(content.zones.flatMap(z=>z.pages.flatMap(p=>p.words)).map(id=>content.lexicon.find(w=>w.id===id)?.lemma).filter(Boolean));
const flags:[string,string][]=[
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
 '## Phrases à revoir','',...flags.map(([quote,note])=>`- ⚑ « ${quote} » — ${note}`),'',
 '## Review boundaries','',
 '- Check accents, elision, gender, number, register, and metropolitan usage.',
 '- Confirm every illustrated context is semantically distinct. The automated validator checks structure and distinct picture data; it cannot prove that an illustration teaches a meaning without ambiguity.',
 '- Check that every puzzle answer follows from visible evidence; automated golden paths establish reachability, not educational inferability.',
 '- No native-speaker review or zero-French timed playtest has been performed by this generator.',''];
for(const zone of content.zones){
 lines.push(`## ${zone.title}`,'',`**${zone.subtitle}**`, '',zone.intro+mark(zone.intro),'','### Rencontres','','| ID | Texte français |','| --- | --- |');
 for(const e of zone.evidence)lines.push(`| ${e.id} | **${escape(e.title)}** — ${escape(e.text)}${mark(e.text)}${e.picture.label?` · « ${escape(e.picture.label)} »`:''} |`);
 lines.push('','### Carnet','');
 for(const page of zone.pages){lines.push(`- **${page.id} — ${page.title}** : ${page.words.join(' · ')}${page.distractors?.length?` ; autres mots : ${page.distractors.join(' · ')}`:''}`);for(const slot of page.slots)if(slot.picture.label)lines.push(`  - ${slot.id} : « ${slot.picture.label} »`);}
 lines.push('','### Mécanisme','',`**${zone.puzzle.title}**`, '',zone.puzzle.instruction,'');
 for(const step of zone.puzzle.steps){lines.push(`- **${step.id}** : ${step.prompt}${mark(step.prompt)}`);for(const choice of step.choices)lines.push(`  - « ${choice} »${mark(choice)}`);if(step.picture.label)lines.push(`  - Illustration : « ${step.picture.label} »`);}
 lines.push('',zone.puzzle.success,'');
}
lines.push('## Formes liées aux lemmes','','| Entrée | Lemme | Formes |','| --- | --- | --- |');
for(const word of content.lexicon)lines.push(`| ${word.id} | ${word.lemma} | ${word.forms.join(' · ')} |`);
await mkdir('content',{recursive:true});
await writeFile('content/REVIEW.md',lines.join('\n')+'\n');
console.log(`Generated content/REVIEW.md (${content.zones.reduce((n,z)=>n+z.evidence.length,0)} encounter records).`);
