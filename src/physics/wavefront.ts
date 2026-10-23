/**
 * Computes ray tip positions at a given simulation time.
 * Returns arrays of {x, y} canvas points for P-wave and S-wave fronts.
 */

import { Ray } from './types';

export interface RayTip {
  radiusKm: number;
  angleDeg: number;  // from epicenter meridian (degrees)
  opacity: number;
  waveType: 'P' | 'S';
  layerName: string;
}

/**
 * Get the ray tip position (radius + angle) for a ray at elapsed time t.
 */
function getRayTipAtTime(ray: Ray, timeSec: number): RayTip | null {
  if (timeSec <= 0) return null;

  let elapsed = 0;
  for (const seg of ray.segments) {
    if (elapsed + seg.travelTime >= timeSec) {
      // The wave front is within this segment
      const fraction = (timeSec - elapsed) / seg.travelTime;
      const radius = seg.startRadius + fraction * (seg.endRadius - seg.startRadius);
      const angle = seg.startAngle + fraction * (seg.endAngle - seg.startAngle);

      const opacity = seg.layerName === 'outerCore' && seg.waveType === 'S'
        ? Math.max(0, 1 - fraction)  // fade out S-wave at outer core
        : 0.8;

      return {
        radiusKm: radius,
        angleDeg: angle * (180 / Math.PI),
        opacity,
        waveType: seg.waveType,
        layerName: seg.layerName,
      };
    }
    elapsed += seg.travelTime;
  }

  // Wave has completed its path (surface arrival)
  return null;
}

export interface WavefrontData {
  pTips: RayTip[];
  sTips: RayTip[];
}

/**
 * Compute all ray tips at the given simulation time.
 * Returns tips for P-waves and S-waves separately.
 */
export function computeWavefronts(
  pRays: Ray[],
  sRays: Ray[],
  timeSec: number,
): WavefrontData {
  const pTips: RayTip[] = [];
  const sTips: RayTip[] = [];

  for (const ray of pRays) {
    const tip = getRayTipAtTime(ray, timeSec);
    if (tip) pTips.push(tip);
  }

  for (const ray of sRays) {
    const tip = getRayTipAtTime(ray, timeSec);
    if (tip) sTips.push(tip);
  }

  return { pTips, sTips };
}

/**
 * Check which observer points have received wave arrivals by time t.
 * Returns the set of arrival info for each observer.
 */
export interface ObserverArrivalResult {
  observerId: string;
  phase: 'P' | 'S' | 'PKP';
  travelTimeSec: number;
}

export function checkObserverArrivals(
  pRays: Ray[],
  sRays: Ray[],
  observerAnglesDeg: { id: string; angleDeg: number }[],
  timeSec: number,
): ObserverArrivalResult[] {
  const results: ObserverArrivalResult[] = [];

  for (const obs of observerAnglesDeg) {
    const targetDeg = obs.angleDeg;
    const tolerance = 2.0; // degrees

    // Find P/PKP arrivals
    for (const ray of pRays) {
      if (ray.isAbsorbed) continue;
      if (Math.abs(ray.surfaceAngleDeg - targetDeg) <= tolerance) {
        if (timeSec >= ray.totalTravelTime) {
          results.push({
            observerId: obs.id,
            phase: ray.phase === 'PKP' ? 'PKP' : 'P',
            travelTimeSec: ray.totalTravelTime,
          });
        }
      }
    }

    // Find S arrivals
    for (const ray of sRays) {
      if (ray.isAbsorbed) continue;
      if (Math.abs(ray.surfaceAngleDeg - targetDeg) <= tolerance) {
        if (timeSec >= ray.totalTravelTime) {
          results.push({
            observerId: obs.id,
            phase: 'S',
            travelTimeSec: ray.totalTravelTime,
          });
        }
      }
    }
  }

  return results;
}
