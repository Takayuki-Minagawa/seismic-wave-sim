import { useTranslation } from 'react-i18next';
import { WAVE_COLORS } from '../../utils/colorScale';

/** Compact legend for wave phases and shadow zones, overlaid on the Earth view. */
export function WaveLegend() {
  const { t } = useTranslation();

  const items = [
    { color: WAVE_COLORS.P.stroke, label: t('wave.P'), kind: 'line' },
    { color: WAVE_COLORS.S.stroke, label: t('wave.S'), kind: 'line' },
    { color: WAVE_COLORS.PKP.stroke, label: t('wave.PKP'), kind: 'line' },
    { color: 'rgba(251,146,60,0.9)', label: t('shadowZone.P'), kind: 'bar' },
    { color: 'rgba(244,63,94,0.7)', label: t('shadowZone.S'), kind: 'bar' },
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(item => (
        <span
          key={item.label}
          className="flex items-center gap-1.5 rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-medium text-slate-100 backdrop-blur-sm"
        >
          <span
            className={item.kind === 'line' ? 'h-[3px] w-3.5 rounded-full' : 'h-2 w-2 rounded-sm'}
            style={{ backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}` }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}
