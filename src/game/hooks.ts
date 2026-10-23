import { useSyncExternalStore } from 'react';
import { exploredLayersStore, missionStore } from './missions';
import { toastStore } from './toastStore';
import { sound } from './sound';

export function useUnlockedMissions() {
  return useSyncExternalStore(missionStore.subscribe, missionStore.getSnapshot);
}

export function useToasts() {
  return useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot);
}

export function useMuted() {
  return useSyncExternalStore(sound.subscribe, sound.isMuted);
}

export function useExploredLayers() {
  return useSyncExternalStore(exploredLayersStore.subscribe, exploredLayersStore.getSnapshot);
}
