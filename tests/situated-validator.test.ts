import { describe, expect, it, vi } from 'vitest';
import type { JournalPage, Lexeme, Zone } from '../src/content/types';
import { frenchWordCount, mapFrenchText, visibleLexemeIds } from '../src/content/forms';
import * as frame from '../src/ui/journal-frame';
import { physicalSituationSignature } from '../src/content/situated-validator';
import { situatedMigrationDebt, validateContent, validateSituatedZone } from '../src/content/validator';

const lexicon: Lexeme[] = [
  ['clé', ['clé', 'clés']], ['porte', ['porte', 'portes']], ['livre', ['livre', 'livres']],
  ['rouge', ['rouge', 'rouges']], ['bleu', ['bleu', 'bleue']], ['je', ['je', 'j’']],
  ['avoir', ['avoir', 'ai', 'as', 'a']], ['le', ['le', 'l’']], ['eau', ['eau']],
  ['qu’est-ce que', ['qu’est-ce que']], ['tu', ['tu']], ['il', ['il']],
  ['être', ['être', 'suis', 'es', 'est']],
].map(([id, forms]) => ({ id: id as string, lemma: id as string, forms: forms as string[], zone: 'atelier' }));

function fixture(): Zone {
  return { id: 'atelier', title: '◇', subtitle: '', intro: '', color: '#aaa', accent: '#000', scenery: ['Claire'],
    // The strict helper does not require the production migration flag.
    scene: [
      { id: 'key', kind: 'key', position: [0, 0], portable: true, label: 'clé' },
      { id: 'door', kind: 'door', position: [3, 0], portable:true, operations: ['open'], label: 'porte' },
    ],
    evidence: [
      { id: 'e-key', title: 'internal key identifier', text: 'Clé', words: ['clé'], picture: { kind: 'key' }, position: [0, 0], kind: 'object', anchor: 'key', surface: 'top' },
      { id: 'e-door', title: 'internal door identifier', text: 'Porte', words: ['porte'], picture: { kind: 'door' }, position: [3, 0], kind: 'sign', anchor: 'door', surface: 'sign' },
    ], encounterOrder: ['e-key', 'e-door'], pages: [],
    puzzle: { id: 'puzzle', title: '◇', instruction: '', success: '◇', requiredPages: [], steps: [], world: { sequence: [{ kind: 'take', object: 'key' }], clues: ['e-door'] } },
  };
}
function page(): JournalPage {
  return { id: 'page', title: '◇', zone: 'atelier', kind: 'vocabulary', words: ['clé', 'porte', 'livre'],
    slots: [{ id: 'a', answer: 'clé', picture: { kind: 'key' } }, { id: 'b', answer: 'porte', picture: { kind: 'door' } }, { id: 'c', answer: 'livre', picture: { kind: 'book' } }] };
}
const errors = (zone: Zone) => validateSituatedZone(zone, lexicon).join('\n');

describe('French lexical coverage', () => {
  it('maps longest phrases, elisions and hyphenated components without folding accents', () => {
    const result = mapFrenchText('Qu’est-ce que j’ai ? L’eau. Porte-clé.', lexicon);
    expect(result.unmapped).toEqual([]);
    expect(result.forms.map(token => token.form)).toEqual(["qu'est-ce que", "j'", 'ai', "l'", 'eau', 'porte', 'clé']);
    expect(mapFrenchText('cle', lexicon).unmapped.map(token => token.form)).toEqual(['cle']);
  });
  it('does not silently treat an unknown apostrophe or hyphen component as covered', () => {
    expect(mapFrenchText('L’inconnu et porte-truc', lexicon).unmapped.map(token => token.form)).toEqual(['inconnu', 'et', 'truc']);
  });
  it('treats a declared proper name as scenery, not a tracked learning target', () => {
    expect(mapFrenchText('Claire', lexicon, ['Claire']).forms[0]).toMatchObject({ form: 'claire', scenery: true, lexemeIds: [] });
  });
  it('counts ordinary written words rather than splitting elisions into extra words', () => {
    expect(frenchWordCount('J’ai une clé jaune.')).toBe(4);
  });
});

