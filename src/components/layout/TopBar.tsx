import { useTranslation } from 'react-i18next';
import { useMuted, useUnlockedMissions } from '../../game/hooks';
import { rankFor, xpOf } from '../../game/missions';
import { sound } from '../../game/sound';

interface TopBarProps {
  isDark: boolean;
  onThemeToggle: () => void;
  onHelp: () => void;
  onOpenMissions: () => void;
}

function RoundButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-9 min-w-9 items-center justify-center rounded-full bg-white/70 px-2 text-sm font-bold text-slate-700 ring-1 ring-slate-900/5 transition-all hover:scale-105 hover:bg-white dark:bg-white/10 dark:text-slate-100 dark:ring-white/10 dark:hover:bg-white/20"
    >
      {children}
    </button>
  );
}

export function TopBar({ isDark, onThemeToggle, onHelp, onOpenMissions }: TopBarProps) {
  const { t, i18n } = useTranslation();
  const isJa = !i18n.language?.startsWith('en');
  const muted = useMuted();
  const unlocked = useUnlockedMissions();
  const xp = xpOf(unlocked);
  const { rank, progress } = rankFor(xp);

  return (
    <header className="flex flex-shrink-0 items-center justify-between gap-3 px-3 py-2 sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-violet-500 to-rose-500 shadow-lg shadow-violet-500/30">
          <svg viewBox="0 0 32 32" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 16h5l3-8 4 16 4-12 3 8 2-4h7" />
          </svg>
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-extrabold leading-tight sm:text-base">
            <span className="text-gradient sm:hidden">{t('appShortTitle')}</span>
            <span className="text-gradient hidden sm:inline">{t('appTitle')}</span>
          </h1>
          <p className="hidden truncate text-[11px] text-slate-500 dark:text-slate-400 sm:block">{t('appSubtitle')}</p>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
        {/* Rank chip */}
        <button
          onClick={onOpenMissions}
          className="hidden items-center gap-2 rounded-full bg-white/70 py-1 pl-1 pr-3 ring-1 ring-slate-900/5 transition-all hover:scale-[1.03] dark:bg-white/10 dark:ring-white/10 sm:flex"
          title={t('missions.title')}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-base shadow">
            {rank.icon}
          </span>
          <span className="flex flex-col items-start">
            <span className="text-[11px] font-extrabold leading-tight text-slate-800 dark:text-slate-100">{t(rank.key)}</span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-300/60 dark:bg-white/15">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-500 transition-[width] duration-700"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </span>
              <span className="font-hud text-[9px] font-bold text-amber-600 dark:text-amber-300">{xp} XP</span>
            </span>
          </span>
        </button>

        <RoundButton onClick={onHelp} label={t('top.help')}>?</RoundButton>
        <RoundButton onClick={sound.toggleMuted} label={muted ? t('top.soundOff') : t('top.soundOn')}>
          {muted ? '🔇' : '🔊'}
        </RoundButton>
        <RoundButton onClick={() => i18n.changeLanguage(isJa ? 'en' : 'ja')} label={t('top.language')}>
          <span className="text-xs">{isJa ? 'EN' : 'JA'}</span>
        </RoundButton>
        <RoundButton onClick={onThemeToggle} label={t('theme.toggle')}>
          {isDark ? '🌙' : '☀️'}
        </RoundButton>
      </div>
    </header>
  );
}
