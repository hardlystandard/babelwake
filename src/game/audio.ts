export type Cue = 'open' | 'confirm' | 'step';
/** Recorded audio is optional. Map stable line IDs to local audio URLs with registerVoice. */
export class GameAudio {
  private context: AudioContext | undefined;
  private master: GainNode | undefined;
  private volume = 0.35;
  private voices = new Map<string, string>();
  private ambient: OscillatorNode[] = [];
  private currentVoice: HTMLAudioElement | undefined;
  async start(): Promise<void> {
    if (!this.context) {
      const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.context.destination);
      for (const [frequency, amplitude] of [[146.83, 0.012], [220, 0.007], [293.66, 0.004]]) {
        const oscillator = this.context.createOscillator();
        oscillator.type = 'sine'; oscillator.frequency.value = frequency;
        const gain = this.context.createGain(); gain.gain.value = amplitude;
        oscillator.connect(gain); gain.connect(this.master); oscillator.start();
        this.ambient.push(oscillator);
      }
    }
    if (this.context.state === 'suspended') await this.context.resume().catch(() => undefined);
  }
  setVolume(value: number): void {
    this.volume = Math.min(1, Math.max(0, value));
    if (this.context && this.master) this.master.gain.setTargetAtTime(this.volume, this.context.currentTime, 0.05);
    if (this.currentVoice) this.currentVoice.volume = this.volume;
  }
  cue(kind: Cue): void {
    const context = this.context;
    if (!context || !this.master || this.volume===0 || context.state !== 'running') return;
    const notes = kind === 'confirm' ? [440, 554.37, 659.25] : kind === 'open' ? [440, 587.33] : [174.61];
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency; oscillator.type = 'sine';
      const at = context.currentTime + index * 0.075;
      gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(kind === 'step' ? 0.025 : 0.07, at + 0.012); gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.24);
      oscillator.connect(gain); gain.connect(this.master!); oscillator.start(at); oscillator.stop(at + 0.25);
    });
  }
  registerVoice(lineId: string, url = `/audio/voices/${encodeURIComponent(lineId)}.mp3`): void { this.voices.set(lineId, url); }
  async playLine(lineId: string): Promise<boolean> {
    const url = this.voices.get(lineId);
    if (!url) return false;
    this.currentVoice?.pause();
    const voice = new Audio(url); this.currentVoice = voice; voice.volume = this.volume;
    try { await voice.play(); return true; } catch { return false; }
  }
  dispose(): void {
    this.currentVoice?.pause();
    this.ambient.forEach(oscillator => oscillator.stop()); this.ambient = [];
    void this.context?.close(); this.context = undefined; this.master = undefined;
  }
}
