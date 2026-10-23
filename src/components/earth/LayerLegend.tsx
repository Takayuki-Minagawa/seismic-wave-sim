import { useTranslation } from 'react-i18next';
import { EARTH_LAYERS } from '../../data/earthModel';

interface LayerLegendProps {
  isDark: boolean;
}

export function LayerLegend({ isDark }: LayerLegendProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 px-2 py-1 justify-center">
      {EARTH_LAYERS.map(layer => (
        <div key={layer.name} className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: isDark ? layer.darkColor : layer.color }}
          />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {t(`layers.${layer.name}`)}
          </span>
        </div>
      ))}
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-sm flex-shrink-0 bg-red-400 opacity-60" />
        <span className="text-xs text-gray-600 dark:text-gray-400">{t('shadowZone.S')}</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-sm flex-shrink-0 bg-orange-400 opacity-60" />
        <span className="text-xs text-gray-600 dark:text-gray-400">{t('shadowZone.P')}</span>
      </div>
    </div>
  );
}
