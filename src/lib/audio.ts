let _ctx: AudioContext | null = null;

export function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch { return null; }
  }
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

export function unlockAudio(): boolean {
  const ctx = getAudioCtx();
  if (ctx) { ctx.resume(); return true; }
  return false;
}

const MIDI_BASE: Record<string, number> = {
  C:60,'C#':61,D:62,'D#':63,E:64,F:65,'F#':66,G:67,'G#':68,A:69,'A#':70,B:71
};

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function noteFreq(name: string, octaveShift = 0): number {
  return midiToFreq((MIDI_BASE[name] ?? 60) + octaveShift * 12);
}

export function playFreq(freq: number, startTime?: number, duration = 1.0, volume = 0.42): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = startTime ?? ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(volume, now + 0.012);
  master.gain.setValueAtTime(volume * 0.72, now + 0.08);
  master.gain.exponentialRampToValueAtTime(volume * 0.3, now + duration * 0.5);
  master.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  master.connect(ctx.destination);
  ([[1,1],[2,0.45],[3,0.2],[4,0.09],[5,0.04]] as [number,number][]).forEach(([ratio, gain]) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * ratio, now);
    g.gain.setValueAtTime(gain, now);
    osc.connect(g);
    g.connect(master);
    osc.start(now);
    osc.stop(now + duration + 0.1);
  });
}

function ascendingOctave(noteNames: string[]): Array<{name: string, shift: number}> {
  const base = MIDI_BASE[noteNames[0]] ?? 60;
  return noteNames.map((n, i) => ({
    name: n,
    shift: i === 0 ? 0 : (MIDI_BASE[n] ?? 60) < base ? 1 : 0,
  }));
}

export function playSingleNote(name: string): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  playFreq(noteFreq(name, 0), ctx.currentTime, 0.9, 0.44);
}

export function playScaleUp(noteNames: string[], stepTime = 0.34): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  noteNames.forEach((n, i) => {
    const bump = i > 0 && (MIDI_BASE[n] ?? 60) < (MIDI_BASE[noteNames[0]] ?? 60) ? 1 : 0;
    playFreq(noteFreq(n, bump), now + i * stepTime, 0.65, 0.38);
  });
}

export function playScaleDown(noteNames: string[], stepTime = 0.34): void {
  playScaleUp([...noteNames].reverse(), stepTime);
}

export function playChordTogether(noteNames: string[], duration = 1.6): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  ascendingOctave(noteNames).forEach(({ name, shift }) =>
    playFreq(noteFreq(name, shift), now, duration, 0.32));
}

export function playChordArp(noteNames: string[], stepTime = 0.22, duration = 1.0): void {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  ascendingOctave(noteNames).forEach(({ name, shift }, i) =>
    playFreq(noteFreq(name, shift), now + i * stepTime, duration, 0.42));
}
