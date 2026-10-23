/**
 * Spherical-shell ray tracer using Snell's law (ray parameter conservation).
 *
 * Ray parameter: p = r * sin(i) / v(r)
 *   where r = radius, i = angle from vertical (incidence), v = velocity
 *
 * For each layer, we integrate:
 *   dθ/dr = p / (r * sqrt(r²/v² - p²))
 *   dt/dr  = 1  / (v * sqrt(1 - p²*v²/r²))
 *
 * using Simpson's rule.
 */

import { EARTH_LAYERS, getLayerAt, getVelocityAt } from '../data/earthModel';
import { EARTH_RADIUS_KM, DEG_TO_RAD, RAD_TO_DEG } from './constants';
import { Ray, RaySegment, WavePhase, WaveType } from './types';

let rayIdCounter = 0;

/**
 * Exact ray geometry inside a constant-velocity shell.
 *
 * With constant velocity the ray is a straight line whose closest approach
 * to the Earth's center is b = p·v (Snell's law in spherical form). Between
 * radii r1 and r2 (both >= b):
 *   path length = |√(r2² − b²) − √(r1² − b²)|,  time = length / v
 *   angle       = |acos(b / r2) − acos(b / r1)|
 */
function integrateSegment(
  r1: number,
  r2: number,
  v: number,
  p: number,
): { dAngle: number; dTime: number } {
  const b = p * v;
  const leg = (r: number) => Math.sqrt(Math.max(0, r * r - b * b));
  const theta = (r: number) => Math.acos(Math.min(1, b / Math.max(r, 1e-6)));

  return {
    dAngle: Math.abs(theta(r2) - theta(r1)),
    dTime: Math.abs(leg(r2) - leg(r1)) / v,
  };
}

/** How long an S-wave is shown fading out at the core-mantle boundary (s). */
const S_ABSORPTION_FADE_SEC = 90;

/**
 * Trace a single ray from source with given takeoff angle.
 * Returns null if the ray is pathological.
 */
