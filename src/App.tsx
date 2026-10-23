import { useCallback, useMemo, useState } from 'react';
import { useSimulation } from './hooks/useSimulation';
import { useTheme } from './hooks/useTheme';
import { useTravelTimeData } from './hooks/useTravelTimeData';
import { AppLayout } from './components/layout/AppLayout';
import { TopBar } from './components/layout/TopBar';
import { ControlPanel } from './components/layout/ControlPanel';
import { EarthCanvas } from './components/earth/EarthCanvas';
import { LayerLegend } from './components/earth/LayerLegend';
import { TravelTimeGraph } from './components/graph/TravelTimeGraph';
import { EarthInfoPanel } from './components/info/EarthInfoPanel';
import { LearningPanel } from './components/learning/LearningPanel';

function App() {
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

  const [selectedGraphDist, setSelectedGraphDist] = useState<number | null>(null);

  const handleAddObserverDefault = useCallback(() => {
    addObserver(90);
  }, [addObserver]);

  const selectedObsDist = useMemo(() => {
    if (!state.selectedObserverId) return selectedGraphDist;
    const obs = state.observers.find(o => o.id === state.selectedObserverId);
    return obs ? obs.surfaceAngleDeg : selectedGraphDist;
  }, [state.selectedObserverId, state.observers, selectedGraphDist]);

  return (
    <div className={isDark ? 'dark' : ''}>
      <AppLayout
        topBar={
          <TopBar isDark={isDark} onThemeToggle={toggleTheme} />
        }
        controlPanel={
          <ControlPanel
            state={state}
            onEpicenterChange={setEpicenter}
            onPlay={play}
            onPause={pause}
            onReset={reset}
            onSetSpeed={setSpeed}
            onAddObserver={handleAddObserverDefault}
            onRemoveObserver={removeObserver}
            onSelectObserver={selectObserver}
            onLoadPreset={loadPreset}
          />
        }
        earthCanvas={
          <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0">
              <EarthCanvas
                state={state}
                isDark={isDark}
                onEpicenterChange={setEpicenter}
                onAddObserver={addObserver}
                onSelectObserver={selectObserver}
              />
            </div>
            <div className="flex-shrink-0 bg-gray-900 dark:bg-gray-950 pb-1">
              <LayerLegend isDark={isDark} />
            </div>
          </div>
        }
        travelTimeGraph={
          <TravelTimeGraph
            data={travelTimeData}
            isDark={isDark}
            selectedDistance={selectedObsDist}
            onSelectDistance={setSelectedGraphDist}
          />
        }
        earthInfoPanel={<EarthInfoPanel />}
        learningPanel={<LearningPanel state={state} />}
      />
    </div>
  );
}

export default App;
