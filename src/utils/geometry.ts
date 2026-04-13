import { EARTH_RADIUS_KM, DEG_TO_RAD } from '../physics/constants';

export interface CanvasCenter {
  x: number;
  y: number;
}

/**
 * Convert radius (km) and angle (degrees from top, clockwise) to canvas coordinates.
 * angle=0 is at top (12 o'clock). The epicenter is always drawn at the top.
 */
export function radiusAngleToCanvas(
  radiusKm: number,
  angleDeg: number,
  center: CanvasCenter,
  earthPixelRadius: number,
): { x: number; y: number } {
  const scale = earthPixelRadius / EARTH_RADIUS_KM;
  const r = radiusKm * scale;
  // angle=0 → top (270° in standard math). Convert to standard angles.
  const rad = (angleDeg - 90) * DEG_TO_RAD;
  return {
    x: center.x + r * Math.cos(rad),
    y: center.y + r * Math.sin(rad),
  };
}

/**
 * Convert canvas (x, y) to radius (km) and angle (degrees from top).
 */
export function canvasToRadiusAngle(
  x: number,
  y: number,
  center: CanvasCenter,
  earthPixelRadius: number,
): { radiusKm: number; angleDeg: number } {
  const scale = earthPixelRadius / EARTH_RADIUS_KM;
  const dx = x - center.x;
  const dy = y - center.y;
  const r = Math.sqrt(dx * dx + dy * dy);
  const radiusKm = r / scale;
  // atan2 standard: 0 = right, CCW. We want 0 = top, CW.
  const rad = Math.atan2(dy, dx);
  const angleDeg = (rad * 180 / Math.PI + 90 + 360) % 360;
  return { radiusKm, angleDeg };
}

/**
 * Absolute surface angle on the Earth canvas.
 * The epicenter sits at epicenterAbsAngleDeg on the canvas.
 * An observer at epicentralDeg from epicenter is at (epicenterAbsAngleDeg + epicentralDeg).
 */
export function epicentralToAbsAngle(
  epicentralDeg: number,
  epicenterAbsAngleDeg: number,
): number {
  return (epicenterAbsAngleDeg + epicentralDeg + 360) % 360;
}

/**
 * Given absolute canvas angle of observer and epicenter, compute epicentral distance (0–180°).
 */
export function absAngleToEpicentral(
  observerAbsAngleDeg: number,
  epicenterAbsAngleDeg: number,
): number {
  let diff = ((observerAbsAngleDeg - epicenterAbsAngleDeg) + 360) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

/** Draw a filled arc path on a canvas context */
export function drawCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
}
