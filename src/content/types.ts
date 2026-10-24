export type ZoneId = 'atelier' | 'marche' | 'cafe' | 'gare' | 'maison' | 'lettres';
export interface Lexeme { id: string; lemma: string; forms: string[]; zone: ZoneId; }
export interface Picture { kind: string; color?: string; count?: number; detail?: string; label?: string; }
export type TextSurface = 'sign' | 'top' | 'awning' | 'mat' | 'floor' | 'notice' | 'speech' | 'note';
export type PlaceRelation = 'in' | 'on' | 'under';
export type WorldOperation = 'open' | 'close' | 'turn' | 'press';
export interface ScenePlacement { target: string; relation: PlaceRelation; offset?: [number, number, number]; }
export interface ScenePose { holds?: string; pointsTo?: string; }
export interface SceneLabel { text: string; surface: TextSurface; offset?: [number, number, number]; }
export interface SceneObject {
  id: string;
  kind: string;
  position: [number, number];
  color?: string;
  size?: number | [number, number, number];
  rotation?: number;
  label?: string;
  labels?: SceneLabel[];
  portable?: boolean;
  container?: boolean;
  recipient?: boolean;
  operations?: WorldOperation[];
  toolKind?: string;
  accepts?: PlaceRelation[];
  placement?: ScenePlacement;
  pose?: ScenePose;
  containedBy?: string;
  open?: boolean;
}
export type WorldAction =
  | { kind: 'take'; object: string }
  | { kind: 'place'; object: string; target: string; relation: PlaceRelation }
  | { kind: 'combine'; object: string; target: string }
  | { kind: 'operate'; object: string; operation: WorldOperation; tool?: string }
  | { kind: 'deliver'; object: string; target: string };
/** Clues are evidence IDs, parallel to the complete expected sequence. */
export interface WorldPuzzle { sequence: WorldAction[]; clues: string[]; exit?: string; }
export interface Evidence { id: string; station?: string; pose?: ScenePose; actorPoses?: Record<string, ScenePose>; demonstration?: { actor: string; action: WorldAction }; anchor?: string; surface?: TextSurface; offset?: [number, number, number]; title: string; text: string; words: string[]; picture: Picture; position: [number, number]; kind: 'object' | 'person' | 'note' | 'sign'; }
export interface Slot { id: string; answer: string; picture: Picture; }
export interface JournalPage { id: string; title: string; zone: ZoneId; kind: 'vocabulary' | 'grammar'; words: string[]; distractors?: string[]; requiresEvidence?: string[]; slots: Slot[]; }
export interface PuzzleStep { id: string; prompt: string; picture: Picture; choices: string[]; answer: string; }
export interface Puzzle { id: string; legacyIds?: string[]; title: string; instruction: string; requiredPages: string[]; steps: PuzzleStep[]; world?: WorldPuzzle; success: string; }
export interface Zone { id: ZoneId; design?: 'situated'; scenery?: string[]; encounterOrder?: string[]; scene?: SceneObject[]; title: string; subtitle: string; color: string; accent: string; intro: string; evidence: Evidence[]; pages: JournalPage[]; puzzle: Puzzle; }
export interface Content { lexicon: Lexeme[]; zones: Zone[]; }
