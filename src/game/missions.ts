/**
 * Mission (achievement) definitions and a persisted external store.
 *
 * State-based missions are evaluated by `missionStore.checkState()` whenever
 * the simulation changes; event-based missions (presets, quiz, layer
 * exploration) are unlocked explicitly with `missionStore.unlock()`.
 */

import i18n from '../i18n';
import { SimulationState } from '../physics/types';
import { readStorage, writeStorage } from './storage';
import { sound } from './sound';
import { celebrate, toastStore } from './toastStore';

export type MissionId =
  | 'firstQuake'
  | 'placeObserver'
  | 'catchP'
  | 'catchS'
  | 'sShadow'
  | 'pkp'
  | 'deepQuake'
  | 'greatQuake'
  | 'network'
  | 'preset'
  | 'layers'
  | 'quizClear'
  | 'quizPerfect';

export interface Mission {
  id: MissionId;
  icon: string;
  xp: number;
  check?: (s: SimulationState) => boolean;
}

const arrived = (s: SimulationState, phase: string) =>
  s.observers.some(o => o.arrivals.some(a => a.phase === phase && a.hasArrived));

export const MISSIONS: Mission[] = [
  { id: 'firstQuake', icon: '💥', xp: 10, check: s => s.currentTimeSec > 0 },
  { id: 'placeObserver', icon: '📍', xp: 10, check: s => s.observers.length >= 1 },
  { id: 'catchP', icon: '🔵', xp: 15, check: s => arrived(s, 'P') },
  {
    id: 'catchS',
    icon: '🔴',
    xp: 15,
    check: s =>
      s.observers.some(
        o =>
          o.arrivals.some(a => a.phase === 'P' && a.hasArrived) &&
          o.arrivals.some(a => a.phase === 'S' && a.hasArrived),
      ),
  },
  {
    id: 'sShadow',
    icon: '🌑',
    xp: 20,
    // An S-shadow station only "proves" the shadow once every S-wave has surfaced.
    check: s =>
      s.observers.some(o => o.inShadowZone.S) &&
      s.currentTimeSec >= Math.max(0, ...s.travelTimeCurve.filter(d => d.phase === 'S').map(d => d.timeSec)),
  },
  { id: 'pkp', icon: '🟣', xp: 25, check: s => arrived(s, 'PKP') },
  { id: 'deepQuake', icon: '⛏️', xp: 15, check: s => s.epicenter.depthKm >= 300 && s.currentTimeSec > 60 },
  { id: 'greatQuake', icon: '🌋', xp: 10, check: s => s.epicenter.magnitudeM >= 9 && s.currentTimeSec > 30 },
  { id: 'network', icon: '🛰️', xp: 15, check: s => s.observers.length >= 5 },
  { id: 'preset', icon: '📜', xp: 10 },
  { id: 'layers', icon: '🔍', xp: 15 },
  { id: 'quizClear', icon: '📝', xp: 20 },
  { id: 'quizPerfect', icon: '🏆', xp: 30 },
];

export const TOTAL_XP = MISSIONS.reduce((sum, m) => sum + m.xp, 0);

export interface Rank {
  key: string;
  icon: string;
  minXp: number;
}

export const RANKS: Rank[] = [
  { key: 'rank.0', icon: '🥚', minXp: 0 },
  { key: 'rank.1', icon: '🔭', minXp: 30 },
  { key: 'rank.2', icon: '📡', minXp: 80 },
  { key: 'rank.3', icon: '🧑‍🔬', minXp: 140 },
  { key: 'rank.4', icon: '🌏', minXp: 200 },
];

export function rankFor(xp: number): { rank: Rank; next: Rank | null; progress: number } {
  let idx = 0;
  for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i].minXp) idx = i;
  const rank = RANKS[idx];
  const next = RANKS[idx + 1] ?? null;
  const progress = next ? (xp - rank.minXp) / (next.minXp - rank.minXp) : 1;
  return { rank, next, progress };
}

// ── Store ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'seismic.missions.v1';

function load(): MissionId[] {
  try {
    const raw = readStorage(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is MissionId => MISSIONS.some(m => m.id === id));
  } catch {
    return [];
  }
}

let unlocked: MissionId[] = load();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach(fn => fn());
}

export const missionStore = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
  getSnapshot: () => unlocked,

  unlock(id: MissionId) {
    if (unlocked.includes(id)) return;
    const mission = MISSIONS.find(m => m.id === id);
    if (!mission) return;

    const prevRank = rankFor(xpOf(unlocked)).rank;
    unlocked = [...unlocked, id];
    writeStorage(STORAGE_KEY, JSON.stringify(unlocked));
    emit();

    toastStore.push({
      kind: 'mission',
      icon: mission.icon,
      title: i18n.t('missions.unlocked', { xp: mission.xp }),
      body: i18n.t(`missions.list.${id}.title`),
    });
    sound.fanfare();

    const newRank = rankFor(xpOf(unlocked)).rank;
    if (newRank !== prevRank) {
      toastStore.push({
        kind: 'mission',
        icon: newRank.icon,
        title: i18n.t('missions.rankUp'),
        body: i18n.t(newRank.key),
      });
      celebrate();
    } else if (mission.xp >= 20) {
      celebrate();
    }
  },

  checkState(state: SimulationState) {
    for (const m of MISSIONS) {
      if (m.check && !unlocked.includes(m.id) && m.check(state)) {
        missionStore.unlock(m.id);
      }
    }
  },

  reset() {
    unlocked = [];
    writeStorage(STORAGE_KEY, '[]');
    emit();
  },
};

export function xpOf(ids: readonly MissionId[]): number {
  return MISSIONS.filter(m => ids.includes(m.id)).reduce((sum, m) => sum + m.xp, 0);
}
