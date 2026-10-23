import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { simulationEndTime, useSimulation } from './hooks/useSimulation';
import { useTheme } from './hooks/useTheme';
import { useTravelTimeData } from './hooks/useTravelTimeData';
import { AppLayout, MobileTab } from './components/layout/AppLayout';
import { TopBar } from './components/layout/TopBar';
import { ControlPanel } from './components/layout/ControlPanel';
import { SidePanel, SideTab } from './components/layout/SidePanel';
import { AnalysisPanel } from './components/layout/AnalysisPanel';
import { EarthStage } from './components/earth/EarthStage';
import { TravelTimeGraph } from './components/graph/TravelTimeGraph';
import { Seismogram } from './components/seismo/Seismogram';
import { MissionPanel } from './components/game/MissionPanel';
import { ToastStack } from './components/game/ToastStack';
import { Confetti } from './components/game/Confetti';
import { WelcomeOverlay } from './components/game/WelcomeOverlay';
import { QuakePhase } from './components/common/QuakeButton';
import { EpicenterConfig } from './physics/types';
import { MISSIONS, missionStore } from './game/missions';
import { useUnlockedMissions } from './game/hooks';
import { sound } from './game/sound';
import { toastStore } from './game/toastStore';
import { readStorage, writeStorage } from './game/storage';
import { formatTime } from './utils/formatters';

const WELCOME_KEY = 'seismic.welcomed';

function App() {
  const { t } = useTranslation();
  const { isDark, toggle: toggleTheme } = useTheme();
  const {
    state,
    setEpicenter,
    addObserver,
    removeObserver,
    selectObserver,
    play,
    pause,
    reset,
    setSpeed,
    loadPreset,
  } = useSimulation();

  const travelTimeData = useTravelTimeData(state);
  const unlocked = useUnlockedMissions();

  const [selectedGraphDist, setSelectedGraphDist] = useState<number | null>(null);
  const [sideTab, setSideTab] = useState<SideTab>('missions');
  const [mobileTab, setMobileTab] = useState<MobileTab>('earth');
  const [showWelcome, setShowWelcome] = useState(() => readStorage(WELCOME_KEY) !== '1');

  const endTimeSec = useMemo(() => simulationEndTime(state.travelTimeCurve), [state.travelTimeCurve]);
  const phase: QuakePhase = state.isPlaying
    ? 'playing'
    : state.currentTimeSec <= 0
    ? 'idle'
    : state.currentTimeSec >= endTimeSec
    ? 'finished'
    : 'paused';

  const handleQuake = useCallback(() => {
    if (phase === 'playing') {
      pause();
      return;
    }
    if (phase === 'idle' || phase === 'finished') {
      reset();
      sound.rumble(state.epicenter.magnitudeM);
    }
    play();
  }, [phase, pause, play, reset, state.epicenter.magnitudeM]);

  const handleAddObserverDefault = useCallback(() => {
    // Spread new stations out so each one teaches something different.
    const used = new Set(state.observers.map(o => Math.round(o.surfaceAngleDeg)));
    const candidates = [40, 80, 120, 155, 20, 60, 100, 140, 170];
    addObserver(candidates.find(a => !used.has(a)) ?? 90, state.observers.length % 2 === 0 ? 1 : -1);
  }, [addObserver, state.observers]);

  const handleLoadPreset = useCallback((epicenter: EpicenterConfig, angles: number[]) => {
    loadPreset(epicenter, angles);
    missionStore.unlock('preset');
  }, [loadPreset]);

  const openMissions = useCallback(() => {
    setSideTab('missions');
    setMobileTab('missions');
  }, []);

  const closeWelcome = useCallback(() => {
    setShowWelcome(false);
    writeStorage(WELCOME_KEY, '1');
  }, []);

  // Evaluate state-based missions whenever the simulation changes.
  useEffect(() => {
    missionStore.checkState(state);
  }, [state]);

  // Toast + sound for every new wave arrival at a station.
  const arrivedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const current = new Set<string>();
    for (const obs of state.observers) {
      for (const a of obs.arrivals) {
        if (!a.hasArrived) continue;
        const key = `${obs.id}:${a.phase}`;
        current.add(key);
        // Only announce waves that just arrived (not ones already past a newly added station).
        const justArrived = state.currentTimeSec - a.travelTimeSec <= 1.5 * state.speedMultiplier;
        if (state.isPlaying && justArrived && !arrivedRef.current.has(key)) {
          sound.arrival(a.phase);
          toastStore.push({
            kind: a.phase === 'S' ? 'S' : a.phase === 'PKP' ? 'PKP' : 'P',
            icon: a.phase === 'S' ? '🔴' : a.phase === 'PKP' ? '🟣' : '🔵',
            title: t('toast.arrival', { label: obs.label, phase: t(`wave.${a.phase}`) }),
            body: t('toast.arrivalBody', { dist: obs.surfaceAngleDeg.toFixed(0), time: formatTime(a.travelTimeSec) }),
          });
        }
      }
    }
    arrivedRef.current = current;
  }, [state.observers, state.isPlaying, state.currentTimeSec, state.speedMultiplier, t]);

  const selectedObsDist = useMemo(() => {
    if (!state.selectedObserverId) return selectedGraphDist;
    const obs = state.observers.find(o => o.id === state.selectedObserverId);
    return obs ? obs.surfaceAngleDeg : selectedGraphDist;
  }, [state.selectedObserverId, state.observers, selectedGraphDist]);

  return (
    <>
      <AppLayout
        topBar={
          <TopBar
            isDark={isDark}
            onThemeToggle={toggleTheme}
            onHelp={() => setShowWelcome(true)}
            onOpenMissions={openMissions}
          />
        }
        controlPanel={
          <ControlPanel
            state={state}
            phase={phase}
            onQuake={handleQuake}
            onEpicenterChange={setEpicenter}
            onReset={reset}
            onSetSpeed={setSpeed}
            onAddObserver={handleAddObserverDefault}
            onRemoveObserver={removeObserver}
            onSelectObserver={selectObserver}
            onLoadPreset={handleLoadPreset}
          />
        }
        earthStage={
          <EarthStage
            state={state}
            isDark={isDark}
            phase={phase}
            endTimeSec={endTimeSec}
            onQuake={handleQuake}
            onEpicenterChange={setEpicenter}
            onAddObserver={addObserver}
            onSelectObserver={selectObserver}
          />
        }
        analysisPanel={
          <AnalysisPanel
            seismogram={
              <Seismogram state={state} endTimeSec={endTimeSec} isDark={isDark} onSelectObserver={selectObserver} />
            }
            travelTimeGraph={
              <TravelTimeGraph
                data={travelTimeData}
                observers={state.observers}
                currentTimeSec={state.currentTimeSec}
                isDark={isDark}
                selectedDistance={selectedObsDist}
                onSelectDistance={setSelectedGraphDist}
              />
            }
          />
        }
        sidePanel={<SidePanel state={state} tab={sideTab} onTabChange={setSideTab} />}
        mobileLearnPanel={<SidePanel state={state} tab={sideTab} onTabChange={setSideTab} hideMissions />}
        missionPanel={<MissionPanel />}
        mobileTab={mobileTab}
        onMobileTabChange={setMobileTab}
        missionBadge={`${unlocked.length}/${MISSIONS.length}`}
      />
      <ToastStack />
      <Confetti />
      {showWelcome && <WelcomeOverlay onClose={closeWelcome} />}
    </>
  );
}

export default App;
