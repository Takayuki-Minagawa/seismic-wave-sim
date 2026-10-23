import { useTranslation } from 'react-i18next';
import { useUnlockedMissions } from '../../game/hooks';
import { MISSIONS, RANKS, missionStore, rankFor, xpOf } from '../../game/missions';

export function MissionPanel() {
  const { t } = useTranslation();
  const unlocked = useUnlockedMissions();
  const xp = xpOf(unlocked);
  const { rank, next, progress } = rankFor(xp);

  const handleReset = () => {
    if (window.confirm(t('missions.resetConfirm'))) missionStore.reset();
  };

  // Show open missions first so the next goal is always on top.
  const ordered = [...MISSIONS].sort(
    (a, b) => Number(unlocked.includes(a.id)) - Number(unlocked.includes(b.id)),
  );

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Rank card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-500 p-4 text-white shadow-lg shadow-indigo-500/25">
        <div className="pointer-events-none absolute -right-6 -top-6 text-8xl opacity-20 animate-spin-slow">🌏</div>
        <div className="flex items-center gap-3">
          <div key={rank.key} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-3xl animate-bounce-in">
            {rank.icon}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold opacity-80">{t('missions.title')}</p>
            <p className="text-lg font-extrabold leading-tight">{t(rank.key)}</p>
            <p className="font-hud text-xs font-bold text-amber-200">{xp} XP</p>
          </div>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-200 to-amber-400 transition-[width] duration-700"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] font-medium opacity-90">
          <span>{t('missions.progress', { done: unlocked.length, total: MISSIONS.length })}</span>
          <span>{next ? t('missions.nextRank', { xp: next.minXp - xp }) : t('missions.maxRank')}</span>
        </div>
        {/* Rank ladder */}
        <div className="mt-3 flex justify-between">
          {RANKS.map(r => (
            <span
              key={r.key}
              title={t(r.key)}
              className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                xp >= r.minXp ? 'bg-white/30' : 'bg-black/20 opacity-50 grayscale'
              }`}
            >
              {r.icon}
            </span>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">{t('missions.subtitle')}</p>

      {/* Mission list */}
      <ul className="flex flex-col gap-2">
        {ordered.map(m => {
          const done = unlocked.includes(m.id);
          return (
            <li
              key={m.id}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                done
                  ? 'bg-emerald-500/10 ring-1 ring-emerald-500/30'
                  : 'bg-white/60 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10'
              }`}
            >
              <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-lg ${
                done ? 'bg-emerald-500/20' : 'bg-slate-200/70 grayscale dark:bg-white/10'
              }`}>
                {m.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-extrabold ${done ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-100'}`}>
                  {t(`missions.list.${m.id}.title`)}
                </p>
                <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400">{t(`missions.list.${m.id}.desc`)}</p>
              </div>
              {done ? (
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs text-white">✓</span>
              ) : (
                <span className="flex-shrink-0 rounded-full bg-amber-400/20 px-2 py-0.5 font-hud text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  +{m.xp}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {unlocked.length > 0 && (
        <button onClick={handleReset} className="self-center text-[11px] text-slate-400 underline-offset-2 hover:text-rose-500 hover:underline">
          {t('missions.reset')}
        </button>
      )}
    </div>
  );
}