function traceSingleRay(
  sourceRadiusKm: number,
  takeoffAngleDeg: number,
  waveType: WaveType,
): Ray | null {
  // Rays leave downward, so a source exactly on a boundary belongs to the layer below.
  const sourceProbeKm = sourceRadiusKm - 1e-6;
  const v0 = getVelocityAt(sourceProbeKm, waveType);
  if (v0 === 0) return null;

  const takeoffRad = takeoffAngleDeg * DEG_TO_RAD;
  const p = (sourceRadiusKm * Math.sin(takeoffRad)) / v0; // ray parameter

  const segments: RaySegment[] = [];
  let currentRadius = sourceRadiusKm;
  let totalAngle = 0;
  let totalTime = 0;
  let isAbsorbed = false;
  const layersTraversed: string[] = [];

  const sourceLayer = getLayerAt(sourceProbeKm);
  const currentLayerIdx = EARTH_LAYERS.findIndex(l => l.name === sourceLayer.name);

  // --- DESCENDING PHASE ---

  // Find turning radius: r such that r/v(r) = p
  // In practice: the ray turns when sin(i) = 1 → p * v = r → r_turn = p * v_in_layer
  // (assumes constant velocity per layer)
  const findTurning = (layerIdx: number, layerV: number): number => {
    // r_turn = p * layerV (from p = r/v => r = p*v when sin(i)=1)
    const rTurn = p * layerV;
    const layer = EARTH_LAYERS[layerIdx];
    if (rTurn >= layer.innerRadius && rTurn <= currentRadius) {
      return rTurn;
    }
    return -1;
  };

  // Descend through layers
  for (let li = currentLayerIdx; li < EARTH_LAYERS.length; li++) {
    const layer = EARTH_LAYERS[li];
    const v = waveType === 'P' ? layer.pVelocity : layer.sVelocity;

    // S-waves cannot enter the liquid outer core: they stall and fade at the boundary.
    if (waveType === 'S' && layer.name === 'outerCore') {
      segments.push({
        startRadius: currentRadius,
        endRadius: currentRadius,
        startAngle: totalAngle,
        endAngle: totalAngle,
        velocity: 0,
        waveType,
        layerName: layer.name,
        travelTime: S_ABSORPTION_FADE_SEC,
      });
      isAbsorbed = true;
      break;
    }

    if (v === 0) {
      isAbsorbed = true;
      break;
    }

    // The ray cannot enter a layer whose turning radius lies above the
    // boundary (post-critical incidence) — it turns back at the boundary.
    if (p * v > currentRadius) break;

    // Check if ray turns in this layer
    const rTurn = findTurning(li, v);
    if (rTurn > 0) {
      // Descend to turning radius
      const { dAngle: dA1, dTime: dT1 } = integrateSegment(currentRadius, rTurn, v, p);
      const startAngle = totalAngle;
      totalAngle += dA1;
      totalTime += dT1;

      segments.push({
        startRadius: currentRadius,
        endRadius: rTurn,
        startAngle,
        endAngle: totalAngle,
        velocity: v,
        waveType,
        layerName: layer.name,
        travelTime: dT1,
      });

      currentRadius = rTurn;
      layersTraversed.push(layer.name);
      break;
    } else {
      // Cross entire layer to inner boundary
      const innerR = layer.innerRadius > 0 ? layer.innerRadius : 1;
      const { dAngle, dTime } = integrateSegment(currentRadius, innerR, v, p);
      const startAngle = totalAngle;
      totalAngle += dAngle;
      totalTime += dTime;

      segments.push({
        startRadius: currentRadius,
        endRadius: innerR,
        startAngle,
        endAngle: totalAngle,
        velocity: v,
        waveType,
        layerName: layer.name,
        travelTime: dTime,
      });

      currentRadius = innerR;
      layersTraversed.push(layer.name);

      if (innerR <= 1) {
        // Reached Earth center — turn
        break;
      }
    }
  }

  if (isAbsorbed) {
    const phase: WavePhase = waveType === 'P' ? 'P' : 'S';
    return {
      id: `ray-${rayIdCounter++}`,
      takeoffAngleDeg,
      segments,
      totalTravelTime: totalTime,
      surfaceAngleDeg: totalAngle * RAD_TO_DEG,
      phase,
      isAbsorbed: true,
    };
  }

  // --- ASCENDING PHASE (mirror the descent) ---
  // Climb back up through layers in reverse
  const downSegmentsReversed = [...segments].reverse();

  for (const seg of downSegmentsReversed) {
    // Mirror segment: swap start/end radius, continue angle accumulation
    const { dAngle, dTime } = integrateSegment(seg.endRadius, seg.startRadius, seg.velocity, p);
    const startAngle = totalAngle;
    totalAngle += dAngle;
    totalTime += dTime;

    segments.push({
      startRadius: seg.endRadius,
      endRadius: seg.startRadius,
      startAngle,
      endAngle: totalAngle,
      velocity: seg.velocity,
      waveType,
      layerName: seg.layerName,
      travelTime: dTime,
    });
  }

  // --- UP-GOING LEG from the source depth to the surface (deep-focus quakes) ---
  // The mirrored ascent above ends back at the source radius.
  currentRadius = sourceRadiusKm;
  for (let li = currentLayerIdx; li >= 0 && currentRadius < EARTH_RADIUS_KM; li--) {
    const layer = EARTH_LAYERS[li];
    const v = waveType === 'P' ? layer.pVelocity : layer.sVelocity;
    const top = Math.min(layer.outerRadius, EARTH_RADIUS_KM);
    if (top <= currentRadius || v === 0) continue;
    const { dAngle, dTime } = integrateSegment(currentRadius, top, v, p);
    const startAngle = totalAngle;
    totalAngle += dAngle;
    totalTime += dTime;
    segments.push({
      startRadius: currentRadius,
      endRadius: top,
      startAngle,
      endAngle: totalAngle,
      velocity: v,
      waveType,
      layerName: layer.name,
      travelTime: dTime,
    });
    currentRadius = top;
  }

  // Epicentral distance folds back once a ray travels past the antipode.
  const rawDeg = (totalAngle * RAD_TO_DEG) % 360;
  const surfaceDeg = rawDeg > 180 ? 360 - rawDeg : rawDeg;

  // Determine phase from layer traversal
  let phase: WavePhase = waveType === 'P' ? 'P' : 'S';
  if (layersTraversed.includes('outerCore')) {
    phase = 'PKP';
  } else if (layersTraversed.includes('innerCore')) {
    phase = 'PKP';
  }

  return {
    id: `ray-${rayIdCounter++}`,
    takeoffAngleDeg,
    segments,
    totalTravelTime: totalTime,
    surfaceAngleDeg: surfaceDeg,
    phase,
    isAbsorbed: false,
  };
}

/**
 * Compute a full ray fan from the given source.
 * Returns arrays of P rays and S rays.
 */
export function computeRayFan(
  depthKm: number,
): { pRays: Ray[]; sRays: Ray[] } {
  const sourceRadius = EARTH_RADIUS_KM - depthKm;
  const pRays: Ray[] = [];
  const sRays: Ray[] = [];

  // ~0.25° steps keep neighbouring rays close near critical angles, where the
  // surface distance changes fastest. A near-vertical ray reaches the antipode.
  const takeoffs = [0.05];
  for (let i = 0; i <= 356; i++) takeoffs.push(0.5 + i * 0.25);

  for (const takeoff of takeoffs) {
    const pRay = traceSingleRay(sourceRadius, takeoff, 'P');
    if (pRay && pRay.totalTravelTime > 0 && pRay.totalTravelTime < 3000) {
      pRays.push(pRay);
    }

    const sRay = traceSingleRay(sourceRadius, takeoff, 'S');
    if (sRay && sRay.totalTravelTime > 0 && sRay.totalTravelTime < 4000) {
      sRays.push(sRay);
    }
  }

  return { pRays, sRays };
}
