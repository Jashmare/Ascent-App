import { ChevronRight, Download } from 'lucide-react';
import { useState } from 'react';
import { isInstalled, useInstallPrompt } from '../../app/pwa';
import { useAppSettings } from '../../app/settingsContext';
import { useAutosave } from '../../app/useAutosave';
import { AltitudeHeader } from '../../components/AltitudeHeader';
import { Button } from '../../components/Button';
import { ChoiceChips } from '../../components/Chips';
import { TextField } from '../../components/Field';
import { Page, Panel, SectionHeading } from '../../components/Page';
import { setSetting, type ThemePreference, type Units } from '../../db/settings';
import { startTour } from '../guide/tourState';
import { DataSettings } from './DataSettings';
import { ReminderSettings } from './ReminderSettings';
import styles from './Settings.module.css';

/** Preferences, reminders, the guide, and your data (docs/PRODUCT.md §7). */
export function SettingsScreen() {
  const settings = useAppSettings();
  const [name, setName] = useState(settings.name);
  useAutosave(name, (value) => void setSetting('name', value.trim()));

  return (
    <Page>
      <AltitudeHeader title="Settings" showAltimeter={false} back hideLinks />

      <section aria-labelledby="settings-you">
        <SectionHeading id="settings-you">You</SectionHeading>
        <Panel className={styles.panel}>
          <TextField
            label="Your name"
            hint="Used in the greeting on Camp. Optional."
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="given-name"
            maxLength={40}
          />
          <ChoiceChips
            legend="Week starts on"
            value={String(settings.weekStartsOn)}
            options={[
              { value: '1', label: 'Monday' },
              { value: '0', label: 'Sunday' },
            ]}
            onChange={(value) => void setSetting('weekStartsOn', value === '0' ? 0 : 1)}
          />
          <ChoiceChips
            legend="Altitude in"
            value={settings.units}
            options={[
              { value: 'm', label: 'Metres' },
              { value: 'ft', label: 'Feet' },
            ]}
            onChange={(value: Units) => void setSetting('units', value)}
          />
          <ChoiceChips
            legend="Theme"
            value={settings.theme}
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
            onChange={(value: ThemePreference) => void setSetting('theme', value)}
          />
        </Panel>
      </section>

      <ReminderSettings reminders={settings.reminders} />

      <section aria-labelledby="settings-guide">
        <SectionHeading id="settings-guide">Guide</SectionHeading>
        <Panel className={styles.links}>
          <a href="#/guide" className={styles.linkRow}>
            How Ascent works
            <ChevronRight aria-hidden="true" />
          </a>
          <button type="button" className={styles.linkRow} onClick={startTour}>
            Take the tour
            <ChevronRight aria-hidden="true" />
          </button>
        </Panel>
      </section>

      <InstallSettings />
      <DataSettings />

      <p className={styles.about}>
        <span className={styles.tagline}>The sky is the limit.</span> Ascent keeps everything on
        this device and works offline.
      </p>
    </Page>
  );
}

function InstallSettings() {
  const { available, install } = useInstallPrompt();
  const installed = isInstalled();
  return (
    <section aria-labelledby="settings-install">
      <SectionHeading id="settings-install">Install</SectionHeading>
      <Panel className={styles.panel}>
        {installed ? (
          <p className={styles.note}>Ascent is installed on this device.</p>
        ) : available ? (
          <>
            <p className={styles.note}>
              Install Ascent to open it from your home screen, full screen, even offline.
            </p>
            <div>
              <Button variant="primary" icon={<Download />} onClick={install}>
                Install Ascent
              </Button>
            </div>
          </>
        ) : (
          <p className={styles.note}>
            To install, open your browser’s menu and choose “Install app” or “Add to Home screen”.
            On iPhone, tap Share, then “Add to Home Screen”.
          </p>
        )}
      </Panel>
    </section>
  );
}
