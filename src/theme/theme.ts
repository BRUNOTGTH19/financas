export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'fin:theme';
export const THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)';

const preferences: readonly ThemePreference[] = ['light', 'dark', 'system'];

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && preferences.includes(value as ThemePreference);
}

export function getStoredTheme(
  storage: Pick<Storage, 'getItem'> | undefined = typeof localStorage === 'undefined'
    ? undefined
    : localStorage,
): ThemePreference {
  try {
    const stored = storage?.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function resolveTheme(preference: ThemePreference, prefersDark: boolean): ResolvedTheme {
  if (preference === 'system') return prefersDark ? 'dark' : 'light';
  return preference;
}

export function applyTheme(
  theme: ResolvedTheme,
  root: HTMLElement = document.documentElement,
): void {
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

export function getSystemPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(THEME_MEDIA_QUERY).matches;
}
