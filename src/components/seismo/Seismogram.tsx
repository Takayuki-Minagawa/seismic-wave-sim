import { useEffect, useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ObserverArrival, ObserverPoint, SimulationState } from '../../physics/types';
import { WAVE_COLORS } from '../../utils/colorScale';

interface SeismogramProps {
  state: SimulationState;
  endTimeSec: number;
  isDark: boolean;
  onSelectObserver: (id: string | null) => void;
}

const PHASE_STYLE: Record<string, { amp: number; period: number; decay: number; color: string }> = {
  P: { amp: 0.45, period: 7, decay: 110, color: WAVE_COLORS.P.stroke },
  PKP: { amp: 0.4, period: 9, decay: 90, color: WAVE_COLORS.PKP.stroke },
  S: { amp: 1.0, period: 16, decay: 170, color: WAVE_COLORS.S.stroke },
};

/** Deterministic pseudo-random in [-1, 1] so the trace doesn't flicker between frames. */
function hashNoise(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

/** Synthetic ground motion at time t: background noise plus a decaying wave train per arrival. */
function groundMotion(t: number, arrivals: ObserverArrival[], gain: number): number {
  let y = hashNoise(Math.floor(t * 2)) * 0.025;
  for (const a of arrivals) {
    const style = PHASE_STYLE[a.phase];
    if (!style) continue;
    const dt = t - a.travelTimeSec;
    if (dt < 0) continue;
    const envelope = (1 - Math.exp(-dt / 3)) * Math.exp(-dt / style.decay);
    const carrier =
      0.65 * Math.sin((2 * Math.PI * dt) / style.period) +
      0.25 * Math.sin((2 * Math.PI * dt) / (style.period * 0.47) + 1.3) +
      0.25 * hashNoise(Math.floor(t * 3) + 17);
    y += style.amp * gain * envelope * carrier;
  }
  return y;
}

function pickObserver(state: SimulationState): ObserverPoint | null {
  return state.observers.find(o => o.id === state.selectedObserverId) ?? state.observers[0] ?? null;
}

export function Seismogram({ state, endTimeSec, isDark, onSelectObserver }: SeismogramProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ width: 1, height: 1, dpr: 1 });
  const propsRef = useRef({ state, endTimeSec, isDark });

  useLayoutEffect(() => {
    propsRef.current = { state, endTimeSec, isDark };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ro = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      sizeRef.current = { width, height, dpr };
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const { width, height, dpr } = sizeRef.current;
      const { state: s, endTimeSec: T, isDark: dark } = propsRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const padL = 8;
      const padR = 8;
      const padT = 22;
      const padB = 18;
      const w = width - padL - padR;
      const h = height - padT - padB;
      const midY = padT + h / 2;
      const xOf = (sec: number) => padL + (sec / T) * w;

      // Paper grid
      ctx.strokeStyle = dark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.08)';
      ctx.lineWidth = 1;
      ctx.font = "600 9px 'Orbitron', sans-serif";
      ctx.fillStyle = dark ? 'rgba(203,213,225,0.6)' : 'rgba(51,65,85,0.6)';
      ctx.textAlign = 'center';
      const step = T > 1200 ? 300 : 200;
      for (let sec = 0; sec <= T; sec += step) {
        const x = xOf(sec);
        ctx.beginPath();
        ctx.moveTo(x, padT);
        ctx.lineTo(x, padT + h);
        ctx.stroke();
        ctx.fillText(`${sec}s`, Math.min(Math.max(x, 14), width - 14), height - 5);
      }
      ctx.beginPath();
      ctx.moveTo(padL, midY);
      ctx.lineTo(padL + w, midY);
      ctx.stroke();

      const obs = pickObserver(s);
      if (!obs) return;

      const gain = (0.45 + (s.epicenter.magnitudeM / 9) * 0.55) * Math.max(0.45, 1.15 - obs.surfaceAngleDeg / 220);
      const now = Math.min(s.currentTimeSec, T);
      const nowX = xOf(now);

      // Trace drawn as min/max envelope per pixel column — looks like a real drum recorder.
      ctx.strokeStyle = dark ? '#e2e8f0' : '#0f172a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const amp = h * 0.46;
      for (let px = padL; px <= nowX; px++) {
        const t0 = ((px - padL) / w) * T;
        const t1 = ((px + 1 - padL) / w) * T;
        let lo = Infinity;
        let hi = -Infinity;
        for (let k = 0; k < 4; k++) {
          const v = groundMotion(t0 + ((t1 - t0) * k) / 4, obs.arrivals, gain);
          lo = Math.min(lo, v);
          hi = Math.max(hi, v);
        }
        const y0 = midY - Math.max(-1, Math.min(1, hi)) * amp;
        const y1 = midY - Math.max(-1, Math.min(1, lo)) * amp;
        if (px === padL) ctx.moveTo(px, y0);
        else ctx.lineTo(px, y0);
        ctx.lineTo(px, y1);
      }
      ctx.stroke();

      // Arrival markers
      ctx.font = "800 10px 'M PLUS Rounded 1c', sans-serif";
      for (const a of obs.arrivals) {
        const style = PHASE_STYLE[a.phase];
        if (!style || !a.hasArrived) continue;
        const x = xOf(a.travelTimeSec);
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = style.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, padT - 4);
        ctx.lineTo(x, padT + h);
        ctx.stroke();
        ctx.setLineDash([]);
        const label = a.phase;
        const lw = ctx.measureText(label).width + 8;
        ctx.fillStyle = style.color;
        ctx.beginPath();
        ctx.roundRect(x - lw / 2, 2, lw, 14, 7);
        ctx.fill();
        ctx.fillStyle = '#0b1020';
        ctx.fillText(label, x, 12.5);
      }

      // S−P bracket
      const p = obs.arrivals.find(a => a.phase === 'P');
      const sArr = obs.arrivals.find(a => a.phase === 'S');
      if (p?.hasArrived && sArr?.hasArrived) {
        const x0 = xOf(p.travelTimeSec);
        const x1 = xOf(sArr.travelTimeSec);
        const y = padT + 6;
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(x1, y);
        ctx.moveTo(x0 + 5, y - 3);
        ctx.lineTo(x0, y);
        ctx.lineTo(x0 + 5, y + 3);
        ctx.moveTo(x1 - 5, y - 3);
        ctx.lineTo(x1, y);
        ctx.lineTo(x1 - 5, y + 3);
        ctx.stroke();
      }

      // Recording pen
      if (now > 0 && now < T) {
        const v = groundMotion(now, obs.arrivals, gain);
        const y = midY - Math.max(-1, Math.min(1, v)) * amp;
        const g = ctx.createRadialGradient(nowX, y, 0, nowX, y, 10);
        g.addColorStop(0, 'rgba(251,191,36,0.9)');
        g.addColorStop(1, 'rgba(251,191,36,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(nowX, y, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  const obs = pickObserver(state);
  const p = obs?.arrivals.find(a => a.phase === 'P');
  const sArr = obs?.arrivals.find(a => a.phase === 'S');
  const spReady = p?.hasArrived && sArr?.hasArrived;

  return (
    <div className="flex h-full flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {obs ? (
          <>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              📡 {t('seismo.station', { label: obs.label, dist: obs.surfaceAngleDeg.toFixed(0) })}
            </span>
            {state.observers.length > 1 && (
              <div className="flex gap-1" aria-label={t('seismo.pick')}>
                {state.observers.map(o => (
                  <button
                    key={o.id}
                    onClick={() => onSelectObserver(o.id)}
                    className={`h-6 w-6 rounded-full text-[11px] font-extrabold transition-colors ${
                      o.id === obs.id
                        ? 'bg-amber-400 text-slate-900'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
            <span className="ml-auto text-xs">
              {obs.inShadowZone.S ? (
                <span className="font-bold text-rose-500 dark:text-rose-300">🚫 {t('seismo.noS')}</span>
              ) : spReady ? (
                <span className="rounded-lg bg-amber-400/15 px-2 py-0.5 font-bold text-amber-700 dark:text-amber-300">
                  ⏱ {t('seismo.sp')}: <span className="font-hud">{t('seismo.spValue', { sec: (sArr!.travelTimeSec - p!.travelTimeSec).toFixed(0) })}</span>
                </span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">{t('seismo.waiting')}</span>
              )}
            </span>
          </>
        ) : (
          <span className="text-xs text-slate-500 dark:text-slate-400">{t('seismo.noObserver')}</span>
        )}
      </div>
      <div ref={containerRef} className="relative min-h-0 flex-1 rounded-xl bg-slate-50/80 ring-1 ring-slate-900/5 dark:bg-black/30 dark:ring-white/5">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>
      {spReady && !obs?.inShadowZone.S && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">💡 {t('seismo.spHint')}</p>
      )}
    </div>
  );
}
