export function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(0)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export function formatDistance(deg: number): string {
  return `${deg.toFixed(1)}°`;
}

export function formatVelocity(kmPerSec: number): string {
  return `${kmPerSec.toFixed(1)} km/s`;
}

export function formatDepth(km: number): string {
  return `${km.toFixed(0)} km`;
}

/** "MM:SS" clock for the simulation HUD. */
export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
