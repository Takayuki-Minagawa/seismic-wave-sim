import { useTranslation } from 'react-i18next';
import { SimulationState, EpicenterConfig } from '../../physics/types';
import { Slider } from '../common/Slider';
import { ShadowZoneBadge } from '../common/ShadowZoneBadge';
import { QuakeButton, QuakePhase } from '../common/QuakeButton';
import { PRESETS } from '../../data/presets';
import { WAVE_COLORS } from '../../utils/colorScale';

interface ControlPanelProps {
  state: SimulationState;
  phase: QuakePhase;
  onQuake: () => void;
  onEpicenterChange: (config: EpicenterConfig) => void;
  onReset: () => void;
  onSetSpeed: (m: number) => void;
  onAddObserver: () => void;
  onRemoveObserver: (id: string) => void;
  onSelectObserver: (id: string | null) => void;
  onLoadPreset: (epicenter: EpicenterConfig, observerAngles: number[]) => void;
}

const SPEED_OPTIONS = [10, 30, 60, 120];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
      {children}
    </h3>
  );
}

export function ControlPanel({
  state,
  phase,
  onQuake,
  onEpicenterChange,
  onReset,
  onSetSpeed,
  onAddObserver,
  onRemoveObserver,
  onSelectObserver,
  onLoadPreset,
}: ControlPanelProps) {
  const { t } = useTranslation();
  const { depthKm, magnitudeM } = state.epicenter;

  const depthHint = depthKm < 70 ? t('controls.depthShallow') : depthKm < 300 ? t('controls.depthIntermediate') : t('controls.depthDeep');
  const magHint = magnitudeM < 6 ? t('controls.magSmall') : magnitudeM < 8 ? t('controls.magStrong') : t('controls.magGreat');

  return (
    <div className="scroll-thin flex h-full flex-col gap-4 overflow-y-auto p-4">
      {/* Main action */}
      <div className="flex gap-2">
        <QuakeButton phase={phase} onClick={onQuake} className="flex-1" />
        <button
          onClick={onReset}
          title={t('controls.reset')}
          aria-label={t('controls.reset')}
          className="flex w-11 items-center justify-center rounded-2xl bg-slate-200 text-slate-600 transition-colors hover:bg-slate-300 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Speed selector */}
      <div className="flex flex-col gap-1.5">
        <SectionTitle>⏩ {t('controls.speed')}</SectionTitle>
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-200/70 p-1 dark:bg-white/5">
          {SPEED_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => onSetSpeed(s)}
              className={`rounded-lg py-1 font-hud text-xs font-bold transition-all ${
                state.speedMultiplier === s
                  ? 'bg-white text-violet-600 shadow-sm dark:bg-violet-500 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              ×{s}
            </button>
          ))}
        </div>
      </div>

      {/* Epicenter controls */}
      <div className="flex flex-col gap-3">
        <Slider
          icon="⛏️"
          label={t('controls.depth')}
          value={depthKm}
          min={0}
          max={700}
          step={5}
          unit=" km"
          hint={depthHint}
          colors={['#fbbf24', '#f97316']}
          onChange={v => onEpicenterChange({ ...state.epicenter, depthKm: v })}
        />
        <Slider
          icon="📈"
          label={t('controls.magnitude')}
          value={magnitudeM}
          min={1}
          max={9.5}
          step={0.1}
          hint={magHint}
          colors={['#fb7185', '#e11d48']}
          onChange={v => onEpicenterChange({ ...state.epicenter, magnitudeM: v })}
          formatValue={v => `M${v.toFixed(1)}`}
        />
      </div>

      {/* Presets */}
      <div className="flex flex-col gap-1.5">
        <SectionTitle>📜 {t('preset.title')}</SectionTitle>
        <div className="flex flex-col gap-1.5">
          {PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() =>
                onLoadPreset(
                  {
                    surfaceAngleDeg: preset.epicenterAngleDeg,
                    depthKm: preset.depthKm,
                    magnitudeM: preset.magnitudeM,
                  },
                  preset.observerAngles,
                )
              }
              className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white/60 px-2.5 py-2 text-left transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:border-violet-400/50 dark:hover:bg-white/10"
            >
              <span className="text-2xl leading-none transition-transform group-hover:scale-110">{preset.flag}</span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-bold text-slate-800 dark:text-slate-100">{t(preset.nameKey)}</span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                  {t('preset.meta', { year: preset.year, m: preset.magnitudeM.toFixed(1), d: preset.depthKm })}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Observer points */}
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <SectionTitle>📡 {t('observer.title')} ({state.observers.length})</SectionTitle>
          <button
            onClick={onAddObserver}
            className="rounded-full bg-sky-500/15 px-2.5 py-0.5 text-xs font-bold text-sky-600 transition-colors hover:bg-sky-500/25 dark:text-sky-300"
          >
            ＋ {t('controls.addObserver')}
          </button>
        </div>
        <div className="flex flex-col gap-1.5">
          {state.observers.map(obs => {
            const isSelected = state.selectedObserverId === obs.id;
            const pArrival = obs.arrivals.find(a => a.phase === 'P');
            const sArrival = obs.arrivals.find(a => a.phase === 'S');
            const pkpArrival = obs.arrivals.find(a => a.phase === 'PKP');

            return (
              <div
                key={obs.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectObserver(isSelected ? null : obs.id)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelectObserver(isSelected ? null : obs.id); }}
                className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 transition-all ${
                  isSelected
                    ? 'bg-amber-400/15 ring-2 ring-amber-400'
                    : 'bg-white/60 ring-1 ring-slate-200 hover:ring-slate-300 dark:bg-white/5 dark:ring-white/10 dark:hover:ring-white/20'
                }`}
              >
                <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${
                  isSelected ? 'bg-amber-400 text-slate-900' : 'bg-slate-800 text-white dark:bg-white/15'
                }`}>
                  {obs.label}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-hud font-bold text-slate-700 dark:text-slate-200">{obs.surfaceAngleDeg.toFixed(0)}°</span>
                    {[
                      { a: pArrival, label: 'P', color: WAVE_COLORS.P.stroke },
                      { a: sArrival, label: 'S', color: WAVE_COLORS.S.stroke },
                      { a: pkpArrival, label: 'PKP', color: WAVE_COLORS.PKP.stroke },
                    ].filter(x => x.a).map(({ a, label, color }) => (
                      <span
                        key={label}
                        className="font-hud text-[10px] font-bold transition-colors"
                        style={{ color: a!.hasArrived ? color : undefined }}
                      >
                        <span className={a!.hasArrived ? '' : 'text-slate-400 dark:text-slate-500'}>
                          {label} {a!.hasArrived ? `${a!.travelTimeSec.toFixed(0)}s` : '–'}
                        </span>
                      </span>
                    ))}
                  </div>
                  <ShadowZoneBadge pShadow={obs.inShadowZone.P} sShadow={obs.inShadowZone.S} />
                </div>
                <button
                  onClick={e => { e.stopPropagation(); onRemoveObserver(obs.id); }}
                  className="rounded-full p-1 text-slate-400 transition-colors hover:bg-rose-500/15 hover:text-rose-500"
                  aria-label={t('observer.remove')}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeWidth={2.5} d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            );
          })}
          {state.observers.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-300 px-3 py-3 text-center text-xs text-slate-500 dark:border-white/15 dark:text-slate-400">
              {t('observer.empty')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
