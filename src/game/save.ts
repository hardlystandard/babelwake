import { initialState, zoneOrder, type GameState, type Settings } from './state';
const DB_NAME = 'babelwake';
const STORE = 'saves';
const SLOT = 'journey';
const FALLBACK = 'babelwake.save.v1';
const invalid = (): never => { throw new Error('Invalid Babelwake save'); };
const plain = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const safeKey = (key: string): boolean => !['__proto__', 'prototype', 'constructor'].includes(key) && key.length > 0 && key.length <= 160;
function strings(value: unknown, limit: number): string[] {
  if (!Array.isArray(value) || value.length > limit || !value.every(item => typeof item === 'string' && safeKey(item))) return invalid();
  return [...new Set(value as string[])];
}
function stringMap(value: unknown, maxLength: number, maxEntries: number): Record<string, string> {
  if (!plain(value)) return invalid();
  const entries = Object.entries(value);
  if (entries.length > maxEntries || entries.some(([key, val]) => !safeKey(key) || typeof val !== 'string' || val.length > maxLength)) return invalid();
  return Object.fromEntries(entries) as Record<string, string>;
}
export function validateSave(value: unknown): GameState {
  if (!plain(value) || value.version !== 1 || !zoneOrder.includes(value.zone as GameState['zone'])) return invalid();
  if (typeof value.notes !== 'string' || value.notes.length > 100_000 || !plain(value.settings)) return invalid();
  const s = value.settings;
  if (typeof s.textSize !== 'number' || !Number.isFinite(s.textSize) || s.textSize < 0.75 || s.textSize > 2 || typeof s.contrast !== 'boolean' || typeof s.volume !== 'number' || !Number.isFinite(s.volume) || s.volume < 0 || s.volume > 1) return invalid();
  const controls = stringMap(s.controls, 40, 24);
  for (const key of Object.keys(initialState().settings.controls)) if (!controls[key]) return invalid();
  const settings: Settings = { textSize: s.textSize, contrast: s.contrast, volume: s.volume, controls };
  return { version: 1, zone: value.zone as GameState['zone'], encountered: strings(value.encountered, 20_000), guesses: stringMap(value.guesses, 200, 5000), confirmed: strings(value.confirmed, 1000), solved: strings(value.solved, 1000), notes: value.notes, settings };
}
export function exportSave(state: GameState): string { return JSON.stringify(validateSave(state), null, 2); }
export function importSave(raw: string): GameState {
  if (raw.length > 3_000_000) return invalid();
  try { return validateSave(JSON.parse(raw) as unknown); } catch { return invalid(); }
}
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB unavailable')); return; }
    let blocked = false;
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE); };
    request.onsuccess = () => { if (blocked) request.result.close(); else resolve(request.result); };
    request.onerror = () => reject(request.error ?? new Error('Save storage unavailable'));
    request.onblocked = () => { blocked = true; reject(new Error('Save storage blocked by another tab')); };
  });
}
export async function saveGame(state: GameState): Promise<void> {
  const snapshot = validateSave(state);
  try {
    const db = await openDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE, 'readwrite');
        transaction.objectStore(STORE).put(snapshot, SLOT);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error ?? new Error('Save failed'));
        transaction.onabort = () => reject(transaction.error ?? new Error('Save aborted'));
      });
    } finally { db.close(); }
  } catch (error) {
    // Private browsing can disable IndexedDB. A local fallback is still exportable.
    if (typeof localStorage === 'undefined') throw error;
    localStorage.setItem(FALLBACK, exportSave(snapshot));
  }
}
export async function loadGame(): Promise<GameState | null> {
  let stored: unknown;
  try {
    const db = await openDatabase();
    try {
      stored = await new Promise<unknown>((resolve, reject) => {
        const transaction = db.transaction(STORE, 'readonly');
        const request = transaction.objectStore(STORE).get(SLOT);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('Load failed'));
      });
    } finally { db.close(); }
  } catch (error) {
    if (typeof localStorage === 'undefined') throw error;
  }
  if (stored !== undefined) return validateSave(stored);
  const fallback = typeof localStorage === 'undefined' ? null : localStorage.getItem(FALLBACK);
  return fallback ? importSave(fallback) : null;
}
