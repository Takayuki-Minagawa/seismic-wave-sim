/**
 * Map earthquake magnitude to visual amplitude scale (0–1).
 * Used to adjust opacity/stroke-width of wavefront arcs.
 */
export function waveAmplitude(magnitudeM: number): number {
  // Magnitude scale: M1 → 0.35, M9 → 1.0 (keep small quakes visible)
  return 0.35 + (magnitudeM - 1) / 8 * 0.65;
}

export const WAVE_COLORS = {
  P: {
    stroke: '#38bdf8',      // sky-400
    fill: 'rgba(56,189,248,0.15)',
  },
  S: {
    stroke: '#fb7185',      // rose-400
    fill: 'rgba(251,113,133,0.15)',
  },
  PKP: {
    stroke: '#a78bfa',      // violet-400
    fill: 'rgba(167,139,250,0.15)',
  },
  PP: {
    stroke: '#22d3ee',      // cyan-400
    fill: 'rgba(34,211,238,0.15)',
  },
};

export const SHADOW_ZONE_COLOR = 'rgba(244, 63, 94, 0.55)';
export const SHADOW_ZONE_P_COLOR = 'rgba(251, 146, 60, 0.85)';

/** Multiply the brightness of a #rrggbb color (factor > 1 lightens). */
export function shade(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => Math.max(0, Math.min(255, Math.round(((n >> shift) & 255) * factor)));
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}
