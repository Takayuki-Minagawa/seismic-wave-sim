/**
 * Pure canvas drawing functions for the Earth cross-section view.
 * Called from requestAnimationFrame — NO React state access here.
 *
 * The ray fan is traced on one side of the epicenter only; because the
 * model is spherically symmetric we mirror it to draw the full wavefield.
 */

import { EARTH_LAYERS } from '../../data/earthModel';
import { SimulationState, RaySegment, Ray } from '../../physics/types';
import { WavefrontData, RayTip, pointAlongSegment } from '../../physics/wavefront';
import { EARTH_RADIUS_KM, DEG_TO_RAD } from '../../physics/constants';
import { radiusAngleToCanvas, CanvasCenter, epicentralToAbsAngle, drawCircle } from '../../utils/geometry';
import { WAVE_COLORS, SHADOW_ZONE_COLOR, SHADOW_ZONE_P_COLOR, waveAmplitude, shade } from '../../utils/colorScale';

export interface DrawConfig {
  center: CanvasCenter;
  earthPixelRadius: number;
  isDark: boolean;
  width: number;
  height: number;
  layerLabels: Record<string, string>;
}

const SIDES = [1, -1] as const;

function kmToPixel(km: number, earthPixelRadius: number): number {
  return (km / EARTH_RADIUS_KM) * earthPixelRadius;
}

// Deterministic starfield (normalized coordinates) shared by all frames.
const STARS = Array.from({ length: 180 }, (_, i) => {
  const rand = (n: number) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  return { x: rand(1), y: rand(2), r: 0.4 + rand(3) * 1.3, phase: rand(4) * Math.PI * 2, speed: 0.5 + rand(5) * 1.5 };
});

