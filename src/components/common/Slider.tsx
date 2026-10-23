import { CSSProperties } from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  /** Short qualitative description shown under the value (e.g. "Deep-focus"). */
  hint?: string;
  icon?: string;
  colors?: [string, string];
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  formatValue,
  hint,
  icon,
  colors = ['#38bdf8', '#a78bfa'],
}: SliderProps) {
  const display = formatValue ? formatValue(value) : `${value}${unit}`;
  const pct = ((value - min) / (max - min)) * 100;
  const style = {
    '--range-pct': `${pct}%`,
    '--range-from': colors[0],
    '--range-to': colors[1],
  } as CSSProperties;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-end justify-between gap-2">
        <label className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
          {icon && <span>{icon}</span>}
          {label}
        </label>
        <div className="text-right leading-none">
          <span className="font-hud text-sm font-bold text-slate-900 dark:text-white">{display}</span>
          {hint && <div className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">{hint}</div>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="range cursor-pointer"
        style={style}
        aria-label={label}
      />
    </div>
  );
}
