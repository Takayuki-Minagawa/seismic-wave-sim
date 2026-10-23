import { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { SimulationState, EpicenterConfig } from '../../physics/types';
import { EarthCanvas } from './EarthCanvas';
import { WaveLegend } from './WaveLegend';
import { QuakeButton, QuakePhase } from '../common/QuakeButton';
import { formatClock } from '../../utils/formatters';

interface EarthStageProps {
  state: SimulationState;
  isDark: boolean;
  phase: QuakePhase;
  endTimeSec: number;
  onQuake: () => void;
  onEpicenterChange: (config: EpicenterConfig) => void;
  onAddObserver: (epicentralDeg: number, side: 1 | -1) => void;
  onSelectObserver: (id: string | null) => void;
}

/** Earth cross-section plus its heads-up display (status, clock, hints, legend, CTA). */
export function EarthStage({
  state,
  isDark,
  phase,
  endTimeSec,
  onQuake,
  onEpicenterChange,
  onAddObserver,
  onSelectObserver,
}: EarthStageProps) {
  const { t } = useTranslation();

  // Shake the view during the first moments of a quake (derived from sim time).
  const realElapsed = state.currentTimeSec / Math.max(1, state.speedMultiplier);
  const shaking = state.currentTimeSec > 0 && realElapsed < 0.8;
  const shakeStyle = { '--shake': (0.3 + state.epicenter.magnitudeM / 9).toFixed(2) } as CSSProperties;
  const progress = Math.min(1, state.currentTimeSec / endTimeSec);

  const statusText = t(`hud.${phase}`);
  const statusDot = phase === 'playing' ? 'bg-rose-400' : phase === 'paused' ? 'bg-amber-400' : 'bg-emerald-400';

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className={`absolute inset-0 ${shaking ? 'animate-quake' : ''}`} style={shakeStyle}>
        <EarthCanvas
          state={state}
          isDark={isDark}
          onEpicenterChange={onEpicenterChange}
          onAddObserver={onAddObserver}
          onSelectObserver={onSelectObserver}
        />
      </div>

      {/* Top-left: status + clock */}
      <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
        <span className="flex w-fit items-center gap-2 rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
          <span className="relative flex h-2.5 w-2.5">
            {phase === 'playing' && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${statusDot} opacity-75`} />}
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${statusDot}`} />
          </span>
          {statusText}
        </span>
        <div className="w-fit rounded-xl bg-black/50 px-3 py-1.5 backdrop-blur-sm">
          <div className="font-hud text-2xl font-bold leading-none tracking-wider text-white tabular-nums sm:text-3xl">
            <span className="mr-1 text-sm text-sky-300">T+</span>
            {formatClock(state.currentTimeSec)}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-300">
            <span className="font-hud text-amber-300">×{state.speedMultiplier}</span>
            <span>
              {t('hud.focus')} <b className="font-hud text-white">{state.epicenter.depthKm}</b> km
            </span>
            <span className="font-hud font-bold text-rose-300">M{state.epicenter.magnitudeM.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Top-right: interaction hints */}
      <div className="pointer-events-none absolute right-3 top-3 hidden flex-col items-end gap-1 sm:flex">
        <span className="rounded-full bg-black/45 px-2.5 py-1 text-[11px] text-slate-200 backdrop-blur-sm">🖱️ {t('hud.hintClick')}</span>
        <span className="rounded-full bg-black/45 px-2.5 py-1 text-[11px] text-slate-200 backdrop-blur-sm">📍 {t('hud.hintDouble')}</span>
      </div>

      {/* Bottom: legend + CTA */}
      <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-col items-center gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="order-2 sm:order-1">
          <WaveLegend />
        </div>
        <div className="pointer-events-auto order-1 sm:order-2">
          <QuakeButton phase={phase} onClick={onQuake} size="lg" className={phase === 'idle' ? 'animate-float' : ''} />
        </div>
      </div>

      {/* Progress of the whole run */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-sky-400 via-violet-400 to-rose-400 transition-[width] duration-100"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
