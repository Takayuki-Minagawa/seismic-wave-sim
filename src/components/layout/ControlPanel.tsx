import { useTranslation } from 'react-i18next';
import { SimulationState, EpicenterConfig } from '../../physics/types';
import { Slider } from '../common/Slider';
import { IconButton } from '../common/IconButton';
import { ShadowZoneBadge } from '../common/ShadowZoneBadge';
import { PRESETS } from '../../data/presets';
import { formatTime } from '../../utils/formatters';

interface ControlPanelProps {
  state: SimulationState;
  onEpicenterChange: (config: EpicenterConfig) => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSetSpeed: (m: number) => void;
  onAddObserver: () => void;
  onRemoveObserver: (id: string) => void;
  onSelectObserver: (id: string | null) => void;
  onLoadPreset: (epicenter: EpicenterConfig, observerAngles: number[]) => void;
}

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4];

export function ControlPanel({
  state,
  onEpicenterChange,
  onPlay,
  onPause,
  onReset,
  onSetSpeed,
  onAddObserver,
  onRemoveObserver,
  onSelectObserver,
  onLoadPreset,
}: ControlPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3 p-3 overflow-y-auto h-full">
      {/* Title */}
      <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-1">
        {t('controls.title')}
      </h2>

      {/* Epicenter controls */}
      <div className="flex flex-col gap-2">
        <Slider
          label={t('controls.depth')}
          value={state.epicenter.depthKm}
          min={0}
          max={700}
          step={5}
          unit=" km"
          onChange={v => onEpicenterChange({ ...state.epicenter, depthKm: v })}
        />
        <Slider
          label={t('controls.magnitude')}
          value={state.epicenter.magnitudeM}
          min={1}
          max={9}
          step={0.1}
          onChange={v => onEpicenterChange({ ...state.epicenter, magnitudeM: v })}
          formatValue={v => `M${v.toFixed(1)}`}
        />
      </div>

      {/* Playback controls */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t('controls.time')}: <span className="font-mono text-gray-700 dark:text-gray-300">{formatTime(state.currentTimeSec)}</span>
          </span>
        </div>
        <div className="flex gap-1.5">
          <IconButton
            onClick={state.isPlaying ? onPause : onPlay}
            title={state.isPlaying ? t('controls.pause') : t('controls.play')}
            variant="primary"
            className="flex-1 text-xs"
          >
            {state.isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <rect x="5" y="4" width="3" height="12" rx="1" />
                <rect x="12" y="4" width="3" height="12" rx="1" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.841z" />
              </svg>
            )}
          </IconButton>
          <IconButton onClick={onReset} title={t('controls.reset')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </IconButton>
        </div>

        {/* Speed selector */}
        <div className="flex gap-1">
          {SPEED_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => onSetSpeed(s)}
              className={`flex-1 text-xs py-1 rounded transition-colors ${
                state.speedMultiplier === s
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Presets */}
      <div className="flex flex-col gap-1">
        <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400">{t('preset.title')}</h3>
        <div className="flex flex-col gap-1">
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
              className="text-left text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
            >
              {t(preset.nameKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Observer points */}
      <div className="flex flex-col gap-1 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            {t('observer.title')} ({state.observers.length})
          </h3>
          <button
            onClick={onAddObserver}
            className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            + {t('controls.addObserver')}
          </button>
        </div>
        <div className="flex flex-col gap-1 overflow-y-auto max-h-48">
          {state.observers.map(obs => {
            const isSelected = state.selectedObserverId === obs.id;
            const pArrival = obs.arrivals.find(a => a.phase === 'P');
            const sArrival = obs.arrivals.find(a => a.phase === 'S');

            return (
              <div
                key={obs.id}
                onClick={() => onSelectObserver(isSelected ? null : obs.id)}
                className={`flex flex-col gap-0.5 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-400'
                    : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {t('observer.title')} {obs.label}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {obs.surfaceAngleDeg.toFixed(0)}°
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); onRemoveObserver(obs.id); }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      aria-label={t('observer.remove')}
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="flex gap-2 text-xs">
                  {pArrival && (
                    <span className={pArrival.hasArrived ? 'text-blue-500' : 'text-gray-400'}>
                      P: {pArrival.hasArrived ? `${pArrival.travelTimeSec.toFixed(0)}s` : '–'}
                    </span>
                  )}
                  {sArrival && (
                    <span className={sArrival.hasArrived ? 'text-red-500' : 'text-gray-400'}>
                      S: {sArrival.hasArrived ? `${sArrival.travelTimeSec.toFixed(0)}s` : '–'}
                    </span>
                  )}
                </div>
                <ShadowZoneBadge pShadow={obs.inShadowZone.P} sShadow={obs.inShadowZone.S} />
              </div>
            );
          })}
          {state.observers.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">
              ダブルクリックで観測点を追加
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
