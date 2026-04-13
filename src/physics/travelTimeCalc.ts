import { Ray, TravelTimeDatum, WavePhase } from './types';

/**
 * Maximum allowed gap between the two nearest samples before interpolation
 * returns null instead of bridging a phase discontinuity (Issue #2).
 *
 * The P-wave shadow zone is ~40° wide (103°–143°). Setting the threshold
 * to 15° is tight enough to catch the PKP artifact (gap ~155°) while still
 * allowing legitimate interpolation along continuous curve segments.
 */
const MAX_INTERPOLATION_GAP_DEG = 15;

/**
 * Build travel time curve data from computed rays.
 * Returns sorted array of {distanceDeg, timeSec, phase}.
 */
export function buildTravelTimeCurve(pRays: Ray[], sRays: Ray[]): TravelTimeDatum[] {
  const data: TravelTimeDatum[] = [];

  for (const ray of pRays) {
    if (ray.isAbsorbed || ray.totalTravelTime <= 0 || ray.surfaceAngleDeg <= 0) continue;
    data.push({
      distanceDeg: ray.surfaceAngleDeg,
      timeSec: ray.totalTravelTime,
      phase: ray.phase,
    });
  }

  for (const ray of sRays) {
    if (ray.isAbsorbed || ray.totalTravelTime <= 0 || ray.surfaceAngleDeg <= 0) continue;
    data.push({
      distanceDeg: ray.surfaceAngleDeg,
      timeSec: ray.totalTravelTime,
      phase: ray.phase,
    });
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
