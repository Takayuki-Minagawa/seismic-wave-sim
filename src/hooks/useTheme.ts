import { useState, useEffect, useCallback } from 'react';
import { readStorage, writeStorage } from '../game/storage';

export function useTheme() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = readStorage('theme');
    // The space theme is the default experience; light mode is opt-in.
    return stored ? stored === 'dark' : true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isDark ? '#070b1a' : '#eef3ff');
    writeStorage('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggle = useCallback(() => setIsDark(d => !d), []);

  return { isDark, toggle };
}
