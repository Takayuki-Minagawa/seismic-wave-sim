import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '../../hooks/useMediaQuery';

export type MobileTab = 'earth' | 'graph' | 'missions' | 'learn' | 'settings';

interface AppLayoutProps {
  topBar: ReactNode;
  controlPanel: ReactNode;
  earthStage: ReactNode;
  analysisPanel: ReactNode;
  sidePanel: ReactNode;
  /** Side panel without the missions tab, for the mobile "learn" tab. */
  mobileLearnPanel: ReactNode;
  missionPanel: ReactNode;
  mobileTab: MobileTab;
  onMobileTabChange: (tab: MobileTab) => void;
  missionBadge?: string;
}

export function AppLayout({
  topBar,
  controlPanel,
  earthStage,
  analysisPanel,
  sidePanel,
  mobileLearnPanel,
  missionPanel,
  mobileTab,
  onMobileTabChange,
  missionBadge,
}: AppLayoutProps) {
  const { t } = useTranslation();
  // Mount only the visible layout so canvases and animation loops aren't duplicated.
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const mobileTabs: { id: MobileTab; icon: string; label: string }[] = [
    { id: 'earth', icon: '🌍', label: t('tabs.earth') },
    { id: 'graph', icon: '📈', label: t('tabs.graph') },
    { id: 'settings', icon: '🎛️', label: t('tabs.settings') },
    { id: 'missions', icon: '🏆', label: t('tabs.missions') },
    { id: 'learn', icon: '📚', label: t('tabs.learn') },
  ];

  return (
    <div className="app-bg flex h-dvh w-screen flex-col overflow-hidden text-slate-900 dark:text-slate-100">
      {topBar}

      {/* Desktop layout: 3 columns */}
      {isDesktop ? (
        <div className="flex min-h-0 flex-1 gap-3 px-3 pb-3">
          <aside className="glass flex w-72 flex-shrink-0 flex-col overflow-hidden rounded-3xl">
            {controlPanel}
          </aside>

          <main className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="min-h-0 flex-1 overflow-hidden rounded-3xl bg-space-950 shadow-2xl shadow-black/30 ring-1 ring-white/10">
              {earthStage}
            </div>
            <div className="glass h-60 flex-shrink-0 overflow-hidden rounded-3xl xl:h-64">
              {analysisPanel}
            </div>
          </main>

          <aside className="glass flex w-80 flex-shrink-0 flex-col overflow-hidden rounded-3xl xl:w-[22rem]">
            {sidePanel}
          </aside>
        </div>
      ) : (
        /* Mobile / tablet layout: one view at a time with a bottom tab bar */
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-hidden px-2">
            {mobileTab === 'earth' && (
              <div className="h-full overflow-hidden rounded-3xl bg-space-950 ring-1 ring-white/10">{earthStage}</div>
            )}
            {mobileTab === 'graph' && <div className="glass h-full overflow-hidden rounded-3xl">{analysisPanel}</div>}
            {mobileTab === 'settings' && <div className="glass h-full overflow-hidden rounded-3xl">{controlPanel}</div>}
            {mobileTab === 'missions' && (
              <div className="glass scroll-thin h-full overflow-y-auto rounded-3xl">{missionPanel}</div>
            )}
            {mobileTab === 'learn' && <div className="glass h-full overflow-hidden rounded-3xl">{mobileLearnPanel}</div>}
          </div>

          <nav className="flex flex-shrink-0 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
            <div className="glass flex w-full rounded-2xl p-1">
              {mobileTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => onMobileTabChange(tab.id)}
                  className={`relative flex flex-1 flex-col items-center rounded-xl py-1.5 text-[10px] font-bold transition-all ${
                    mobileTab === tab.id
                      ? 'bg-gradient-to-br from-sky-500 to-violet-500 text-white shadow-md'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <span className="text-lg leading-tight">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.id === 'missions' && missionBadge && mobileTab !== 'missions' && (
                    <span className="absolute right-1 top-0.5 rounded-full bg-amber-400 px-1 font-hud text-[8px] text-slate-900">
                      {missionBadge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
