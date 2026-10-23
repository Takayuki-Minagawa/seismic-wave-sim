import { useTranslation } from 'react-i18next';

export type QuakePhase = 'idle' | 'playing' | 'paused' | 'finished';

interface QuakeButtonProps {
  phase: QuakePhase;
  onClick: () => void;
  size?: 'md' | 'lg';
  className?: string;
}

/** The big call-to-action that starts, pauses, resumes or replays the quake. */
export function QuakeButton({ phase, onClick, size = 'md', className = '' }: QuakeButtonProps) {
  const { t } = useTranslation();
  const label =
    phase === 'playing' ? t('controls.pause')
    : phase === 'paused' ? t('controls.resume')
    : phase === 'finished' ? t('controls.replay')
    : t('controls.quake');
  const icon = phase === 'playing' ? '⏸' : phase === 'paused' ? '▶' : phase === 'finished' ? '🔁' : '💥';

  return (
    <button
      onClick={onClick}
      className={`btn-quake ${phase === 'playing' ? 'is-playing' : ''} flex items-center justify-center gap-2 rounded-2xl font-extrabold text-white tracking-wide focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${
        size === 'lg' ? 'px-6 py-3 text-base' : 'px-4 py-2.5 text-sm'
      } ${className}`}
    >
      <span className={size === 'lg' ? 'text-xl' : 'text-lg'}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
