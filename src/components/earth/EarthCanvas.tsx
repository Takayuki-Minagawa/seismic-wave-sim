import { useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { SimulationState, EpicenterConfig } from '../../physics/types';
import { computeWavefronts } from '../../physics/wavefront';
import { drawEarth, DrawConfig } from './earthRenderer';
import { canvasToRadiusAngle, absAngleToEpicentral } from '../../utils/geometry';
import { EARTH_RADIUS_KM } from '../../physics/constants';
import { useTranslation } from 'react-i18next';

interface EarthCanvasProps {
  state: SimulationState;
  isDark: boolean;
  onEpicenterChange: (config: EpicenterConfig) => void;
  onAddObserver: (epicentralDeg: number) => void;
  onSelectObserver: (id: string | null) => void;
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
  const configRef = useRef<DrawConfig>({ center: { x: 0, y: 0 }, earthPixelRadius: 1, isDark });
  const stateRef = useRef(state);
  const isDraggingRef = useRef(false);
  const { t } = useTranslation();

  // Sync refs after each render — must not write refs during render (lint: react-hooks/refs).
  useLayoutEffect(() => {
    stateRef.current = state;
  });

  useLayoutEffect(() => {
    configRef.current = { ...configRef.current, isDark };
  }, [isDark]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      canvas.width = width;
      canvas.height = height;
      const earthPixelRadius = Math.min(width, height) * 0.42;
      configRef.current = {
        center: { x: width / 2, y: height / 2 },
        earthPixelRadius,
        isDark: configRef.current.isDark,
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
      if (!ctx) {
        rafId = requestAnimationFrame(render);
        return;
      }

      const s = stateRef.current;
      const pRays = s.rays.filter(r => r.phase === 'P' || r.phase === 'PKP' || r.phase === 'PP');
      const sRays = s.rays.filter(r => r.phase === 'S' || r.phase === 'SKS');

      const wavefronts = computeWavefronts(pRays, sRays, s.currentTimeSec);
      drawEarth(ctx, configRef.current, s, wavefronts);

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, []); // Only mount/unmount — reads latest state via stateRef

  // Coordinate helper
  const getEventPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getEventPos(e);
    const config = configRef.current;
    const s = stateRef.current;
    const { radiusKm, angleDeg } = canvasToRadiusAngle(x, y, config.center, config.earthPixelRadius);

    if (radiusKm > EARTH_RADIUS_KM * 1.1) return;

    // Check if clicking near an observer
    for (const obs of s.observers) {
      const obsAbsAngle = (s.epicenter.surfaceAngleDeg + obs.surfaceAngleDeg + 360) % 360;
      let diff = Math.abs(angleDeg - obsAbsAngle);
      if (diff > 180) diff = 360 - diff;
      if (diff < 5 && radiusKm >= EARTH_RADIUS_KM - 200) {
        onSelectObserver(obs.id);
        return;
      }
    }

    onSelectObserver(null);
    isDraggingRef.current = true;

    const depthKm = radiusKm >= EARTH_RADIUS_KM - 50
      ? s.epicenter.depthKm
      : Math.min(700, EARTH_RADIUS_KM - radiusKm);

    onEpicenterChange({
      ...s.epicenter,
      surfaceAngleDeg: angleDeg,
      depthKm,
    });
  }, [onEpicenterChange, onSelectObserver]);

  const handlePointerMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const { x, y } = getEventPos(e);
    const config = configRef.current;
    const s = stateRef.current;
    const { angleDeg } = canvasToRadiusAngle(x, y, config.center, config.earthPixelRadius);
    onEpicenterChange({ ...s.epicenter, surfaceAngleDeg: angleDeg });
  }, [onEpicenterChange]);

  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const { x, y } = getEventPos(e);
    const config = configRef.current;
    const s = stateRef.current;
    const { radiusKm, angleDeg } = canvasToRadiusAngle(x, y, config.center, config.earthPixelRadius);

    if (radiusKm >= EARTH_RADIUS_KM - 300) {
      const epicentralDeg = absAngleToEpicentral(angleDeg, s.epicenter.surfaceAngleDeg);
      onAddObserver(epicentralDeg);
    }
  }, [onAddObserver]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[300px]">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair touch-none"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown as (e: React.TouchEvent<HTMLCanvasElement>) => void}
        onDoubleClick={handleDoubleClick}
      />
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-gray-400 pointer-events-none whitespace-nowrap">
        {t('controls.time')}: {state.currentTimeSec.toFixed(0)}s
      </div>
    </div>
  );
}
