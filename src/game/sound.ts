/**
 * Tiny Web Audio sound-effect engine. All sounds are synthesized, so no
 * audio files are needed. The AudioContext is created lazily on the first
 * sound, which always follows a user gesture (button click).
 */

import { readStorage, writeStorage } from './storage';

const MUTE_KEY = 'seismic.muted';

let ctx: AudioContext | null = null;
let muted = readStorage(MUTE_KEY) === '1';
const listeners = new Set<() => void>();

function audio(): AudioContext | null {
  if (muted) return null;
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  freq: number,
  startOffset: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine',
): void {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + startOffset;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

export const sound = {
  isMuted: () => muted,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
  toggleMuted() {
    muted = !muted;
    writeStorage(MUTE_KEY, muted ? '1' : '0');
    listeners.forEach(fn => fn());
  },

  /** Low rumble when an earthquake starts; louder for bigger magnitudes. */
  rumble(magnitude: number) {
    const ac = audio();
    if (!ac) return;
    const duration = 1.2 + magnitude * 0.12;
    const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * duration), ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const src = ac.createBufferSource();
    src.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 90 + magnitude * 8;
    const gain = ac.createGain();
    const t0 = ac.currentTime;
    const peak = 0.15 + (magnitude / 9) * 0.45;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    src.connect(filter).connect(gain).connect(ac.destination);
    src.start(t0);
  },

  /** Short "ping" when a wave reaches an observer. */
  arrival(phase: 'P' | 'S' | 'PKP' | string) {
    const freq = phase === 'P' ? 880 : phase === 'PKP' ? 1175 : 523;
    tone(freq, 0, 0.35, 0.12, 'sine');
    tone(freq * 2, 0.02, 0.2, 0.04, 'triangle');
  },

  /** Fanfare for unlocking a mission. */
  fanfare() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.35, 0.1, 'triangle'));
  },

  correct() {
    tone(659, 0, 0.18, 0.12, 'triangle');
    tone(988, 0.1, 0.3, 0.12, 'triangle');
  },

  wrong() {
    tone(196, 0, 0.3, 0.1, 'sawtooth');
  },

  click() {
    tone(1400, 0, 0.06, 0.04, 'square');
  },
};
