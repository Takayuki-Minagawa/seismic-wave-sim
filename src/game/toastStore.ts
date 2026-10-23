/** Minimal external store for toast notifications (used via useSyncExternalStore). */

export type ToastKind = 'P' | 'S' | 'PKP' | 'mission' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  icon: string;
  title: string;
  body?: string;
}

const MAX_TOASTS = 4;

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach(fn => fn());
}

export const toastStore = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
  getSnapshot: () => toasts,

  push(toast: Omit<Toast, 'id'>) {
    const id = nextId++;
    toasts = [...toasts, { ...toast, id }];
    if (toasts.length > MAX_TOASTS) {
      // Drop the oldest non-mission toast first so achievements stay visible.
      const dropIdx = toasts.findIndex(t => t.kind !== 'mission');
      toasts = toasts.filter((_, i) => i !== (dropIdx >= 0 ? dropIdx : 0));
    }
    emit();
    window.setTimeout(() => toastStore.dismiss(id), toast.kind === 'mission' ? 4500 : 2800);
  },

  dismiss(id: number) {
    if (!toasts.some(t => t.id === id)) return;
    toasts = toasts.filter(t => t.id !== id);
    emit();
  },
};

/** Fire a confetti burst (picked up by <Confetti />). */
export function celebrate(): void {
  window.dispatchEvent(new CustomEvent('seismic:celebrate'));
}
