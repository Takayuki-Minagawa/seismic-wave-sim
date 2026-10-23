interface TabBarProps<T extends string> {
  tabs: { id: T; label: string; icon: string; badge?: string }[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
}

/** Pill-style segmented tabs used by the side and analysis panels. */
export function TabBar<T extends string>({ tabs, active, onChange, className = '' }: TabBarProps<T>) {
  return (
    <div role="tablist" className={`flex gap-1 rounded-2xl bg-slate-200/70 p-1 dark:bg-white/5 ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative flex flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-xl px-2 py-1.5 text-xs font-bold transition-all ${
            active === tab.id
              ? 'bg-white text-slate-900 shadow-sm dark:bg-white/15 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
          {tab.badge && (
            <span className="ml-0.5 rounded-full bg-amber-400 px-1.5 font-hud text-[9px] text-slate-900">{tab.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}
