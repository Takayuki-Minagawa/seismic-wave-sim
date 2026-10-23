import { useTranslation } from 'react-i18next';
import { SimulationState } from '../../physics/types';
import { generateExplanation } from './explanationEngine';

interface LearningPanelProps {
  state: SimulationState;
}

/** Context-aware explanation from the guide character plus wave basics. */
export function LearningPanel({ state }: LearningPanelProps) {
  const { t } = useTranslation();
  const explanation = generateExplanation(state);
  const { pShadowStart, pShadowEnd, sShadowStart } = state.shadowZone;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Guide speech bubble */}
      <div className="flex items-start gap-3">
        <div className="flex flex-shrink-0 flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-300 to-indigo-500 text-2xl shadow-lg shadow-indigo-500/30 animate-float">
            🐟
          </div>
          <span className="mt-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">{t('learning.guide')}</span>
        </div>
        <div
          key={explanation.key}
          className="relative flex-1 rounded-2xl rounded-tl-sm bg-white/80 p-3 shadow-sm ring-1 ring-slate-900/5 animate-pop-in dark:bg-white/10 dark:ring-white/10"
        >
          <p className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-100">
            {t(explanation.key, explanation.vars ?? {})}
          </p>
        </div>
      </div>

      {/* Wave basics */}
      <div className="flex flex-col gap-2">
        <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          🌊 {t('learning.basics')}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-sky-500/10 p-3 ring-1 ring-sky-500/20">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-pwave shadow-[0_0_8px_#38bdf8]" />
              <span className="text-sm font-extrabold text-sky-700 dark:text-sky-300">{t('learning.pTitle')}</span>
            </div>
            {/* Compression wave pictogram */}
            <svg viewBox="0 0 100 16" className="my-2 h-4 w-full text-sky-500">
              {[4, 8, 11, 13, 15, 22, 31, 40, 44, 47, 49, 51, 58, 67, 76, 80, 83, 85, 87, 94].map(x => (
                <line key={x} x1={x} x2={x} y1={2} y2={14} stroke="currentColor" strokeWidth={1.4} />
              ))}
            </svg>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">{t('learning.pType')}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">🧱💧💨 {t('learning.pMedium')}</p>
            <p className="mt-1 text-[11px] font-bold text-sky-700 dark:text-sky-300">⚡ {t('learning.pSpeed')}</p>
          </div>
          <div className="rounded-2xl bg-rose-500/10 p-3 ring-1 ring-rose-500/20">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-swave shadow-[0_0_8px_#fb7185]" />
              <span className="text-sm font-extrabold text-rose-700 dark:text-rose-300">{t('learning.sTitle')}</span>
            </div>
            {/* Shear wave pictogram */}
            <svg viewBox="0 0 100 16" className="my-2 h-4 w-full text-rose-500">
              <path d="M0 8 Q 6 0 12.5 8 T 25 8 T 37.5 8 T 50 8 T 62.5 8 T 75 8 T 87.5 8 T 100 8" fill="none" stroke="currentColor" strokeWidth={1.8} />
            </svg>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">{t('learning.sType')}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">🧱 {t('learning.sMedium')}</p>
            <p className="mt-1 text-[11px] font-bold text-rose-700 dark:text-rose-300">🐢 {t('learning.sSpeed')}</p>
          </div>
        </div>
      </div>

      {/* Shadow zones */}
      <div className="rounded-2xl bg-orange-500/10 p-3 ring-1 ring-orange-500/20">
        <p className="mb-1 text-xs font-extrabold text-orange-700 dark:text-orange-300">🌑 {t('learning.shadowTitle')}</p>
        <p className="text-xs text-slate-700 dark:text-slate-200">{t('learning.shadowP', { from: pShadowStart, to: pShadowEnd })}</p>
        <p className="text-xs text-slate-700 dark:text-slate-200">{t('learning.shadowS', { from: sShadowStart })}</p>
      </div>

      {/* Trivia */}
      <div className="rounded-2xl border border-dashed border-violet-400/40 p-3">
        <p className="mb-1 text-xs font-extrabold text-violet-600 dark:text-violet-300">💡 {t('learning.trivia')}</p>
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{t('learning.triviaBody')}</p>
      </div>
    </div>
  );
}
