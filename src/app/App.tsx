import type { Settings } from '../db/settings';
import { useSettings } from '../db/settings';
import { Onboarding } from '../features/onboarding/Onboarding';
import { AppShell } from './AppShell';
import { SettingsContext } from './settingsContext';
import { useThemeSync } from './theme';

export function App() {
  const settings = useSettings();
  // The first read from IndexedDB takes a few milliseconds; render nothing until then
  // rather than flashing defaults.
  if (!settings) return null;
  return <LoadedApp settings={settings} />;
}

function LoadedApp({ settings }: { settings: Settings }) {
  useThemeSync(settings.theme);
  return (
    <SettingsContext value={settings}>
      {settings.onboarded ? <AppShell /> : <Onboarding />}
    </SettingsContext>
  );
}
