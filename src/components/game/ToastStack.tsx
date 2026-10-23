import { useToasts } from '../../game/hooks';
import { toastStore, ToastKind } from '../../game/toastStore';

const KIND_STYLE: Record<ToastKind, string> = {
  P: 'from-sky-500/90 to-sky-700/90 shadow-sky-500/30',
  S: 'from-rose-500/90 to-rose-700/90 shadow-rose-500/30',
  PKP: 'from-violet-500/90 to-violet-700/90 shadow-violet-500/30',
  mission: 'from-amber-400 to-orange-500 shadow-amber-500/40',
  info: 'from-slate-600/90 to-slate-800/90 shadow-slate-500/20',
};

export function ToastStack() {
  const toasts = useToasts();

  return (
    <div className="pointer-events-none fixed right-3 top-16 z-50 flex w-72 max-w-[calc(100vw-1.5rem)] flex-col gap-2" aria-live="polite">
      {toasts.map(toast => (
        <button
          key={toast.id}
          onClick={() => toastStore.dismiss(toast.id)}
          className={`pointer-events-auto flex items-center gap-3 rounded-2xl bg-gradient-to-r px-3 py-2.5 text-left text-white shadow-xl backdrop-blur-md animate-pop-in ${KIND_STYLE[toast.kind]}`}
        >
          <span className={`flex-shrink-0 text-2xl ${toast.kind === 'mission' ? 'animate-bounce-in' : ''}`}>{toast.icon}</span>
          <span className="min-w-0">
            <span className="block text-xs font-extrabold leading-tight">{toast.title}</span>
            {toast.body && <span className="block truncate text-[11px] opacity-90">{toast.body}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}
