import { Ray, TravelTimeDatum, WavePhase } from './types';
import { P_SHADOW_END_DEG, P_SHADOW_START_DEG, S_SHADOW_START_DEG } from './shadowZone';

/**
 * Maximum allowed gap between the two nearest samples before interpolation
 * returns null instead of bridging a phase discontinuity (Issue #2).
 *
 * The P-wave shadow zone is ~40° wide (103°–143°). Setting the threshold
 * to 15° is tight enough to catch the PKP artifact (gap ~155°) while still
 * allowing legitimate interpolation along continuous curve segments.
 */
const MAX_INTERPOLATION_GAP_DEG = 15;

/** Max distance jump between neighbouring rays that still counts as one continuous branch. */
const MAX_BRANCH_STEP_DEG = 2;

/** Sampling step of the published travel-time curve. */
const CURVE_STEP_DEG = 0.5;

/**
 * First-arrival time at a distance for one phase.
 *
 * Neighbouring rays (in takeoff order) form continuous branches of the
 * travel-time curve. The layered model produces several overlapping branches
 * (crustal chords, triplications), so we interpolate inside every pair of
 * neighbours that brackets the distance and keep the earliest time.
 */
function firstArrivalTime(distanceDeg: number, rays: Ray[]): number | null {
  let best: number | null = null;
  for (let i = 0; i + 1 < rays.length; i++) {
    const a = rays[i];
    const b = rays[i + 1];
    const lo = Math.min(a.surfaceAngleDeg, b.surfaceAngleDeg);
    const hi = Math.max(a.surfaceAngleDeg, b.surfaceAngleDeg);
    if (distanceDeg < lo || distanceDeg > hi || hi - lo > MAX_BRANCH_STEP_DEG) continue;
    const t = hi - lo < 1e-9
      ? Math.min(a.totalTravelTime, b.totalTravelTime)
      : a.totalTravelTime + ((distanceDeg - a.surfaceAngleDeg) / (b.surfaceAngleDeg - a.surfaceAngleDeg)) * (b.totalTravelTime - a.totalTravelTime);
    if (best === null || t < best) best = t;
  }
  if (best !== null) return best;
  // Branch ends (e.g. the antipode, where the curve is symmetric) may not be
  // bracketed; fall back to a ray landing within half a degree.
  for (const r of rays) {
    if (Math.abs(r.surfaceAngleDeg - distanceDeg) <= 0.5 && (best === null || r.totalTravelTime < best)) {
      best = r.totalTravelTime;
    }
  }
  return best;
}

/** Teaching-model visibility of each phase (keeps the curve consistent with the 103°/143° shadow zones). */
function phaseVisibleAt(phase: WavePhase, distanceDeg: number): boolean {
  if (phase === 'P') return distanceDeg <= P_SHADOW_START_DEG;
  if (phase === 'S') return distanceDeg <= S_SHADOW_START_DEG;
  if (phase === 'PKP') return distanceDeg >= P_SHADOW_END_DEG;
  return true;
}

/**
 * Build the first-arrival travel-time curve from computed rays.
 * Returns {distanceDeg, timeSec, phase} sampled every CURVE_STEP_DEG,
 * sorted by distance, with at most one time per phase and distance.
 */
export function buildTravelTimeCurve(pRays: Ray[], sRays: Ray[]): TravelTimeDatum[] {
  const data: TravelTimeDatum[] = [];
  const usable = (r: Ray) => !r.isAbsorbed && r.totalTravelTime > 0 && r.surfaceAngleDeg > 0;

  const branches: [WavePhase, Ray[]][] = [
    ['P', pRays.filter(r => usable(r) && r.phase === 'P')],
    ['PKP', pRays.filter(r => usable(r) && r.phase === 'PKP')],
    ['S', sRays.filter(r => usable(r) && r.phase === 'S')],
  ];

  for (const [phase, rays] of branches) {
    const samples: TravelTimeDatum[] = [];
    for (let d = CURVE_STEP_DEG; d <= 180; d += CURVE_STEP_DEG) {
      if (!phaseVisibleAt(phase, d)) continue;
      const t = firstArrivalTime(d, rays);
      if (t !== null) samples.push({ distanceDeg: d, timeSec: t, phase });
    }
    // A first-arrival time never decreases with distance (dT/dΔ = p ≥ 0); drop
    // samples where the sparse fan only caught a later branch.
    let runningMin = Infinity;
    for (let i = samples.length - 1; i >= 0; i--) {
      if (samples[i].timeSec <= runningMin) {
        runningMin = samples[i].timeSec;
        data.push(samples[i]);
      }
    }
  }

  return data.sort((a, b) => a.distanceDeg - b.distanceDeg);
}

/**
 * Interpolate travel time for a given epicentral distance and phase.
 *
 * Returns null when:
 * - no samples exist for the requested phase
 * - the target distance is outside the range of available samples
 * - the two nearest samples are separated by more than MAX_INTERPOLATION_GAP_DEG
 *   (prevents bridging shadow zones or disjoint phase branches — Issue #2)
 */
export function interpolateTravelTime(
  distanceDeg: number,
  phase: WavePhase,
  curve: TravelTimeDatum[],
): number | null {
  const filtered = curve.filter(d => d.phase === phase);
  if (filtered.length === 0) return null;

  // Nearest sample below and above the target distance
  const below = filtered.filter(d => d.distanceDeg <= distanceDeg);
  const above = filtered.filter(d => d.distanceDeg >= distanceDeg);

  if (below.length === 0 || above.length === 0) return null;

  const b = below[below.length - 1];
  const a = above[0];

  // Exact hit
  if (Math.abs(b.distanceDeg - a.distanceDeg) < 0.001) {
    return b.timeSec;
  }

  // Refuse to interpolate across a large gap — this indicates a shadow zone
  // or a disjoint phase branch (e.g. PKP samples only near 0.6° and 156°).
  if (a.distanceDeg - b.distanceDeg > MAX_INTERPOLATION_GAP_DEG) {
    return null;
  }

  const t = (distanceDeg - b.distanceDeg) / (a.distanceDeg - b.distanceDeg);
  return b.timeSec + t * (a.timeSec - b.timeSec);
}
