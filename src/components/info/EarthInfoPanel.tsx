import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EARTH_LAYERS } from '../../data/earthModel';
import { EARTH_RADIUS_KM } from '../../physics/constants';

export function EarthInfoPanel() {
  const { t } = useTranslation();
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2 p-3 overflow-y-auto h-full">
      <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-1 flex-shrink-0">
        {t('layers.title')}
      </h2>

      {/* Layer table */}
      <div className="flex flex-col gap-1.5 overflow-y-auto">
        {EARTH_LAYERS.map(layer => {
          const thickness = layer.outerRadius - layer.innerRadius;
          const isHovered = hoveredLayer === layer.name;

          return (
            <div
              key={layer.name}
              className={`rounded-lg p-2 cursor-pointer transition-all border ${
                isHovered
                  ? 'border-blue-400 dark:border-blue-500 shadow-sm'
                  : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              style={{ backgroundColor: layer.color + '33' }}
              onMouseEnter={() => setHoveredLayer(layer.name)}
              onMouseLeave={() => setHoveredLayer(null)}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: layer.color }} />
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  {t(`layers.${layer.name}`)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                  {layer.sVelocity === 0 ? t('layers.liquid') : t('layers.solid')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs">
                <div className="text-gray-500 dark:text-gray-400">{t('layers.thickness')}:</div>
                <div className="text-gray-700 dark:text-gray-300 font-mono">{thickness.toLocaleString()} km</div>
                <div className="text-gray-500 dark:text-gray-400">{t('layers.density')}:</div>
                <div className="text-gray-700 dark:text-gray-300 font-mono">{layer.density} {t('layers.densityUnit')}</div>
                <div className="text-gray-500 dark:text-gray-400">P:</div>
                <div className="text-blue-600 dark:text-blue-400 font-mono">{layer.pVelocity} {t('layers.velocityUnit')}</div>
                {layer.sVelocity > 0 ? (
                  <>
                    <div className="text-gray-500 dark:text-gray-400">S:</div>
                    <div className="text-red-600 dark:text-red-400 font-mono">{layer.sVelocity} {t('layers.velocityUnit')}</div>
                  </>
                ) : (
                  <>
                    <div className="text-gray-500 dark:text-gray-400">S:</div>
                    <div className="text-gray-400 dark:text-gray-500 font-mono">— (液体)</div>
                  </>
                )}
              </div>

              {/* Description tooltip on hover */}
              {isHovered && (
                <div className="mt-1.5 pt-1.5 border-t border-gray-300 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {t(`layers.description.${layer.name}`)}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Size reference */}
      <div className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
        地球半径: {EARTH_RADIUS_KM.toLocaleString()} km
      </div>
    </div>
  );
}
