import { createContext, useContext } from 'react';
import type { Settings } from '../db/settings';

/** Settings are loaded once at the top of the app and shared from here. */
export const SettingsContext = createContext<Settings | null>(null);

export function useAppSettings(): Settings {
  const settings = useContext(SettingsContext);
  if (!settings) throw new Error('useAppSettings must be used inside SettingsContext');
  return settings;
}
