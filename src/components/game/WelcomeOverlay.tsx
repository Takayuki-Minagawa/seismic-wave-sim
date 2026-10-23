import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MISSIONS } from '../../game/missions';

interface WelcomeOverlayProps {
  onClose: () => void;
}

/** Mini Earth cross-section with expanding wave rings, drawn purely with CSS. */
function MiniEarth() {
  const layers = [
    { size: 100, color: 'radial-gradient(circle at 50% 50%, #b45309, #7c2d12)' },
    { size: 88, color: 'radial-gradient(circle at 50% 50%, #9a3412, #6e2418)' },
    { size: 55, color: 'radial-gradient(circle at 50% 50%, #f59e0b, #b77a10)' },
    { size: 19, color: 'radial-gradient(circle at 50% 50%, #fff7cc, #e8c547)' },
  ];
  return (
    <div className="relative mx-auto h-36 w-36 animate-float">
      <div className="absolute -inset-4 rounded-full bg-sky-400/25 blur-2xl" />
      {layers.map(l => (
        <div
          key={l.size}
          className="absolute rounded-full ring-1 ring-white/15"
          style={{ width: `${l.size}%`, height: `${l.size}%`, left: `${(100 - l.size) / 2}%`, top: `${(100 - l.size) / 2}%`, background: l.color }}
        />
      ))}
      {[0, 0.8, 1.6].map(delay => (
        <span key={delay} className="absolute left-1/2 top-[6%] h-6 w-6 -translate-x-1/2 -translate-y-1/2">
          <span
            className="block h-full w-full animate-ping rounded-full border-2 border-sky-300"
            style={{ animationDelay: `${delay}s`, animationDuration: '2.4s' }}
          />
        </span>
      ))}
      <span className="absolute left-1/2 top-[6%] -translate-x-1/2 -translate-y-1/2 text-xl drop-shadow">⭐</span>
    </div>
  );
}

export function WelcomeOverlay({ onClose }: WelcomeOverlayProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const steps = [
    { icon: '🎯', title: t('welcome.step1Title'), body: t('welcome.step1Body'), color: 'from-amber-400 to-orange-500' },
    { icon: '💥', title: t('welcome.step2Title'), body: t('welcome.step2Body'), color: 'from-rose-400 to-pink-600' },
    { icon: '📡', title: t('welcome.step3Title'), body: t('welcome.step3Body'), color: 'from-sky-400 to-violet-500' },
  ];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      onClick={onClose}
    >
      <div
        className="glass scroll-thin relative max-h-full w-full max-w-2xl overflow-y-auto rounded-3xl p-6 animate-pop-in sm:p-8"
        onClick={e => e.stopPropagation()}
      >
        <MiniEarth />

        <div className="mt-6 text-center">
          <span className="inline-block rounded-full bg-violet-500/15 px-3 py-1 text-[11px] font-bold text-violet-600 dark:text-violet-300">
            {t('welcome.badge')}
          </span>
          <h2 id="welcome-title" className="mt-3 text-2xl font-extrabold sm:text-3xl">
            <span className="text-gradient">{t('welcome.title')}</span>
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {t('welcome.lead')}
          </p>
        </div>

        <ol className="mt-6 grid gap-3 sm:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="relative rounded-2xl bg-white/70 p-4 ring-1 ring-slate-900/5 animate-pop-in dark:bg-white/5 dark:ring-white/10"
              style={{ animationDelay: `${0.1 + i * 0.1}s` }}
            >
              <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-xl shadow-md ${step.color}`}>
                {step.icon}
              </div>
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                <span className="mr-1 font-hud text-xs text-slate-400">0{i + 1}</span>
                {step.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{step.body}</p>
            </li>
          ))}
        </ol>

        <p className="mt-5 text-center text-xs font-bold text-amber-600 dark:text-amber-300">
          🏆 {t('welcome.missionTeaser', { count: MISSIONS.length })}
        </p>

        <div className="mt-4 flex justify-center">
          <button
            onClick={onClose}
            autoFocus
            className="btn-quake rounded-2xl px-8 py-3 text-base font-extrabold text-white"
          >
            {t('welcome.start')}
          </button>
        </div>
      </div>
    </div>
  );
}
