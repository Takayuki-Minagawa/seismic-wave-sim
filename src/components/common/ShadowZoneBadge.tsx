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
        <span className="px-1.5 py-0.5 text-xs rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-medium">
          {t('shadowZone.P')}
        </span>
      )}
      {sShadow && (
        <span className="px-1.5 py-0.5 text-xs rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium">
          {t('shadowZone.S')}
        </span>
      )}
    </div>
  );
}
