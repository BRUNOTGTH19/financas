import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeContext } from './ThemeContext';
import {
  applyTheme,
  getStoredTheme,
  getSystemPrefersDark,
  resolveTheme,
  THEME_MEDIA_QUERY,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from './theme';

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(() => getStoredTheme());
  const [systemPrefersDark, setSystemPrefersDark] = useState(getSystemPrefersDark);
  const resolved = resolveTheme(preference, systemPrefersDark);

  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      // Navegadores com armazenamento bloqueado seguem apenas a preferência da sessão.
    }
  }, [preference]);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const media = window.matchMedia(THEME_MEDIA_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);

    media.addEventListener?.('change', handleChange);
    return () => media.removeEventListener?.('change', handleChange);
  }, []);

  const value = useMemo(() => ({ preference, resolved, setPreference }), [preference, resolved]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
