/**
 * Map earthquake magnitude to visual amplitude scale (0–1).
 * Used to adjust opacity/stroke-width of wavefront arcs.
 */
export function waveAmplitude(magnitudeM: number): number {
  // Magnitude scale: M1 → 0.2, M9 → 1.0
  return 0.2 + (magnitudeM - 1) / 8 * 0.8;
}

export const WAVE_COLORS = {
  P: {
    stroke: '#3b82f6',      // blue-500
    fill: 'rgba(59,130,246,0.15)',
  },
  S: {
    stroke: '#ef4444',      // red-500
    fill: 'rgba(239,68,68,0.15)',
  },
  PKP: {
    stroke: '#8b5cf6',      // violet-500
    fill: 'rgba(139,92,246,0.15)',
  },
  PP: {
    stroke: '#06b6d4',      // cyan-500
    fill: 'rgba(6,182,212,0.15)',
  },
};

export const SHADOW_ZONE_COLOR = 'rgba(239, 68, 68, 0.12)';
export const SHADOW_ZONE_P_COLOR = 'rgba(251, 146, 60, 0.12)';