function drawBackground(ctx: CanvasRenderingContext2D, config: DrawConfig, now: number): void {
  const { width, height, isDark } = config;
  if (!isDark) {
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, '#dbeafe');
    g.addColorStop(1, '#eef2ff');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  const g = ctx.createRadialGradient(width * 0.5, height * 0.45, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.8);
  g.addColorStop(0, '#0d1638');
  g.addColorStop(1, '#03050f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  for (const star of STARS) {
    const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(now * 0.001 * star.speed + star.phase));
    ctx.globalAlpha = twinkle * 0.8;
    ctx.fillStyle = '#e0e7ff';
    ctx.beginPath();
    ctx.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Soft atmosphere halo around the planet. */
function drawAtmosphere(ctx: CanvasRenderingContext2D, config: DrawConfig): void {
  const { center, earthPixelRadius: R, isDark } = config;
  const g = ctx.createRadialGradient(center.x, center.y, R * 0.98, center.x, center.y, R * 1.16);
  g.addColorStop(0, isDark ? 'rgba(56,189,248,0.45)' : 'rgba(59,130,246,0.35)');
  g.addColorStop(0.4, isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.12)');
  g.addColorStop(1, 'rgba(99,102,241,0)');
  ctx.fillStyle = g;
  drawCircle(ctx, center.x, center.y, R * 1.16);
  ctx.fill();
}

/** Draw the concentric Earth layers with radial shading. */
function drawLayers(ctx: CanvasRenderingContext2D, config: DrawConfig): void {
  const { center, earthPixelRadius, isDark } = config;
  // Outermost first: each layer is a full disc painted over the previous one.
  for (const layer of EARTH_LAYERS) {
    const outer = kmToPixel(layer.outerRadius, earthPixelRadius);
    const inner = kmToPixel(layer.innerRadius, earthPixelRadius);
    const base = isDark ? layer.darkColor : layer.color;
    const g = ctx.createRadialGradient(center.x, center.y, inner, center.x, center.y, outer);
    g.addColorStop(0, shade(base, layer.name === 'innerCore' ? 1.45 : 1.18));
    g.addColorStop(1, shade(base, 0.82));
    drawCircle(ctx, center.x, center.y, outer);
    ctx.fillStyle = g;
    ctx.fill();
  }

  // Hot glow at the very center
  const coreR = kmToPixel(EARTH_LAYERS[EARTH_LAYERS.length - 1].outerRadius, earthPixelRadius);
  const glow = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, coreR * 1.2);
  glow.addColorStop(0, 'rgba(255,255,230,0.7)');
  glow.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.fillStyle = glow;
  drawCircle(ctx, center.x, center.y, coreR * 1.2);
  ctx.fill();

  for (const layer of EARTH_LAYERS) {
    const r = kmToPixel(layer.outerRadius, earthPixelRadius);
    drawCircle(ctx, center.x, center.y, r);
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

/** Layer names written along the lower-left radius (opposite the default epicenter). */
function drawLayerLabels(ctx: CanvasRenderingContext2D, config: DrawConfig): void {
  const { center, earthPixelRadius, layerLabels } = config;
  if (earthPixelRadius < 140) return;
  const fontSize = Math.max(10, Math.min(13, earthPixelRadius / 22));
  ctx.font = `600 ${fontSize}px 'M PLUS Rounded 1c', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const layer of EARTH_LAYERS) {
    // Crust and upper mantle are too thin to label legibly.
    if (layer.name === 'crust' || layer.name === 'upperMantle') continue;
    const midKm = layer.name === 'innerCore' ? 0 : (layer.outerRadius + layer.innerRadius) / 2;
    const pos = radiusAngleToCanvas(midKm, 205, center, earthPixelRadius);
    const label = layerLabels[layer.name] ?? layer.name;
    const w = ctx.measureText(label).width + 10;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    roundRect(ctx, pos.x - w / 2, pos.y - fontSize * 0.8, w, fontSize * 1.6, fontSize * 0.8);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(label, pos.x, pos.y + 0.5);
  }
  ctx.textBaseline = 'alphabetic';
}

/** Shadow zone arcs plus a "protractor" of epicentral distances. */
function drawShadowZones(
  ctx: CanvasRenderingContext2D,
  config: DrawConfig,
  state: SimulationState,
): void {
  const { center, earthPixelRadius, isDark } = config;
  const epi = state.epicenter.surfaceAngleDeg;
  const { pShadowStart, pShadowEnd, sShadowStart } = state.shadowZone;
  const r = earthPixelRadius + 6;

  const arc = (fromDeg: number, toDeg: number, color: string, width: number) => {
    for (const side of SIDES) {
      const a0 = (epi + side * fromDeg - 90) * DEG_TO_RAD;
      const a1 = (epi + side * toDeg - 90) * DEG_TO_RAD;
      ctx.beginPath();
      ctx.arc(center.x, center.y, r, Math.min(a0, a1), Math.max(a0, a1));
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  };

  arc(sShadowStart, 180, SHADOW_ZONE_COLOR, 7);
  arc(pShadowStart, Math.min(pShadowEnd, 180), SHADOW_ZONE_P_COLOR, 7);
  ctx.lineCap = 'butt';

  // Distance ticks every 30°, emphasised at the shadow boundaries.
  const tickColor = isDark ? 'rgba(203,213,225,0.55)' : 'rgba(51,65,85,0.55)';
  const fontSize = Math.max(9, Math.min(11, earthPixelRadius / 26));
  ctx.font = `600 ${fontSize}px 'Orbitron', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const ticks = [30, 60, 90, 120, 150, 180, pShadowStart, pShadowEnd];
  for (const deg of ticks) {
    const isBoundary = deg === pShadowStart || deg === pShadowEnd;
    for (const side of deg === 180 ? [1] : SIDES) {
      const abs = epi + side * deg;
      const p0 = radiusAngleToCanvas(EARTH_RADIUS_KM * 1.0, abs, center, earthPixelRadius);
      const p1 = radiusAngleToCanvas(EARTH_RADIUS_KM * (isBoundary ? 1.07 : 1.045), abs, center, earthPixelRadius);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.strokeStyle = isBoundary ? '#fb923c' : tickColor;
      ctx.lineWidth = isBoundary ? 2 : 1;
      ctx.stroke();

      if (earthPixelRadius > 120) {
        const pl = radiusAngleToCanvas(EARTH_RADIUS_KM * 1.12, abs, center, earthPixelRadius);
        ctx.fillStyle = isBoundary ? '#fb923c' : tickColor;
        ctx.fillText(`${Math.round(deg)}°`, pl.x, pl.y);
      }
    }
  }
  ctx.textBaseline = 'alphabetic';
}

function rayPoint(
  config: DrawConfig,
  epi: number,
  side: number,
  radiusKm: number,
  angleRad: number,
) {
  return radiusAngleToCanvas(radiusKm, epi + side * angleRad * (180 / Math.PI), config.center, config.earthPixelRadius);
}

/** Draw all ray segments up to the current time. */
function drawRayPaths(
  ctx: CanvasRenderingContext2D,
  config: DrawConfig,
  state: SimulationState,
  amplitude: number,
): void {
  const epi = state.epicenter.surfaceAngleDeg;
  if (state.currentTimeSec <= 0) return;

  const drawRay = (ray: Ray, color: string, alpha: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.3;
    ctx.globalAlpha = alpha;

    for (const side of SIDES) {
      let elapsed = 0;
      ctx.beginPath();
      let started = false;
      for (const seg of ray.segments as RaySegment[]) {
        if (elapsed > state.currentTimeSec) break;
        const segFrac = Math.min(1, (state.currentTimeSec - elapsed) / Math.max(seg.travelTime, 0.001));
        const p0 = rayPoint(config, epi, side, seg.startRadius, seg.startAngle);
        const tip = pointAlongSegment(seg, segFrac);
        const p1 = rayPoint(config, epi, side, tip.radiusKm, tip.angleRad);
        if (!started) {
          ctx.moveTo(p0.x, p0.y);
          started = true;
        }
        ctx.lineTo(p1.x, p1.y);
        elapsed += seg.travelTime;
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  const pStep = Math.max(1, Math.floor(state.rays.length / 2 / 22));
  const sStart = state.rays.findIndex(r => r.phase === 'S' || r.phase === 'SKS');
  const sStep = Math.max(1, Math.floor((state.rays.length - sStart) / 22));

  for (let i = 0; i < state.rays.length; i++) {
    const ray = state.rays[i];
    if (ray.phase === 'P' || ray.phase === 'PKP' || ray.phase === 'PP') {
      if (i % pStep !== 0) continue;
      const color = ray.phase === 'PKP' ? WAVE_COLORS.PKP.stroke : WAVE_COLORS.P.stroke;
      drawRay(ray, color, 0.42 * amplitude);
    } else {
      if (i % sStep !== 0) continue;
      drawRay(ray, WAVE_COLORS.S.stroke, ray.isAbsorbed ? 0.14 : 0.4 * amplitude);
    }
  }
}

/** Draw the wavefronts as glowing lines through the ray tips. */
function drawWavefronts(
  ctx: CanvasRenderingContext2D,
  config: DrawConfig,
  wavefronts: WavefrontData,
  epi: number,
  amplitude: number,
): void {
  const { center, earthPixelRadius } = config;
  const maxGap = earthPixelRadius * 0.18;

  const drawTips = (tips: RayTip[], color: string) => {
    if (tips.length < 2) return;
    // Mirror and order by signed angle so the front is one continuous curve.
    const signed = [
      ...tips.map(t => ({ ...t, signed: -t.angleDeg })),
      ...tips.map(t => ({ ...t, signed: t.angleDeg })),
    ].sort((a, b) => a.signed - b.signed);

    const pts = signed.map(t => ({
      ...radiusAngleToCanvas(t.radiusKm, epi + t.signed, center, earthPixelRadius),
      opacity: t.opacity,
    }));
    const avgOpacity = pts.reduce((s, p) => s + p.opacity, 0) / pts.length;

    const tracePath = () => {
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const prev = pts[i - 1];
        if (i === 0 || Math.hypot(p.x - prev.x, p.y - prev.y) > maxGap) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
    };

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;

    // Outer glow, then bright core
    tracePath();
    ctx.globalAlpha = 0.22 * avgOpacity * amplitude;
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.globalAlpha = Math.min(1, 1.1 * avgOpacity * amplitude);
    ctx.lineWidth = 2.6;
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.lineCap = 'butt';
  };

  drawTips(wavefronts.pTips, WAVE_COLORS.P.stroke);
  drawTips(wavefronts.sTips, WAVE_COLORS.S.stroke);
}

/** Epicenter / focus marker with a burst when the quake starts. */
function drawEpicenter(
  ctx: CanvasRenderingContext2D,
  config: DrawConfig,
  state: SimulationState,
  now: number,
): void {
  const { center, earthPixelRadius } = config;
  const epi = state.epicenter.surfaceAngleDeg;
  const pos = radiusAngleToCanvas(EARTH_RADIUS_KM - state.epicenter.depthKm, epi, center, earthPixelRadius);
  const surfPos = radiusAngleToCanvas(EARTH_RADIUS_KM, epi, center, earthPixelRadius);

  // Burst rings during the first moments of the quake (in real seconds).
  const realElapsed = state.currentTimeSec / Math.max(state.speedMultiplier, 1);
  if (state.currentTimeSec > 0 && realElapsed < 1.6) {
    const mag = state.epicenter.magnitudeM;
    for (let k = 0; k < 3; k++) {
      const t = realElapsed - k * 0.18;
      if (t <= 0) continue;
      const radius = 6 + t * (20 + mag * 6);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(253, 224, 71, ${Math.max(0, 0.8 - t / 1.6)})`;
      ctx.lineWidth = 3 - k * 0.7;
      ctx.stroke();
    }
  }

  // Dashed line from epicenter (surface) to focus
  if (state.epicenter.depthKm > 0) {
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(surfPos.x, surfPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Pulsing glow
  const pulse = 0.5 + 0.5 * Math.sin(now * 0.005);
  const glowR = 14 + pulse * 6;
  const g = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, glowR);
  g.addColorStop(0, 'rgba(253, 224, 71, 0.75)');
  g.addColorStop(1, 'rgba(253, 224, 71, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, glowR, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fde047';
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 1.5;
  drawStar(ctx, pos.x, pos.y, 10, 4.5, 5);
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

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Observer stations drawn as seismometer triangles. */
function drawObservers(
  ctx: CanvasRenderingContext2D,
  config: DrawConfig,
  state: SimulationState,
  now: number,
): void {
  const { center, earthPixelRadius, isDark } = config;
  const epi = state.epicenter.surfaceAngleDeg;
  const arrivalWindow = 1.4 * Math.max(state.speedMultiplier, 1);

  for (const obs of state.observers) {
    const absAngle = epicentralToAbsAngle(obs.surfaceAngleDeg, epi, obs.side);
    const pos = radiusAngleToCanvas(EARTH_RADIUS_KM, absAngle, center, earthPixelRadius);
    const outward = (absAngle - 90) * DEG_TO_RAD;
    const ox = Math.cos(outward);
    const oy = Math.sin(outward);

    const hasP = obs.arrivals.some(a => (a.phase === 'P' || a.phase === 'PKP') && a.hasArrived);
    const hasS = obs.arrivals.some(a => a.phase === 'S' && a.hasArrived);
    const isSelected = state.selectedObserverId === obs.id;

    let fill = isDark ? '#94a3b8' : '#64748b';
    if (hasP && hasS) fill = '#4ade80';
    else if (hasP) fill = WAVE_COLORS.P.stroke;

    // Arrival ripples
    for (const a of obs.arrivals) {
      const dt = state.currentTimeSec - a.travelTimeSec;
      if (!a.hasArrived || dt < 0 || dt > arrivalWindow) continue;
      const t = dt / arrivalWindow;
      const color = a.phase === 'S' ? '251,113,133' : a.phase === 'PKP' ? '167,139,250' : '56,189,248';
      for (const k of [0, 0.35]) {
        const tk = t - k;
        if (tk <= 0) continue;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 8 + tk * 34, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${color}, ${Math.max(0, 0.9 * (1 - tk))})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
    }

    if (isSelected) {
      const pulse = 0.5 + 0.5 * Math.sin(now * 0.006);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 12 + pulse * 3, 0, Math.PI * 2);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Triangle pointing outward from the surface
    const size = 8;
    const px = -oy;
    const py = ox;
    const tipX = pos.x + ox * size * 1.1;
    const tipY = pos.y + oy * size * 1.1;
    const baseX = pos.x - ox * size * 0.55;
    const baseY = pos.y - oy * size * 0.55;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(baseX + px * size * 0.8, baseY + py * size * 0.8);
    ctx.lineTo(baseX - px * size * 0.8, baseY - py * size * 0.8);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = isDark ? '#0f172a' : '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Label bubble outside the surface
    const lx = pos.x + ox * 24;
    const ly = pos.y + oy * 24;
    ctx.beginPath();
    ctx.arc(lx, ly, 9, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? '#fbbf24' : isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.92)';
    ctx.fill();
    ctx.strokeStyle = fill;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = isSelected ? '#1f2937' : isDark ? '#e2e8f0' : '#0f172a';
    ctx.font = "800 11px 'M PLUS Rounded 1c', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(obs.label, lx, ly + 0.5);
    ctx.textBaseline = 'alphabetic';
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
  const now = performance.now();
  const amp = waveAmplitude(state.epicenter.magnitudeM);

  drawBackground(ctx, config, now);
  drawAtmosphere(ctx, config);
  drawLayers(ctx, config);
  drawLayerLabels(ctx, config);
  drawShadowZones(ctx, config, state);
  drawRayPaths(ctx, config, state, amp);
  drawWavefronts(ctx, config, wavefronts, state.epicenter.surfaceAngleDeg, amp);
  drawEpicenter(ctx, config, state, now);
  drawObservers(ctx, config, state, now);
}
