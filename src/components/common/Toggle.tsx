interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  ariaLabel?: string;
}

export function Toggle({ checked, onChange, label, ariaLabel }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex items-center h-5 w-9 rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${
        checked ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`absolute inline-block w-3.5 h-3.5 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-1'
        }`}
      />
      {label && <span className="sr-only">{label}</span>}
    </button>
  );
}
