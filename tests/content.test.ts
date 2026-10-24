import { describe, expect, it } from 'vitest';
import type { Content } from '../src/content/types';
import { validateContent } from '../src/content/validator';

function fixture(): Content {
  const words = ['pain', 'eau', 'clé'];
  const art: Record<string,string> = {pain:'bread',eau:'water',clé:'key'};
  return {
    lexicon: words.map(id => ({ id, lemma: id, forms: [id], zone: 'atelier' as const })),
    zones: [{ id: 'atelier', title: "L’atelier", subtitle: 'Les objets', intro: 'Bonjour.', color: '#aaa', accent: '#000',
      evidence: words.flatMap((id, i) => [0,1,2].map(n => ({ id: `${id}-${n}`, title: id,
        text: [`Voici ${id}.`, `Je prends ${id}.`, `Tu as ${id}.`][n], words: [id],
        picture: { kind: [art[id], 'person', 'bag'][n], detail: id }, position: [i,n] as [number,number], kind: 'object' as const }))),
      pages: [{ id:'objets', title:'Les objets', zone:'atelier', kind:'vocabulary', words,
        slots:words.map(id => ({ id,answer:id,picture:{kind:art[id]} })) }],
      puzzle: { id:'porte',title:'La porte',instruction:'Choisis.', requiredPages:['objets'],success:'Merci.',steps:[{
        id:'porte-cle',prompt:'Prends la clé.',picture:{kind:'clé'}, choices:['La clé','Le pain','L’eau'],answer:'La clé'
      }] }
    }]
  };
}

describe('content validator', () => {
  it('accepts fully evidenced, unique content', () => expect(validateContent(fixture())).toEqual([]));
  it('rejects a test before three encounters', () => {
    const c=fixture(); c.zones[0].evidence.shift();
    expect(validateContent(c).join('\n')).toContain('3 distinct encounter contexts');
  });
  it('does not count repeated contexts as three encounters', () => {
    const c=fixture(); c.zones[0].evidence[1].text=c.zones[0].evidence[0].text;
    expect(validateContent(c).join('\n')).toContain('3 distinct encounter contexts');
  });
  it('rejects words declared encountered but absent from the visible line', () => {
    const c=fixture(); c.zones[0].evidence[0].text='Bonjour.'; c.zones[0].evidence[0].title='Bonjour';
    expect(validateContent(c).join('\n')).toContain('no visible French form');
  });
  it('recognizes elided French forms as prefixes', () => {
    const c=fixture(); c.lexicon.push({id:'je',lemma:'je',forms:['je','j’'],zone:'atelier'});
    c.zones[0].evidence[0].text='J’ai du pain.'; c.zones[0].evidence[0].words.push('je');
    expect(validateContent(c)).toEqual([]);
  });
  it('does not introduce a never-seen representative form on a matching tile', () => {
    const c=fixture(); c.lexicon[0].forms=['pains','pain'];
    expect(validateContent(c).join('\n')).toContain('displayed form pains needs 3 distinct visible contexts');
  });
  it('recognizes the discontinuous ne…pas construction with ordinary and elided negation', () => {
    const c=fixture(); c.lexicon.push({id:'ne…pas',lemma:'ne…pas',forms:['ne','n’','pas'],zone:'atelier'});
    const lines=['Je ne prends pas de pain.', 'Tu n’as pas de pain.', 'Elle ne veut pas de pain.'];
    for (let i=0;i<3;i++) { c.zones[0].evidence[i].text=lines[i]; c.zones[0].evidence[i].words.push('ne…pas'); }
    c.zones[0].pages[0].distractors=['ne…pas'];
    expect(validateContent(c)).toEqual([]);
  });
  it('rejects an unencountered word on a page', () => {
    const c=fixture(); c.zones[0].pages[0].words.push('inconnu');
    expect(validateContent(c).join('\n')).toContain('orphan lemma reference');
  });
  it('rejects identical rendered drawings despite distinct metadata', () => {
    const c=fixture(); c.zones[0].pages[0].slots[1].picture={kind:'bread',detail:'unused-detail'};
    expect(validateContent(c).join('\n')).toContain('ambiguous duplicate vignettes');
  });
  it('rejects answers that cannot fill the supplied slots', () => {
    const c=fixture(); c.zones[0].pages[0].slots[0].answer='eau';
    expect(validateContent(c).join('\n')).toContain('unsolvable');
  });
  it('rejects English world strings but permits French homographs', () => {
    const c=fixture(); c.zones[0].intro='Click the door';
    expect(validateContent(c).join('\n')).toContain('English in world content');
    c.zones[0].intro='Le train arrive sur la table. Je trouve la clé. Il continue.';
    expect(validateContent(c)).toEqual([]);
  });
  it('rejects missing accents from the curated reference', () => {
    const c=fixture(); c.zones[0].intro='Le cafe est ouvert.';
    expect(validateContent(c).join('\n')).toContain('missing accent');
  });
  it('rejects unused lemmas and unknown lemma references', () => {
    const c=fixture(); c.lexicon.push({id:'soleil',lemma:'soleil',forms:['soleil'],zone:'atelier'});
    expect(validateContent(c).join('\n')).toContain('orphan lemma has no encounter');
  });
  it('rejects an inflection whose canonical lemma is absent', () => {
    const c=fixture(); c.lexicon[0].lemma='manger';
    expect(validateContent(c).join('\n')).toContain('orphan lemma target manger');
  });
  it('rejects empty lemma forms and duplicate lemma IDs', () => {
    const c=fixture(); c.lexicon[0].forms=[]; c.lexicon.push({...c.lexicon[1]});
    const errors=validateContent(c).join('\n');
    expect(errors).toContain('empty lemma/forms'); expect(errors).toContain('duplicate or empty lemma ID');
  });
  it('requires distractors to have the same encounter evidence as tested words', () => {
    const c=fixture(); c.lexicon.push({id:'porte',lemma:'porte',forms:['porte'],zone:'atelier'});
    c.zones[0].pages[0].distractors=['porte'];
    expect(validateContent(c).join('\n')).toContain('porte needs 3 distinct');
  });
  it('requires every local journal page to gate the zone puzzle', () => {
    const c=fixture(); c.zones[0].pages.push({...c.zones[0].pages[0],id:'facultative'});
    expect(validateContent(c).join('\n')).toContain('local page facultative is not required for progression');
  });
  it('rejects a puzzle prerequisite that can never be confirmed', () => {
    const c=fixture(); c.zones[0].puzzle.requiredPages.push('absente');
    expect(validateContent(c).join('\n')).toContain('unknown required page');
  });
  it('rejects impossible puzzle choices', () => {
    const c=fixture(); c.zones[0].puzzle.steps[0].answer='Bonjour';
    expect(validateContent(c).join('\n')).toContain('unsolvable answer absent');
  });
});
