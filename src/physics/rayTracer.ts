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
import { EARTH_RADIUS_KM, DEG_TO_RAD, RAD_TO_DEG, INTEGRATION_STEPS } from './constants';
import { Ray, RaySegment, WavePhase, WaveType } from './types';

let rayIdCounter = 0;

function simpsonIntegrate(
  f: (r: number) => number,
  a: number,
  b: number,
  n: number,
): number {
  if (Math.abs(b - a) < 0.001) return 0;
  const steps = n % 2 === 0 ? n : n + 1;
  const h = (b - a) / steps;
  let sum = f(a) + f(b);
  for (let i = 1; i < steps; i++) {
    const r = a + i * h;
    sum += (i % 2 === 0 ? 2 : 4) * f(r);
  }
  return (h / 3) * sum;
}

function integrateSegment(
  r1: number,
  r2: number,
  v: number,
  p: number,
  steps: number,
): { dAngle: number; dTime: number } {
  const sign = r2 > r1 ? 1 : -1; // ascending (+) or descending (-)
  const [rMin, rMax] = r1 < r2 ? [r1, r2] : [r2, r1];

  const dAngleFn = (r: number) => {
    const disc = r * r / (v * v) - p * p;
    if (disc <= 0) return 0;
    return p / (r * Math.sqrt(disc));
  };
  const dTimeFn = (r: number) => {
    const disc = r * r / (v * v) - p * p;
    if (disc <= 0) return 0;
    return 1 / (v * Math.sqrt(disc));
  };

  const dAngle = simpsonIntegrate(dAngleFn, rMin, rMax, steps);
  const dTime = simpsonIntegrate(dTimeFn, rMin, rMax, steps);

  return { dAngle: sign < 0 ? dAngle : dAngle, dTime };
}

/**
 * Trace a single ray from source with given takeoff angle.
 * Returns null if the ray is pathological.
 */
function traceSingleRay(
  sourceRadiusKm: number,
  takeoffAngleDeg: number,
  waveType: WaveType,
): Ray | null {
  const v0 = getVelocityAt(sourceRadiusKm, waveType);
  if (v0 === 0) return null;

  const takeoffRad = takeoffAngleDeg * DEG_TO_RAD;
  const p = (sourceRadiusKm * Math.sin(takeoffRad)) / v0; // ray parameter

  const segments: RaySegment[] = [];
  let currentRadius = sourceRadiusKm;
  let totalAngle = 0;
  let totalTime = 0;
  let isAbsorbed = false;
  const layersTraversed: string[] = [];

  const sourceLayer = getLayerAt(sourceRadiusKm);
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

    // Check S-wave absorption in outer core
    if (waveType === 'S' && layer.name === 'outerCore') {
      const { dAngle, dTime } = integrateSegment(currentRadius, layer.innerRadius, layer.pVelocity, p, INTEGRATION_STEPS);
      segments.push({
        startRadius: currentRadius,
        endRadius: layer.outerRadius,
        startAngle: totalAngle,
        endAngle: totalAngle + dAngle,
        velocity: layer.pVelocity,
        waveType,
        layerName: layer.name,
        travelTime: dTime,
      });
      totalAngle += dAngle;
      totalTime += dTime;
      isAbsorbed = true;
      break;
    }

    if (v === 0) {
      isAbsorbed = true;
      break;
    }

    // Check if ray turns in this layer
    const rTurn = findTurning(li, v);
    if (rTurn > 0) {
      // Descend to turning radius
      const { dAngle: dA1, dTime: dT1 } = integrateSegment(currentRadius, rTurn, v, p, INTEGRATION_STEPS);
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
      // Check if p * v > r_inner (total reflection at next boundary?)
      const nextLayerIdx = li + 1;
      if (nextLayerIdx < EARTH_LAYERS.length) {
        const nextLayer = EARTH_LAYERS[nextLayerIdx];
        const vNext = waveType === 'P' ? nextLayer.pVelocity : nextLayer.sVelocity;
        // If ray parameter would cause imaginary angle in next layer, turn here
        if (vNext > 0 && p * vNext > layer.innerRadius) {
          // Doesn't quite turn at boundary — trace to inner boundary and continue
        }
      }

      const { dAngle, dTime } = integrateSegment(currentRadius, innerR, v, p, INTEGRATION_STEPS);
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
    const { dAngle, dTime } = integrateSegment(seg.endRadius, seg.startRadius, seg.velocity, p, INTEGRATION_STEPS);
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

  const surfaceDeg = totalAngle * RAD_TO_DEG;

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
    surfaceAngleDeg: Math.min(surfaceDeg, 180),
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

  const angleStep = 89.0 / 180; // ~0.5° steps → 180 rays per wave type
  for (let i = 0; i <= 180; i++) {
    const takeoff = 0.5 + i * angleStep;

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
