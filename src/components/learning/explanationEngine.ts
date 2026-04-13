import { SimulationState } from '../../physics/types';

export interface ExplanationResult {
  key: string;
  vars?: Record<string, string | number>;
}

/**
 * Derive context-sensitive explanation key from simulation state.
 */
export function generateExplanation(state: SimulationState): ExplanationResult {
  const { observers, currentTimeSec } = state;

  if (currentTimeSec < 1 && observers.length === 0) {
    return { key: 'learning.explanation.intro' };
  }

  // Check if any observer is in P shadow zone
  const pShadowObs = observers.find(o => o.inShadowZone.P && o.inShadowZone.S);
  if (pShadowObs) {
    return {
      key: 'learning.explanation.shadowZoneS',
    };
  }

  // Check for S shadow only (not P shadow)
  const sShadowOnlyObs = observers.find(o => o.inShadowZone.S && !o.inShadowZone.P);
  if (sShadowOnlyObs) {
    return {
      key: 'learning.explanation.observerInShadow',
      vars: { distance: sShadowOnlyObs.surfaceAngleDeg.toFixed(0) },
    };
  }

  // Check for PKP arrivals
  const pkpArrived = observers.some(o => o.arrivals.some(a => a.phase === 'PKP' && a.hasArrived));
  if (pkpArrived) {
    return { key: 'learning.explanation.pkpArrival' };
  }

  // Check for wave arrivals at nearby stations
  const arrivedObs = observers.find(o => o.arrivals.some(a => a.hasArrived));
  if (arrivedObs) {
    const hasP = arrivedObs.arrivals.some(a => a.phase === 'P' && a.hasArrived);
    const hasS = arrivedObs.arrivals.some(a => a.phase === 'S' && a.hasArrived);
    if (hasP && hasS) {
      return {
        key: 'learning.explanation.bothWaves',
        vars: { distance: arrivedObs.surfaceAngleDeg.toFixed(0) },
      };
    }
    return { key: 'learning.explanation.pFirst' };
  }

  if (currentTimeSec > 1) {
    return { key: 'learning.explanation.pFirst' };
  }

  return { key: 'learning.explanation.intro' };
}
