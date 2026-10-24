import { afterEach, describe, expect, it, vi } from 'vitest';
import { exportSave, importSave, loadGame, saveGame } from '../src/game/save';
import { initialState } from '../src/game/state';
afterEach(() => vi.unstubAllGlobals());
describe('save serialization', () => {
  it('round-trips accents, personal notes, progression, remaps, and guesses', () => {
    const state = initialState();
    state.zone = 'maison'; state.guesses = { etre: 'be — être?' }; state.notes = 'À côté de la fenêtre\n自分のメモ';
    state.encountered = ['atelier-1']; state.confirmed = ['objects']; state.solved = ['door']; state.settings.controls.forward = 'ArrowUp';
    expect(importSave(exportSave(state))).toEqual(state);
  });
  it('rejects unknown versions and malformed or excessive data', () => {
    expect(() => importSave('not json')).toThrow();
    for (const patch of [{ version: 9 }, { zone: 'moon' }, { encountered: [12] }, { notes: 'x'.repeat(100_001) }, { settings: { ...initialState().settings, volume: 9 } }, { settings: { ...initialState().settings, textSize: 0 } }, { settings: { ...initialState().settings, controls: {} } }]) {
      expect(() => importSave(JSON.stringify({ ...initialState(), ...patch }))).toThrow();
    }
  });
  it('rejects prototype poisoning and retains only the schema', () => {
    const raw = JSON.stringify(initialState()).replace('"guesses":{}', '"guesses":{"__proto__":"bad"}');
    expect(() => importSave(raw)).toThrow();
    expect(importSave(JSON.stringify({ ...initialState(), extra: 'ignored' }))).not.toHaveProperty('extra');
  });
  it('falls back to local persistence when IndexedDB is unavailable', async () => {
    const storage = new Map<string, string>();
    vi.stubGlobal('indexedDB', undefined);
    vi.stubGlobal('localStorage', { setItem: (key: string, value: string) => storage.set(key, value), getItem: (key: string) => storage.get(key) ?? null });
    expect(await loadGame()).toBeNull();
    const state = initialState(); state.notes = 'Persisté';
    await saveGame(state);
    expect(await loadGame()).toEqual(state);
  });
  it('reports storage failure instead of claiming success', async () => {
    vi.stubGlobal('indexedDB', undefined);
    vi.stubGlobal('localStorage', { setItem: () => { throw new Error('Quota'); } });
    await expect(saveGame(initialState())).rejects.toThrow('Quota');
  });
});
