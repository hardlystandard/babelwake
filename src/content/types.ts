export type ZoneId = 'atelier' | 'marche' | 'cafe' | 'gare' | 'maison' | 'lettres';
export interface Lexeme { id: string; lemma: string; forms: string[]; zone: ZoneId; }
export interface Picture { kind: string; color?: string; count?: number; detail?: string; label?: string; }
export interface Evidence { id: string; station?: string; title: string; text: string; words: string[]; picture: Picture; position: [number, number]; kind: 'object' | 'person' | 'note' | 'sign'; }
export interface Slot { id: string; answer: string; picture: Picture; }
export interface JournalPage { id: string; title: string; zone: ZoneId; kind: 'vocabulary' | 'grammar'; words: string[]; distractors?: string[]; slots: Slot[]; }
export interface PuzzleStep { id: string; prompt: string; picture: Picture; choices: string[]; answer: string; }
export interface Puzzle { id: string; title: string; instruction: string; requiredPages: string[]; steps: PuzzleStep[]; success: string; }
export interface Zone { id: ZoneId; title: string; subtitle: string; color: string; accent: string; intro: string; evidence: Evidence[]; pages: JournalPage[]; puzzle: Puzzle; }
export interface Content { lexicon: Lexeme[]; zones: Zone[]; }
