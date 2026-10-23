import { useRef, useEffect, useLayoutEffect } from 'react';
import { SimulationState, EpicenterConfig } from '../../physics/types';
import { computeWavefronts } from '../../physics/wavefront';
import { drawEarth, DrawConfig } from './earthRenderer';
import { canvasToRadiusAngle, absAngleToEpicentral, radiusAngleToCanvas, epicentralToAbsAngle } from '../../utils/geometry';
import { EARTH_RADIUS_KM } from '../../physics/constants';
import { EARTH_LAYERS } from '../../data/earthModel';
import { useTranslation } from 'react-i18next';

interface EarthCanvasProps {
  state: SimulationState;
  isDark: boolean;
  onEpicenterChange: (config: EpicenterConfig) => void;
  onAddObserver: (epicentralDeg: number) => void;
  onSelectObserver: (id: string | null) => void;
}

/** Max delay between two taps/clicks to count as a double-click (ms). */
const DOUBLE_TAP_MS = 280;
const DRAG_THRESHOLD_PX = 5;

interface PointerInfo {
  x: number;
  y: number;
  moved: boolean;
}

export function EarthCanvas({
  state,
  isDark,
  onEpicenterChange,
  onAddObserver,
  onSelectObserver,
}: EarthCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const configRef = useRef<DrawConfig>({
    center: { x: 0, y: 0 },
    earthPixelRadius: 1,
    isDark,
    width: 1,
    height: 1,
    layerLabels: {},
  });
  const dprRef = useRef(1);
  const stateRef = useRef(state);
  const pointerRef = useRef<PointerInfo | null>(null);
  const pendingClickRef = useRef<{ x: number; y: number; timer: number } | null>(null);
  const { t, i18n } = useTranslation();

  // Sync refs after each render — must not write refs during render (lint: react-hooks/refs).
  useLayoutEffect(() => {
    stateRef.current = state;
  });

  useLayoutEffect(() => {
    const layerLabels = Object.fromEntries(EARTH_LAYERS.map(l => [l.name, t(`layers.${l.name}`)]));
    configRef.current = { ...configRef.current, isDark, layerLabels };
  }, [isDark, t, i18n.language]);

  // Resize observer (renders at device pixel ratio for crisp lines)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dprRef.current = dpr;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      configRef.current = {
        ...configRef.current,
        center: { x: width / 2, y: height / 2 },
        earthPixelRadius: Math.min(width, height) * (Math.min(width, height) < 500 ? 0.4 : 0.38),
        width,
        height,
      };
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Animation / render loop — runs independently of React re-renders for smooth 60fps
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let rafId: number;

    const render = () => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const s = stateRef.current;
        const pRays = s.rays.filter(r => r.phase === 'P' || r.phase === 'PKP' || r.phase === 'PP');
        const sRays = s.rays.filter(r => r.phase === 'S' || r.phase === 'SKS');
        const wavefronts = computeWavefronts(pRays, sRays, s.currentTimeSec);
        const dpr = dprRef.current;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawEarth(ctx, configRef.current, s, wavefronts);
      }
      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, []); // Only mount/unmount — reads latest state via stateRef

  useEffect(() => () => {
    if (pendingClickRef.current) window.clearTimeout(pendingClickRef.current.timer);
  }, []);

  const localPos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const polar = (x: number, y: number) => {
    const config = configRef.current;
    return canvasToRadiusAngle(x, y, config.center, config.earthPixelRadius);
  };

  /** Return the observer drawn under (x, y), checking both the marker and its label bubble. */
  const hitObserver = (x: number, y: number) => {
    const { center, earthPixelRadius } = configRef.current;
    const s = stateRef.current;
    for (const obs of s.observers) {
      const abs = epicentralToAbsAngle(obs.surfaceAngleDeg, s.epicenter.surfaceAngleDeg);
      const marker = radiusAngleToCanvas(EARTH_RADIUS_KM, abs, center, earthPixelRadius);
      const label = radiusAngleToCanvas(EARTH_RADIUS_KM + (24 / earthPixelRadius) * EARTH_RADIUS_KM, abs, center, earthPixelRadius);
      if (Math.hypot(marker.x - x, marker.y - y) < 14 || Math.hypot(label.x - x, label.y - y) < 12) {
        return obs;
      }
    }
    return null;
  };

  /** Single click: move the focus (surface click keeps depth, inner click sets depth). */
  const handleSingleClick = (x: number, y: number) => {
    const s = stateRef.current;
    const { radiusKm, angleDeg } = polar(x, y);
    if (radiusKm > EARTH_RADIUS_KM * 1.15) return;
    const depthKm = radiusKm >= EARTH_RADIUS_KM - 50
      ? s.epicenter.depthKm
      : Math.round(Math.min(700, EARTH_RADIUS_KM - radiusKm) / 5) * 5;
    onEpicenterChange({ ...s.epicenter, surfaceAngleDeg: angleDeg, depthKm });
  };

  /** Double click near the surface: add a station there. */
  const handleDoubleClick = (x: number, y: number) => {
    const s = stateRef.current;
    const { radiusKm, angleDeg } = polar(x, y);
    if (radiusKm < EARTH_RADIUS_KM * 0.85 || radiusKm > EARTH_RADIUS_KM * 1.2) return;
    onAddObserver(absAngleToEpicentral(angleDeg, s.epicenter.surfaceAngleDeg));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = localPos(e);
    const { radiusKm } = polar(x, y);
    if (radiusKm > EARTH_RADIUS_KM * 1.2) return;

    const obs = hitObserver(x, y);
    if (obs) {
      onSelectObserver(obs.id);
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    pointerRef.current = { x, y, moved: false };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = pointerRef.current;
    if (!p) return;
    const { x, y } = localPos(e);
    if (!p.moved && Math.hypot(x - p.x, y - p.y) < DRAG_THRESHOLD_PX) return;
    p.moved = true;
    if (pendingClickRef.current) {
      window.clearTimeout(pendingClickRef.current.timer);
      pendingClickRef.current = null;
    }
    const s = stateRef.current;
    onEpicenterChange({ ...s.epicenter, surfaceAngleDeg: polar(x, y).angleDeg });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = pointerRef.current;
    pointerRef.current = null;
    if (!p || p.moved) return;

    const { x, y } = localPos(e);
    const pending = pendingClickRef.current;
    if (pending && Math.hypot(pending.x - x, pending.y - y) < 24) {
      window.clearTimeout(pending.timer);
      pendingClickRef.current = null;
      handleDoubleClick(x, y);
      return;
    }
    if (pending) window.clearTimeout(pending.timer);
    // Defer the single-click action so a double-click doesn't move the focus first.
    pendingClickRef.current = {
      x,
      y,
      timer: window.setTimeout(() => {
        pendingClickRef.current = null;
        handleSingleClick(x, y);
      }, DOUBLE_TAP_MS),
    };
  };

  const handlePointerCancel = () => {
    pointerRef.current = null;
  };

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[260px]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        aria-label={t('appTitle')}
        role="img"
      />
    </div>
  );
}
