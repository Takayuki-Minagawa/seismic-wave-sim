import { ShadowZoneInfo } from './types';

/**
 * Teaching-model shadow-zone constants.
 *
 * These are the ranges stated in the spec and displayed in the UI copy.
 * We intentionally do NOT refine them from the numerical ray fan because
 * the simplified 5-layer model cannot reproduce the exact geometry of
 * the real Earth — and using a single source of truth here prevents the
 * "shadow zone says 103° but PKP appears at 120°" contradiction (Issue #4).
 */
export const P_SHADOW_START_DEG = 103;
export const P_SHADOW_END_DEG   = 143;
export const S_SHADOW_START_DEG = 103;

/** Return fixed teaching-model shadow-zone bounds. */
export function computeShadowZone(): ShadowZoneInfo {
  return {
    pShadowStart: P_SHADOW_START_DEG,
    pShadowEnd:   P_SHADOW_END_DEG,
    sShadowStart: S_SHADOW_START_DEG,
  };
}

/** Returns true when the given epicentral distance falls in the P-wave shadow zone. */
export function isInPShadowZone(epicentralDeg: number, shadowZone: ShadowZoneInfo): boolean {
  const dist = normalizeEpicentral(epicentralDeg);
  return dist >= shadowZone.pShadowStart && dist <= shadowZone.pShadowEnd;
}

/** Returns true when the given epicentral distance is in the S-wave shadow zone. */
export function isInSShadowZone(epicentralDeg: number, shadowZone: ShadowZoneInfo): boolean {
  const dist = normalizeEpicentral(epicentralDeg);
  return dist >= shadowZone.sShadowStart;
}

/**
 * Returns true when a PKP arrival is valid for the given distance.
 * PKP only emerges beyond the P-wave shadow zone (>= P_SHADOW_END_DEG).
 * Suppressing PKP inside the shadow zone keeps the arrivals, graph, and
 * learning copy consistent with the advertised teaching ranges (Issue #4).
 */
export function isPKPValid(epicentralDeg: number): boolean {
  return normalizeEpicentral(epicentralDeg) >= P_SHADOW_END_DEG;
}

/** Fold any angle into [0, 180] epicentral distance. */
function normalizeEpicentral(deg: number): number {
  const d = Math.abs(deg) % 360;
  return d > 180 ? 360 - d : d;
}
