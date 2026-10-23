import { useReducer, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { SimulationState, SimulationAction, EpicenterConfig, ObserverPoint, ObserverArrival, TravelTimeDatum } from '../physics/types';
import { computeRayFan } from '../physics/rayTracer';
import { buildTravelTimeCurve, interpolateTravelTime } from '../physics/travelTimeCalc';
import { computeShadowZone, isInPShadowZone, isInSShadowZone, isPKPValid } from '../physics/shadowZone';

const DEFAULT_EPICENTER: EpicenterConfig = {
  surfaceAngleDeg: 90,
  depthKm: 0,
  magnitudeM: 7.0,
};

let observerIdCounter = 0;

function createObserver(epicentralDeg: number, shadowZone: SimulationState['shadowZone']): ObserverPoint {
  observerIdCounter++;
  const label = String.fromCharCode(64 + (observerIdCounter % 26 || 26));
  return {
    id: `obs-${observerIdCounter}`,
    surfaceAngleDeg: Math.max(1, Math.min(179, epicentralDeg)),
    label,
    arrivals: [],
    inShadowZone: {
      P: isInPShadowZone(epicentralDeg, shadowZone),
      S: isInSShadowZone(epicentralDeg, shadowZone),
    },
  };
}

function computeStateFromEpicenter(
  epicenter: EpicenterConfig,
  existingObservers: ObserverPoint[],
): Pick<SimulationState, 'rays' | 'travelTimeCurve' | 'shadowZone' | 'observers'> {
  const { pRays, sRays } = computeRayFan(epicenter.depthKm);
  const allRays = [...pRays, ...sRays];
  const travelTimeCurve = buildTravelTimeCurve(pRays, sRays);
  const shadowZone = computeShadowZone();

  const observers = existingObservers.map(obs => ({
    ...obs,
    inShadowZone: {
      P: isInPShadowZone(obs.surfaceAngleDeg, shadowZone),
      S: isInSShadowZone(obs.surfaceAngleDeg, shadowZone),
    },
    arrivals: computeObserverArrivals(obs.surfaceAngleDeg, travelTimeCurve, 0),
  }));

  return { rays: allRays, travelTimeCurve, shadowZone, observers };
}

/**
 * Compute arrival list for one observer.
 *
 * PKP is only included when the epicentral distance is >= P_SHADOW_END_DEG
 * (i.e. beyond the advertised shadow zone). This keeps arrivals, graph
 * overlays, and learning copy consistent with the same 103°–143° boundary
 * (Issue #4).
 */
function computeObserverArrivals(
  epicentralDeg: number,
  travelTimeCurve: TravelTimeDatum[],
  currentTimeSec: number,
): ObserverArrival[] {
  const arrivals: ObserverArrival[] = [];

  const pTime = interpolateTravelTime(epicentralDeg, 'P', travelTimeCurve);
  if (pTime !== null) {
    arrivals.push({ phase: 'P', travelTimeSec: pTime, hasArrived: currentTimeSec >= pTime });
  }

  const sTime = interpolateTravelTime(epicentralDeg, 'S', travelTimeCurve);
  if (sTime !== null) {
    arrivals.push({ phase: 'S', travelTimeSec: sTime, hasArrived: currentTimeSec >= sTime });
  }

  // Only show PKP outside the P-wave shadow zone (>= 143°).
  if (isPKPValid(epicentralDeg)) {
    const pkpTime = interpolateTravelTime(epicentralDeg, 'PKP', travelTimeCurve);
    if (pkpTime !== null) {
      arrivals.push({ phase: 'PKP', travelTimeSec: pkpTime, hasArrived: currentTimeSec >= pkpTime });
    }
  }

  return arrivals;
}

const initialState: SimulationState = (() => {
  const epicenter = DEFAULT_EPICENTER;
  const { rays, travelTimeCurve, shadowZone, observers } = computeStateFromEpicenter(epicenter, []);
  return {
    epicenter,
    observers,
    rays,
    travelTimeCurve,
    shadowZone,
    currentTimeSec: 0,
    isPlaying: false,
    speedMultiplier: 1,
    selectedObserverId: null,
  };
})();

function simulationReducer(state: SimulationState, action: SimulationAction): SimulationState {
  switch (action.type) {
    case 'SET_EPICENTER': {
      const { rays, travelTimeCurve, shadowZone, observers } = computeStateFromEpicenter(
        action.epicenter,
        state.observers,
      );
      return {
        ...state,
        epicenter: action.epicenter,
        rays,
        travelTimeCurve,
        shadowZone,
        observers,
        currentTimeSec: 0,
        isPlaying: false,
      };
    }

    case 'ADD_OBSERVER': {
      const newObs = createObserver(action.angleDeg, state.shadowZone);
      const withArrivals: ObserverPoint = {
        ...newObs,
        arrivals: computeObserverArrivals(
          action.angleDeg,
          state.travelTimeCurve,
          state.currentTimeSec,
        ),
      };
      return { ...state, observers: [...state.observers, withArrivals] };
    }

    case 'REMOVE_OBSERVER':
      return {
        ...state,
        observers: state.observers.filter(o => o.id !== action.id),
        selectedObserverId: state.selectedObserverId === action.id ? null : state.selectedObserverId,
      };

    case 'SELECT_OBSERVER':
      return { ...state, selectedObserverId: action.id };

    case 'PLAY':
      return { ...state, isPlaying: true };

    case 'PAUSE':
      return { ...state, isPlaying: false };

    case 'RESET':
      return {
        ...state,
        currentTimeSec: 0,
        isPlaying: false,
        observers: state.observers.map(o => ({
          ...o,
          arrivals: o.arrivals.map(a => ({ ...a, hasArrived: false })),
        })),
      };

    case 'TICK': {
      const newTime = state.currentTimeSec + action.dtSec * state.speedMultiplier;
      const updatedObservers = state.observers.map(obs => ({
        ...obs,
        arrivals: obs.arrivals.map(a => ({
          ...a,
          hasArrived: a.hasArrived || newTime >= a.travelTimeSec,
        })),
      }));
      return { ...state, currentTimeSec: newTime, observers: updatedObservers };
    }

    case 'SET_SPEED':
      return { ...state, speedMultiplier: action.multiplier };

    case 'LOAD_PRESET': {
      const { rays, travelTimeCurve, shadowZone } = computeStateFromEpicenter(action.epicenter, []);
      const observers = action.observerAngles.map(angle => {
        const obs = createObserver(angle, shadowZone);
        return {
          ...obs,
          arrivals: computeObserverArrivals(angle, travelTimeCurve, 0),
        };
      });
      return {
        ...state,
        epicenter: action.epicenter,
        rays,
        travelTimeCurve,
        shadowZone,
        observers,
        currentTimeSec: 0,
        isPlaying: false,
      };
    }

    default:
      return state;
  }
}

export function useSimulation() {
  const [state, dispatch] = useReducer(simulationReducer, initialState);
  const stateRef = useRef(state);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Sync ref after each render without triggering re-render (lint: no ref writes during render).
  useLayoutEffect(() => {
    stateRef.current = state;
  });

  // rAF loop — reads isPlaying from stateRef to avoid stale closure.
  useEffect(() => {
    const tick = (timestamp: number) => {
      if (stateRef.current.isPlaying) {
        const dt = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0;
        lastTimeRef.current = timestamp;
        if (dt > 0 && dt < 0.5) {
          dispatch({ type: 'TICK', dtSec: dt });
        }
      } else {
        lastTimeRef.current = 0;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const setEpicenter = useCallback((epicenter: EpicenterConfig) => {
    dispatch({ type: 'SET_EPICENTER', epicenter });
  }, []);

  const addObserver = useCallback((angleDeg: number) => {
    dispatch({ type: 'ADD_OBSERVER', angleDeg });
  }, []);

  const removeObserver = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_OBSERVER', id });
  }, []);

  const selectObserver = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_OBSERVER', id });
  }, []);

  const play = useCallback(() => dispatch({ type: 'PLAY' }), []);
  const pause = useCallback(() => dispatch({ type: 'PAUSE' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);
  const setSpeed = useCallback((m: number) => dispatch({ type: 'SET_SPEED', multiplier: m }), []);
  const loadPreset = useCallback((epicenter: EpicenterConfig, observerAngles: number[]) => {
    dispatch({ type: 'LOAD_PRESET', epicenter, observerAngles });
  }, []);

  return {
    state,
    dispatch,
    setEpicenter,
    addObserver,
    removeObserver,
    selectObserver,
    play,
    pause,
    reset,
    setSpeed,
    loadPreset,
  };
}
