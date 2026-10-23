import { useTranslation } from 'react-i18next';

interface ShadowZoneBadgeProps {
  pShadow: boolean;
  sShadow: boolean;
}

export function ShadowZoneBadge({ pShadow, sShadow }: ShadowZoneBadgeProps) {
  const { t } = useTranslation();

  if (!pShadow && !sShadow) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {pShadow && (
        <span className="rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-300">
          {t('shadowZone.P')}
        </span>
      )}
      {sShadow && (
        <span className="rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-300">
          {t('shadowZone.S')}
        </span>
      )}
    </div>
  );
}
