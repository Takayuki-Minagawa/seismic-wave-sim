import { useTranslation } from 'react-i18next';
import { SimulationState } from '../../physics/types';
import { TabBar } from './TabBar';
import { MissionPanel } from '../game/MissionPanel';
import { LearningPanel } from '../learning/LearningPanel';
import { QuizFrame } from '../learning/QuizFrame';
import { EarthInfoPanel } from '../info/EarthInfoPanel';
import { useUnlockedMissions } from '../../game/hooks';
import { MISSIONS } from '../../game/missions';

export type SideTab = 'missions' | 'explanation' | 'quiz' | 'structure';

interface SidePanelProps {
  state: SimulationState;
  tab: SideTab;
  onTabChange: (tab: SideTab) => void;
  /** Hide the missions tab (mobile shows missions as its own bottom tab). */
  hideMissions?: boolean;
}

export function SidePanel({ state, tab, onTabChange, hideMissions = false }: SidePanelProps) {
  const { t } = useTranslation();
  const unlocked = useUnlockedMissions();
  const active = hideMissions && tab === 'missions' ? 'explanation' : tab;

  const tabs: { id: SideTab; label: string; icon: string; badge?: string }[] = [
    { id: 'missions', label: t('tabs.missions'), icon: '🏆', badge: `${unlocked.length}/${MISSIONS.length}` },
    { id: 'explanation', label: t('tabs.explanation'), icon: '🐟' },
    { id: 'quiz', label: t('tabs.quiz'), icon: '🧠' },
    { id: 'structure', label: t('tabs.structure'), icon: '🌏' },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-shrink-0 px-3 pt-3">
        <TabBar
          tabs={hideMissions ? tabs.filter(x => x.id !== 'missions') : tabs}
          active={active}
          onChange={onTabChange}
        />
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        {/* Keep the quiz mounted so progress survives switching between these tabs. */}
        <div className={active === 'quiz' ? '' : 'hidden'}><QuizFrame /></div>
        {active === 'missions' && <MissionPanel />}
        {active === 'explanation' && <LearningPanel state={state} />}
        {active === 'structure' && <EarthInfoPanel />}
      </div>
    </div>
  );
}
