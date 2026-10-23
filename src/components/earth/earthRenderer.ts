/**
 * Pure canvas drawing functions for the Earth cross-section view.
 * Called from requestAnimationFrame — NO React state access here.
 */

import { EARTH_LAYERS } from '../../data/earthModel';
import { SimulationState, RaySegment } from '../../physics/types';
import { WavefrontData, RayTip } from '../../physics/wavefront';
import { EARTH_RADIUS_KM, DEG_TO_RAD } from '../../physics/constants';
import { radiusAngleToCanvas, CanvasCenter, epicentralToAbsAngle, drawCircle } from '../../utils/geometry';
import { WAVE_COLORS, SHADOW_ZONE_COLOR, SHADOW_ZONE_P_COLOR, waveAmplitude } from '../../utils/colorScale';

export interface DrawConfig {
  center: CanvasCenter;
  earthPixelRadius: number;
  isDark: boolean;
}

function kmToPixel(km: number, earthPixelRadius: number): number {
  return (km / EARTH_RADIUS_KM) * earthPixelRadius;
}

/** Draw the concentric Earth layers */
function drawLayers(ctx: CanvasRenderingContext2D, config: DrawConfig): void {
  const { center, earthPixelRadius, isDark } = config;
  // Draw from outermost to innermost
  for (const layer of [...EARTH_LAYERS].reverse()) {
    const r = kmToPixel(layer.outerRadius, earthPixelRadius);
    drawCircle(ctx, center.x, center.y, r);
    ctx.fillStyle = isDark ? layer.darkColor : layer.color;
    ctx.fill();
  }
  // Redraw layer borders
  for (const layer of EARTH_LAYERS) {
    const r = kmToPixel(layer.outerRadius, earthPixelRadius);
    drawCircle(ctx, center.x, center.y, r);
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

/** Draw shadow zone arcs on the surface */
function drawShadowZones(
  ctx: CanvasRenderingContext2D,
  config: DrawConfig,
  epicenterAbsAngleDeg: number,
  pShadowStart: number,
  pShadowEnd: number,
  sShadowStart: number,
): void {
  const { center, earthPixelRadius } = config;
  const r = earthPixelRadius + 4;

  const drawArc = (startDeg: number, endDeg: number, color: string, both: boolean) => {
    const startRad = (epicenterAbsAngleDeg + startDeg - 90) * DEG_TO_RAD;
    const endRad = (epicenterAbsAngleDeg + endDeg - 90) * DEG_TO_RAD;
    const negStartRad = (epicenterAbsAngleDeg - startDeg - 90) * DEG_TO_RAD;
    const negEndRad = (epicenterAbsAngleDeg - endDeg - 90) * DEG_TO_RAD;

    ctx.beginPath();
    ctx.arc(center.x, center.y, r, startRad, endRad);
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.stroke();

    if (both) {
      ctx.beginPath();
      ctx.arc(center.x, center.y, r, negEndRad, negStartRad);
      ctx.strokeStyle = color;
      ctx.lineWidth = 8;
      ctx.stroke();
    }
  };

  // S shadow (red)
  drawArc(sShadowStart, 180, SHADOW_ZONE_COLOR, true);
  // P shadow (orange) — overlaps part of S shadow visually
  drawArc(pShadowStart, Math.min(pShadowEnd, 180), SHADOW_ZONE_P_COLOR, true);
}

/** Draw all ray segments up to current time */
function drawRayPaths(
  ctx: CanvasRenderingContext2D,
  config: DrawConfig,
  state: SimulationState,
  amplitude: number,
): void {
  const { center, earthPixelRadius } = config;
  const epicenterAbsAngleDeg = state.epicenter.surfaceAngleDeg;

  const drawRay = (ray: { segments: RaySegment[]; phase: string }, color: string, alpha: number) => {
    let elapsed = 0;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = alpha;

    for (const seg of ray.segments) {
      // Only draw segments the wave has reached
      if (elapsed > state.currentTimeSec) break;

      const segFrac = Math.min(1, (state.currentTimeSec - elapsed) / Math.max(seg.travelTime, 0.001));

      const startAbsAngle = epicenterAbsAngleDeg + seg.startAngle * (180 / Math.PI);
      const endAbsAngle = epicenterAbsAngleDeg + (seg.startAngle + (seg.endAngle - seg.startAngle) * segFrac) * (180 / Math.PI);

      const p0 = radiusAngleToCanvas(seg.startRadius, startAbsAngle, center, earthPixelRadius);
      const p1 = radiusAngleToCanvas(
        seg.startRadius + (seg.endRadius - seg.startRadius) * segFrac,
        endAbsAngle,
        center,
        earthPixelRadius,
      );

      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();

      elapsed += seg.travelTime;
    }
    ctx.globalAlpha = 1;
  };

  // Draw P rays (show only some for clarity)
  const pStep = Math.max(1, Math.floor(state.rays.length / 2 / 20));
  const sStart = state.rays.findIndex(r => r.phase === 'S' || r.phase === 'SKS');
  const sStep = Math.max(1, Math.floor((state.rays.length - sStart) / 20));

  for (let i = 0; i < state.rays.length; i++) {
    const ray = state.rays[i];
    if (ray.phase === 'P' || ray.phase === 'PKP' || ray.phase === 'PP') {
      if (i % pStep !== 0) continue;
      const color = ray.phase === 'PKP' ? WAVE_COLORS.PKP.stroke : WAVE_COLORS.P.stroke;
      drawRay(ray, color, 0.5 * amplitude);
    } else {
      if (i % sStep !== 0) continue;
      drawRay(ray, WAVE_COLORS.S.stroke, ray.isAbsorbed ? 0.15 : 0.45 * amplitude);
    }
  }
}

/** Draw wavefront dots (ray tips) */
function drawWavefronts(
  ctx: CanvasRenderingContext2D,
  config: DrawConfig,
  wavefronts: WavefrontData,
  epicenterAbsAngleDeg: number,
  amplitude: number,
): void {
  const { center, earthPixelRadius } = config;

  const drawTips = (tips: RayTip[], color: string) => {
    if (tips.length < 2) return;

    // Draw as a polyline connecting tips (sorted by angle)
    const sorted = [...tips].sort((a, b) => a.angleDeg - b.angleDeg);

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;

    for (let i = 0; i < sorted.length; i++) {
      const tip = sorted[i];
      const absAngle = epicenterAbsAngleDeg + tip.angleDeg;
      const pos = radiusAngleToCanvas(tip.radiusKm, absAngle, center, earthPixelRadius);
      ctx.globalAlpha = tip.opacity * amplitude;

      if (i === 0) ctx.moveTo(pos.x, pos.y);
      else ctx.lineTo(pos.x, pos.y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  drawTips(wavefronts.pTips, WAVE_COLORS.P.stroke);
  drawTips(wavefronts.sTips, WAVE_COLORS.S.stroke);
}

/** Draw epicenter marker (star / concentric circles) */
function drawEpicenter(
  ctx: CanvasRenderingContext2D,
  config: DrawConfig,
  epicenterAbsAngleDeg: number,
  depthKm: number,
): void {
  const { center, earthPixelRadius } = config;
  const focusRadius = EARTH_RADIUS_KM - depthKm;
  const pos = radiusAngleToCanvas(focusRadius, epicenterAbsAngleDeg, center, earthPixelRadius);

  // Draw star
  ctx.fillStyle = '#fbbf24';
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 1.5;
  drawStar(ctx, pos.x, pos.y, 6, 10, 4);

  // Surface marker
  const surfPos = radiusAngleToCanvas(EARTH_RADIUS_KM, epicenterAbsAngleDeg, center, earthPixelRadius);
  ctx.beginPath();
  ctx.arc(surfPos.x, surfPos.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#f97316';
  ctx.fill();
  ctx.strokeStyle = '#7c2d12';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Dashed line from surface to focus
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(surfPos.x, surfPos.y);
  ctx.lineTo(pos.x, pos.y);
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  points: number,
): void {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/** Draw observer points on the surface */
function drawObservers(
  ctx: CanvasRenderingContext2D,
  config: DrawConfig,
  state: SimulationState,
): void {
  const { center, earthPixelRadius, isDark } = config;
  const epicenterAbsAngleDeg = state.epicenter.surfaceAngleDeg;

  for (const obs of state.observers) {
    const absAngle = epicentralToAbsAngle(obs.surfaceAngleDeg, epicenterAbsAngleDeg);
    const pos = radiusAngleToCanvas(EARTH_RADIUS_KM, absAngle, center, earthPixelRadius);

    const hasP = obs.arrivals.some(a => (a.phase === 'P' || a.phase === 'PKP') && a.hasArrived);
    const hasS = obs.arrivals.some(a => a.phase === 'S' && a.hasArrived);
    const inPShadow = obs.inShadowZone.P;
    const inSShadow = obs.inShadowZone.S;
    const isSelected = state.selectedObserverId === obs.id;

    let fillColor = isDark ? '#6b7280' : '#9ca3af';
    if (hasP && hasS) fillColor = '#22c55e';
    else if (hasP) fillColor = '#3b82f6';
    else if (inSShadow && inPShadow) fillColor = '#dc2626';
    else if (inSShadow) fillColor = '#f97316';

    // Outer ring for selected
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = isDark ? '#1f2937' : '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Label
    ctx.fillStyle = isDark ? '#e5e7eb' : '#1f2937';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(obs.label, pos.x, pos.y - 12);
  }
}

/** Draw arrival pulse animation on observer points */
function drawArrivalPulses(
  ctx: CanvasRenderingContext2D,
  config: DrawConfig,
  state: SimulationState,
): void {
  const { center, earthPixelRadius } = config;
  const epicenterAbsAngleDeg = state.epicenter.surfaceAngleDeg;

  for (const obs of state.observers) {
    const newArrivals = obs.arrivals.filter(
      a => a.hasArrived && Math.abs(state.currentTimeSec - a.travelTimeSec) < 3,
    );
    if (newArrivals.length === 0) continue;

    const absAngle = epicentralToAbsAngle(obs.surfaceAngleDeg, epicenterAbsAngleDeg);
    const pos = radiusAngleToCanvas(EARTH_RADIUS_KM, absAngle, center, earthPixelRadius);

    const pulse = Math.sin(state.currentTimeSec * 10) * 0.5 + 0.5;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 10 + pulse * 6, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(251, 191, 36, ${0.6 * pulse})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

/**
 * Main draw function — called every animation frame.
 */
export function drawEarth(
  ctx: CanvasRenderingContext2D,
  config: DrawConfig,
  state: SimulationState,
  wavefronts: WavefrontData,
): void {
  const { epicenter } = state;

  // Clear
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Draw layers
  drawLayers(ctx, config);

  // Draw shadow zones
  drawShadowZones(
    ctx,
    config,
    epicenter.surfaceAngleDeg,
    state.shadowZone.pShadowStart,
    state.shadowZone.pShadowEnd,
    state.shadowZone.sShadowStart,
  );

  const amp = waveAmplitude(epicenter.magnitudeM);

  // Draw ray paths
  drawRayPaths(ctx, config, state, amp);

  // Draw wavefronts
  drawWavefronts(ctx, config, wavefronts, epicenter.surfaceAngleDeg, amp);

  // Draw epicenter
  drawEpicenter(ctx, config, epicenter.surfaceAngleDeg, epicenter.depthKm);

  // Draw observers
  drawObservers(ctx, config, state);

  // Draw arrival pulses
  drawArrivalPulses(ctx, config, state);
}
