import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EARTH_LAYERS } from '../../data/earthModel';
import { EARTH_RADIUS_KM } from '../../physics/constants';
import { EarthLayer } from '../../physics/types';
import { exploredLayersStore } from '../../game/missions';
import { useExploredLayers } from '../../game/hooks';

const MAX_VELOCITY = Math.max(...EARTH_LAYERS.map(l => l.pVelocity));

function VelocityBar({ label, value, color, blockedLabel }: { label: string; value: number; color: string; blockedLabel: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="w-3 font-extrabold" style={{ color }}>{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-900/10 dark:bg-white/10">
        {value > 0 && (
          <div className="h-full rounded-full" style={{ width: `${(value / MAX_VELOCITY) * 100}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
        )}
      </div>
      <span className="w-16 text-right font-hud text-[10px] font-bold text-slate-600 dark:text-slate-300">
        {value > 0 ? `${value} km/s` : <span className="text-rose-500">{blockedLabel}</span>}
      </span>
    </div>
  );
}

export function EarthInfoPanel() {
  const { t } = useTranslation();
  const [openLayer, setOpenLayer] = useState<EarthLayer['name'] | null>(null);
  const explored = useExploredLayers();

  const toggle = (name: EarthLayer['name']) => {
    setOpenLayer(prev => (prev === name ? null : name));
    exploredLayersStore.mark(name, EARTH_LAYERS.length);
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">👆 {t('layers.tapHint')}</p>
        <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-300">
          🔍 {t('layers.explored', { n: explored.size })}
        </span>
      </div>

      <div className="flex gap-3">
        {/* Depth column: proportional thickness of each layer */}
        <div className="flex w-5 flex-shrink-0 flex-col overflow-hidden rounded-full ring-1 ring-slate-900/10 dark:ring-white/10">
          {EARTH_LAYERS.map(layer => (
            <button
              key={layer.name}
              onClick={() => toggle(layer.name)}
              title={t(`layers.${layer.name}`)}
              style={{
                flexGrow: Math.max(layer.outerRadius - layer.innerRadius, 120),
                backgroundColor: layer.color,
                opacity: openLayer && openLayer !== layer.name ? 0.4 : 1,
              }}
              className="transition-opacity"
            />
          ))}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          {EARTH_LAYERS.map(layer => {
            const thickness = layer.outerRadius - layer.innerRadius;
            const isOpen = openLayer === layer.name;
            const isLiquid = layer.sVelocity === 0;
            const fromDepth = EARTH_RADIUS_KM - layer.outerRadius;
            const toDepth = EARTH_RADIUS_KM - layer.innerRadius;

            return (
              <button
                key={layer.name}
                onClick={() => toggle(layer.name)}
                className={`rounded-2xl p-3 text-left ring-1 transition-all ${
                  isOpen ? 'ring-2 ring-violet-400 shadow-lg' : 'ring-slate-900/5 hover:-translate-y-0.5 hover:shadow-md dark:ring-white/10'
                }`}
                style={{ background: `linear-gradient(135deg, ${layer.color}33, ${layer.color}10)` }}
              >
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 flex-shrink-0 rounded-full ring-2 ring-white/50" style={{ backgroundColor: layer.color }} />
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{t(`layers.${layer.name}`)}</span>
                  {explored.has(layer.name) && <span className="text-[10px]">✅</span>}
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isLiquid ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300' : 'bg-slate-900/10 text-slate-600 dark:bg-white/10 dark:text-slate-300'
                  }`}>
                    {isLiquid ? `💧 ${t('layers.liquid')}` : `🪨 ${t('layers.solid')}`}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {t('layers.depthRange', { from: fromDepth.toLocaleString(), to: toDepth.toLocaleString() })}
                  {' · '}
                  {t('layers.thickness')} {thickness.toLocaleString()} km
                  {' · '}
                  {t('layers.density')} {layer.density} {t('layers.densityUnit')}
                </p>
                <div className="mt-2 flex flex-col gap-1">
                  <VelocityBar label="P" value={layer.pVelocity} color="#38bdf8" blockedLabel={t('layers.sBlocked')} />
                  <VelocityBar label="S" value={layer.sVelocity} color="#fb7185" blockedLabel={t('layers.sBlocked')} />
                </div>
                {isOpen && (
                  <p className="mt-2 border-t border-slate-900/10 pt-2 text-xs leading-relaxed text-slate-700 animate-fade-in dark:border-white/10 dark:text-slate-200">
                    {t(`layers.description.${layer.name}`)}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-400">{t('layers.radius', { r: EARTH_RADIUS_KM.toLocaleString() })}</p>
    </div>
  );
}