describe('strict situated validator', () => {
  it('accepts a physical, lexically closed fixture without requiring a migration flag', () => expect(validateSituatedZone(fixture(), lexicon)).toEqual([]));
  it.each(['prends', 'sans', 'montre', 'attend', 'près', 'gauche', 'devant', 'deux', 'trois', 'père', 'mère', 'famille', 'maison'])(
    'rejects previously incidental untracked French: %s', form => {
      const zone = fixture(); zone.evidence[0].text = form;
      expect(errors(zone)).toContain(`untracked French tokens: ${form}`);
    });
  it('checks physical scene labels and puzzle text, not just encounter prose', () => {
    const zone = fixture(); zone.scene![0].label = 'inconnu'; zone.puzzle.instruction = 'attend';
    expect(errors(zone)).toContain('key/label/0: untracked French tokens: inconnu');
    expect(errors(zone)).toContain('puzzle/instruction: untracked French tokens: attend');
  });
  it('keeps evidence titles internal, including their vocabulary and paragraphs', () => {
    const zone = fixture(); zone.evidence[0].title = 'prends sans montre\n\nattend père mère';
    expect(validateSituatedZone(zone, lexicon)).toEqual([]);
  });
  it('never treats hidden evidence SVG captions as visible language or prior exposure', () => {
    const zone=fixture(); zone.evidence[0].picture.label='montre attend près';
    expect(validateSituatedZone(zone,lexicon)).toEqual([]);
    zone.evidence[0].picture.label='rouge bleu livre';
    zone.evidence[1].text='rouge bleu livre';
    expect(errors(zone)).toContain('introduces 4 new visible forms (maximum 2): rouge, bleu, livre, porte');
  });
  it('limits scenery to 15 words and never permits a tested word to be exempted', () => {
    const zone = fixture(); zone.scenery = Array.from({ length: 16 }, (_, i) => `Nom${i}`);
    expect(errors(zone)).toContain('scenery allowlist exceeds 15 words');
    zone.scenery = ['clés']; zone.pages = [page()];
    expect(errors(zone)).toContain('scenery form « clés » is tested');
  });
  it('rejects signs over four words and NPC lines over eight', () => {
    const zone = fixture(); zone.evidence[0].text = 'clé porte livre rouge bleu';
    expect(errors(zone)).toContain('sign/label exceeds 4 words');
    zone.evidence[0].kind = 'person'; zone.evidence[0].surface = 'speech'; zone.evidence[0].text = Array(9).fill('clé').join(' ');
    expect(errors(zone)).toContain('NPC speech exceeds 8 words');
  });
  it('cannot use a note kind to bypass the actual rendered speech budget', () => {
    const zone=fixture(); zone.evidence[0].kind='note'; zone.evidence[0].surface='speech';
    zone.evidence[0].text='clé clé clé clé clé. clé clé clé clé.';
    expect(errors(zone)).toContain('NPC speech exceeds 8 words');
    expect(errors(zone)).toContain('note evidence must use the physical note surface');
  });
  it('does not let unanchored scene labels introduce unseen forms outside encounterOrder', () => {
    const zone=fixture(); zone.scene!.push({id:'extra',kind:'sign',position:[6,0],label:'rouge bleu livre'});
    expect(errors(zone)).toContain('scene label forms have no ordered encounter exposure: rouge, bleu, livre');
  });
  it('rejects paragraph notes and notes with more than two short sentences', () => {
    const zone = fixture(); zone.evidence[0].kind = 'note'; zone.evidence[0].surface = 'note';
    zone.evidence[0].text = 'Clé. Porte. Livre.';
    expect(errors(zone)).toContain('notes allow at most 2 short sentences');
    zone.evidence[0].text = 'Clé.\n\nPorte.';
    expect(errors(zone)).toContain('paragraph-style evidence is forbidden');
    zone.evidence[0].text = Array(9).fill('clé').join(' ') + '.';
    expect(errors(zone)).toContain('notes allow at most 2 short sentences');
  });
  it('rejects short conjugation paradigms even when they fit the speech budget', () => {
    const zone = fixture(); zone.evidence[0].kind = 'person'; zone.evidence[0].surface = 'speech'; zone.evidence[0].text = 'Je suis tu es il est';
    expect(errors(zone)).toContain('conjugation paradigms must be replaced');
  });
  it('rejects bare known-pronoun paradigms', () => {
    const zone=fixture(); zone.evidence[0].kind='person'; zone.evidence[0].surface='speech'; zone.evidence[0].text='je / tu / il';
    expect(validateSituatedZone(zone,lexicon,{initialKnownForms:['je','tu','il']}).join('\n')).toContain('conjugation paradigms must be replaced');
  });
  it('requires a complete, unique encounter order', () => {
    const zone = fixture(); zone.encounterOrder = ['e-key', 'e-key', 'missing'];
    expect(errors(zone)).toContain('encounterOrder repeats');
    expect(errors(zone)).toContain('encounterOrder references unknown evidence missing');
    expect(errors(zone)).toContain('encounterOrder omits e-door');
  });
  it('caps unseen surface forms at two and does not collapse bleu and bleue into one exposure', () => {
    const zone = fixture(); zone.scene!.forEach(object => { delete object.label; });
    zone.evidence[0].text = 'bleu'; zone.evidence[1].text = 'bleue rouge livre';
    expect(errors(zone)).toContain('introduces 3 new visible forms (maximum 2): bleue, rouge, livre');
  });
  it('forbids every inflected answer form in page titles and rendered slot labels', () => {
    const zone = fixture(); zone.pages = [page()]; zone.pages[0].title = 'Clés'; zone.pages[0].slots[1].picture.label = 'La porte';
    expect(errors(zone)).toContain('page/title: journal label reveals an answer form: clés');
    expect(errors(zone)).toContain('journal label reveals an answer form: porte');
  });
  it('checks the actual matching chrome, keeping shared article answers out of the situated frame', () => {
    const zone=fixture(); zone.pages=[page()]; zone.pages[0].words=['le','la','les'];
    zone.pages[0].slots.forEach((slot,i)=>{slot.answer=zone.pages[0].words[i];});
    const words=[...lexicon,{id:'la',lemma:'la',forms:['la'],zone:'atelier' as const},{id:'les',lemma:'les',forms:['les'],zone:'atelier' as const}];
    expect(validateSituatedZone(zone,words).filter(error=>error.includes('/frame/'))).toEqual([]);
    const oldFrame=vi.spyOn(frame,'journalFrame').mockReturnValue({back:'← Les pages',section:'LES LIENS',dialog:'Le carnet',overline:'CE QUE JE COMPRENDS',close:'Fermer'});
    try { expect(validateSituatedZone(zone,words).join('\n')).toContain('page/frame/back: journal label reveals an answer form: les'); }
    finally { oldFrame.mockRestore(); }
  });
  it('forbids fill-in-the-blank labels', () => {
    const zone = fixture(); zone.pages = [page()]; zone.pages[0].slots[0].picture.label = '___';
    expect(errors(zone)).toContain('fill-in-the-blank journal labels are forbidden');
  });
  it('allows a natural terminal ellipsis in a fully valid page but rejects actual blank templates', () => {
    const zone=fixture(); zone.design='situated'; zone.scene=[]; zone.evidence=[]; zone.scenery=['Claire'];
    const nouns=[{id:'clé',kind:'key'},{id:'porte',kind:'door'},{id:'livre',kind:'book'}];
    for(const [row,noun] of nouns.entries()) for(let n=0;n<3;n++) {
      const id=`${noun.kind}-${n}`;
      zone.scene.push({id,kind:noun.kind,position:[n*3,row*3],label:noun.id,...((row===0||row===1)&&n===0?{portable:true}:{}),...(row===1&&n===0?{operations:['open' as const]}:{})});
      zone.evidence.push({id:`e-${id}`,title:`internal-${id}`,text:noun.id,words:[noun.id],anchor:id,surface:'top',kind:'object',picture:{kind:noun.kind},position:[n*3,row*3]});
    }
    zone.scene.push({id:'salutation',kind:'note',position:[9,0],label:'Chère Claire'});
    zone.evidence.push({id:'e-salutation',title:'internal-note',text:'Chère Claire.',words:['cher'],anchor:'salutation',surface:'note',kind:'note',picture:{kind:'letter'},position:[9,0]});
    zone.encounterOrder=zone.evidence.map(e=>e.id); zone.pages=[page()]; zone.puzzle.requiredPages=['page'];
    zone.puzzle.world={sequence:[{kind:'take',object:'key-0'}],clues:['e-door-0']};
    const words=[...lexicon.filter(word=>nouns.some(noun=>noun.id===word.id)),{id:'cher',lemma:'cher',forms:['cher','chère'],zone:'atelier' as const}];
    for(const caption of ['Chère Claire…','Chère Claire...']) {
      zone.pages[0].slots[0].picture.label=caption;
      expect(validateContent({lexicon:words,zones:[zone]}),caption).toEqual([]);
    }
    for(const caption of ['___','□','▢','[ ]','( )','…','...','Claire … Claire','Claire... Claire']) {
      zone.pages[0].slots[0].picture.label=caption;
      expect(validateContent({lexicon:words,zones:[zone]}).join('\n'),caption).toContain('fill-in-the-blank journal labels are forbidden');
    }
  });
  it('requires three distinct anchored environmental contrasts for a grammar page', () => {
    const zone = fixture(); zone.pages = [{ ...page(), kind: 'grammar', requiresEvidence: ['e-key', 'e-door'] }];
    expect(errors(zone)).toContain('grammar contrast requires at least 3 environmental evidence contexts');
    zone.pages[0].requiresEvidence!.push('missing');
    expect(errors(zone)).toContain('unknown contrast evidence missing');
  });
  it('does not manufacture physical grammar contrasts from three hidden SVG metadata pictures', () => {
    const zone=fixture();
    zone.evidence.push({...zone.evidence[0],id:'e-third',picture:{kind:'book'}});
    zone.evidence[1]={...zone.evidence[1],anchor:'key'};
    zone.encounterOrder!.push('e-third');
    zone.pages=[{...page(),kind:'grammar',requiresEvidence:['e-key','e-door','e-third']}];
    expect(errors(zone)).toContain('grammar contrast needs 3 distinct physical situations');
  });
  it('validates placement, pose, demonstration and exit references', () => {
    const zone=fixture(); zone.scene![0].placement={target:'missing',relation:'on'};
    zone.scene![1].pose={pointsTo:'missing'};
    zone.evidence[0].pose={holds:'missing'};
    zone.evidence[0].demonstration={actor:'missing',action:{kind:'take',object:'missing'}};
    zone.puzzle.world!.exit='missing';
    const result=errors(zone);
    expect(result).toContain('invalid initial placement/container reference');
    expect(result).toContain('pose references unknown scene objects');
    expect(result).toContain('demonstration actor must reference a physical NPC');
    expect(result).toContain('demonstration action references unknown scene objects');
    expect(result).toContain('physical exit references an unknown scene object');
  });
  it('validates and distinguishes focus-only third-person actor poses', () => {
    const zone=fixture(); zone.scene!.push({id:'teacher',kind:'npc',position:[6,0],label:'Claire'});
    const first={...zone.evidence[0],actorPoses:{teacher:{pointsTo:'key'}}};
    const second={...zone.evidence[0],actorPoses:{teacher:{pointsTo:'door'}}};
    expect(physicalSituationSignature(zone,first)).not.toBe(physicalSituationSignature(zone,second));
    zone.evidence[0].actorPoses={teacher:{holds:'missing'},missingActor:{pointsTo:'key'}};
    expect(errors(zone)).toContain('actorPoses references an unknown or non-NPC actor missingActor');
    expect(errors(zone)).toContain('actorPoses/teacher: pose references unknown scene objects');
  });
  it('rejects cycles in actual initial placements, including NPC holds', () => {
    const zone=fixture(); zone.scene![0].placement={target:'door',relation:'on'};
    zone.scene![1].placement={target:'key',relation:'on'};
    expect(errors(zone)).toContain('cyclic initial physical placement/holding');
  });
  it('rejects legacy multiple-choice mechanisms and physically impossible action sequences', () => {
    const zone = fixture(); zone.puzzle.steps = [{ id: 'old', prompt: 'clé', picture: { kind: 'key' }, choices: ['clé', 'porte', 'livre'], answer: 'clé' }];
    expect(errors(zone)).toContain('situated puzzle cannot use legacy multiple-choice steps');
    zone.puzzle.steps = []; zone.puzzle.world!.sequence = [{ kind: 'operate', object: 'door', operation: 'open', tool: 'key' }];
    expect(errors(zone)).toContain('physical action 1 is not applicable');
  });
  it('rejects a correct highest-overlap action, including a tie with a wrong action', () => {
    const zone = fixture(); zone.puzzle.world!.clues=['e-key'];
    expect(errors(zone)).toContain('naive token-overlap solver can choose physical action 1');
    zone.evidence[0].text='clé porte';
    expect(errors(zone)).toContain('naive token-overlap solver can choose physical action 1');
  });
  it('requires the naive solver to fail every physical step, not merely the whole sequence', () => {
    const zone = fixture();
    zone.puzzle.world!.sequence.push({kind:'operate',object:'door',operation:'open'});
    zone.puzzle.world!.clues.push('e-door');
    expect(errors(zone)).toContain('naive token-overlap solver can choose physical action 2');
  });
  it('never lets missing physical anchors or unknown action references pass', () => {
    const zone = fixture(); zone.evidence[0].anchor = 'missing'; zone.puzzle.world!.sequence[0] = { kind: 'take', object: 'missing' };
    expect(errors(zone)).toContain('existing physical anchor');
    expect(errors(zone)).toContain('references unknown scene objects');
  });
  it('counts repeated short labels in three real physical situations without inventing prose or hidden SVG variation', () => {
    const zone=fixture(); zone.design='situated'; zone.scenery=[]; zone.scene=[]; zone.evidence=[];
    const nouns=[{id:'clé',kind:'key'},{id:'porte',kind:'door'},{id:'livre',kind:'book'}];
    for(const [row,noun] of nouns.entries()) for(let n=0;n<3;n++) {
      const id=`${noun.kind}-${n}`;
      zone.scene.push({id,kind:noun.kind,position:[n*3,row*3],label:noun.id,...((row===0||row===1)&&n===0?{portable:true}:{}),...(row===1&&n===0?{operations:['open' as const]}:{})});
      zone.evidence.push({id:`e-${id}`,title:`internal-${id}`,text:noun.id,words:[noun.id],anchor:id,surface:'top',kind:'object',picture:{kind:noun.kind},position:[n*3,row*3]});
    }
    zone.encounterOrder=zone.evidence.map(e=>e.id); zone.pages=[page()]; zone.puzzle.requiredPages=['page'];
    zone.puzzle.world={sequence:[{kind:'take',object:'key-0'}],clues:['e-door-0']};
    const words=lexicon.filter(word=>nouns.some(noun=>noun.id===word.id));
    expect(validateContent({lexicon:words,zones:[zone]})).toEqual([]);
    zone.evidence.filter(e=>e.words.includes('clé')).forEach(e=>{e.anchor='key-0';});
    expect(validateContent({lexicon:words,zones:[zone]}).join('\n')).toContain('clé needs 3 distinct physical encounter situations');
  });
  it('cannot count cloned co-located props with different IDs as three physical contexts', () => {
    const zone=fixture();
    for(const [index,id] of ['clone-a','clone-b'].entries()) {
      zone.scene!.push({...zone.scene![0],id,portable:false,position:[0,0],rotation:(index+1)*Math.PI*2});
      zone.evidence.push({...zone.evidence[0],id:`e-${id}`,anchor:id});
    }
    zone.encounterOrder=zone.evidence.map(e=>e.id); zone.pages=[page()];
    const contexts=zone.evidence.filter(e=>e.words.includes('clé'));
    expect(new Set(contexts.map(e=>physicalSituationSignature(zone,e))).size).toBe(1);
    expect(errors(zone)).toContain('clé needs 3 distinct physical encounter situations');
  });
  it('resolves equivalent placements without target IDs and still distinguishes actual offsets', () => {
    const zone=fixture();
    zone.scene!.push({id:'table-a',kind:'table',position:[6,3]},{id:'table-b',kind:'table',position:[6,3]});
    zone.scene![0].placement={target:'table-a',relation:'on',offset:[.2,0,.3]};
    zone.scene!.push({...zone.scene![0],id:'clone',position:[99,99],placement:{target:'table-b',relation:'on',offset:[.2,0,.3]}});
    const first=physicalSituationSignature(zone,zone.evidence[0]);
    expect(physicalSituationSignature(zone,{...zone.evidence[0],anchor:'clone'})).toBe(first);
    zone.scene!.find(object=>object.id==='clone')!.placement!.offset=[.4,0,.3];
    expect(physicalSituationSignature(zone,{...zone.evidence[0],anchor:'clone'})).not.toBe(first);
  });
  it('resolves chair seats and scaled coffer interiors at their rendered support points', () => {
    const zone=fixture();
    zone.scene!.push({id:'support',kind:'chair',position:[6,3],size:2});
    zone.scene![0].placement={target:'support',relation:'on'};
    const anchorPosition=()=>JSON.parse(physicalSituationSignature(zone,zone.evidence[0])).anchor[1] as number[];
    expect(anchorPosition()[1]).toBeCloseTo(.73*2+.03);
    zone.scene!.find(object=>object.id==='support')!.kind='box';
    zone.scene!.find(object=>object.id==='support')!.size=.5;
    zone.scene![0].placement={target:'support',relation:'in',offset:[.1,.05,.2]};
    expect(anchorPosition()).toEqual([6.1,.45,3.2]);
    zone.scene!.find(object=>object.id==='support')!.kind='table';
    zone.scene![0].placement={target:'support',relation:'on'};
    expect(anchorPosition()[1]).toBeCloseTo(1.3*.5+.12);
  });
  it('does not distinguish otherwise identical demonstrations by participant IDs', () => {
    const zone=fixture();
    zone.scene!.push({...zone.scene![0],id:'clone',portable:false,position:[0,0]},
      {id:'actor-a',kind:'npc',position:[6,0]}, {id:'actor-b',kind:'npc',position:[6,0]});
    const first={...zone.evidence[0],anchor:'actor-a',demonstration:{actor:'actor-a',action:{kind:'take' as const,object:'key'}}};
    const second={...zone.evidence[0],anchor:'actor-b',demonstration:{actor:'actor-b',action:{kind:'take' as const,object:'clone'}}};
    expect(physicalSituationSignature(zone,first)).toBe(physicalSituationSignature(zone,second));
  });
  it('stages only explicitly migrated production zones and reports legacy debt', () => {
    const zone = fixture(); zone.evidence[0].text = 'prends';
    const content = { lexicon, zones: [zone] };
    expect(validateContent(content).some(error => error.includes('untracked French tokens'))).toBe(false);
    expect(situatedMigrationDebt(content)[0].violations.some(error => error.includes('untracked French tokens: prends'))).toBe(true);
    zone.design = 'situated';
    expect(validateContent(content).some(error => error.includes('untracked French tokens: prends'))).toBe(true);
  });
  it('does not mistake a carrying homograph for a door or merge their notes',()=>{
    const words:Lexeme[]=[{id:'porte',lemma:'porte',forms:['porte','portes'],zone:'atelier'},{id:'porter',lemma:'porter',forms:['porte','portes','portez'],zone:'cafe'}];
    expect(visibleLexemeIds('La porte.',words)).toEqual(['porte']);
    expect(visibleLexemeIds('Elle porte.',words,{porte:'porter'})).toEqual(['porter']);
    const zone=fixture();zone.evidence[0].senses={clé:'missing'};
    expect(errors(zone)).toContain('word sense must pin an actual visible tracked form');
  });
  it('tracks French printed on a physical ticket or photograph as well as DOM labels',()=>{
    const zone=fixture();zone.scene!.push({id:'receipt',kind:'receipt',position:[6,0],detail:'mot inconnu'});
    expect(errors(zone)).toContain('untracked French tokens: mot, inconnu');
    zone.scene!.at(-1)!.kind='photo';zone.scene!.at(-1)!.picture={kind:'note',label:'inconnu'};
    expect(errors(zone)).toContain('untracked French tokens: inconnu');
  });
  it('only counts differences that the new prop models actually render',()=>{
    const zone=fixture();zone.scene![0].kind='cup-coffee';zone.scene![0].detail='hot';
    const hot=physicalSituationSignature(zone,zone.evidence[0]);
    zone.scene![0].detail='cold';
    expect(physicalSituationSignature(zone,zone.evidence[0])).not.toBe(hot);
    zone.scene![0].kind='key';zone.scene![0].detail='unused-a';
    const ordinary=physicalSituationSignature(zone,zone.evidence[0]);
    zone.scene![0].detail='unused-b';
    expect(physicalSituationSignature(zone,zone.evidence[0])).toBe(ordinary);
    zone.scene![0].quantity=3;
    expect(physicalSituationSignature(zone,zone.evidence[0])).not.toBe(ordinary);
  });
  it('rejects invisible excess quantities and nonexistent travel demonstrations',()=>{
    const zone=fixture();zone.scene![0].quantity=21;
    zone.evidence[0].travel={actor:'missing',target:'missing'};
    expect(errors(zone)).toContain('quantity exceeds the actual rendered count limit');
    expect(errors(zone)).toContain('travel needs physical NPC actors');
    expect(errors(zone)).toContain('travel references an unknown destination');
  });
  it('does not confuse a compass abbreviation with a negation elision',()=>{
    const zone=fixture();zone.scenery=['N'];zone.pages=[{...page(),words:['ne…pas'],slots:[{id:'x',answer:'ne…pas',picture:{kind:'key'}}]}];
    const words=[...lexicon,{id:'ne…pas',lemma:'ne…pas',forms:['ne','n’','pas'],zone:'atelier' as const}];
    expect(validateSituatedZone(zone,words).some(error=>error.includes('scenery form'))).toBe(false);
  });
});
