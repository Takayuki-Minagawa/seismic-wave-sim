import { useTranslation } from 'react-i18next';
import { Toggle } from '../common/Toggle';

interface TopBarProps {
  isDark: boolean;
  onThemeToggle: () => void;
}

export function TopBar({ isDark, onThemeToggle }: TopBarProps) {
  const { t, i18n } = useTranslation();
  const isJa = i18n.language === 'ja';

  const toggleLanguage = () => {
    i18n.changeLanguage(isJa ? 'en' : 'ja');
  };

  return (
    <header className="flex items-center justify-between px-3 py-2 bg-gray-800 dark:bg-gray-950 text-white border-b border-gray-700 dark:border-gray-800 flex-shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg">🌍</span>
        <h1 className="text-sm font-bold truncate leading-tight">{t('appTitle')}</h1>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="px-2 py-0.5 text-xs rounded border border-gray-500 hover:border-gray-300 transition-colors"
          aria-label="Switch language"
        >
          {isJa ? 'EN' : 'JA'}
        </button>

        {/* Theme toggle */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">{isDark ? '🌙' : '☀️'}</span>
          <Toggle checked={isDark} onChange={onThemeToggle} ariaLabel="Toggle dark mode" />
        </div>
      </div>
    </header>
  );
}
