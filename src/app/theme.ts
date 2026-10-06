import { useEffect } from 'react';
import type { ThemePreference } from '../db/settings';

const THEME_MIRROR_KEY = 'ascent:theme';

/** Point the browser's UI colour (address bar, task switcher) at the current background. */
export function syncThemeColor(): void {
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  if (bg) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
}

/**
 * Applies the theme preference to <html data-theme>, following the system setting when
 * the preference is "system". The preference is mirrored to localStorage only so the
 * inline script in index.html can paint the right theme before the app loads.
 */
export function useThemeSync(preference: ThemePreference): void {
  useEffect(() => {
    try {
      localStorage.setItem(THEME_MIRROR_KEY, preference);
    } catch {
      // Storage can be unavailable (private mode). The theme still applies for this visit.
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = preference === 'dark' || (preference === 'system' && media.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      syncThemeColor();
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [preference]);
}
