import { useMemo } from 'react';
import { SimulationState, TravelTimeDatum } from '../physics/types';
import { isPKPValid } from '../physics/shadowZone';

export interface TravelTimePoint extends TravelTimeDatum {
  isArrived: boolean;
}

export function useTravelTimeData(state: SimulationState): TravelTimePoint[] {
  return useMemo(() => {
    return state.travelTimeCurve
      .filter(datum => datum.phase !== 'PKP' || isPKPValid(datum.distanceDeg))
      .map(datum => ({
        ...datum,
        isArrived: state.currentTimeSec >= datum.timeSec,
      }));
  }, [state.travelTimeCurve, state.currentTimeSec]);
}
