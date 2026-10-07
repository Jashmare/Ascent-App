import { Download, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { now } from '../../app/clock';
import { navigate } from '../../app/router';
import { notify } from '../../app/toast';
import { Button } from '../../components/Button';
import { TextField } from '../../components/Field';
import { Panel, SectionHeading } from '../../components/Page';
import { Sheet } from '../../components/Sheet';
import { backupFileName, createBackup, resetEverything } from '../../db/backup';
import { downloadFile } from './download';
import { RestoreBackup } from './RestoreBackup';
import styles from './Settings.module.css';

/** Back up, restore and reset (docs/PRODUCT.md §7). */
export function DataSettings() {
  const [resetting, setResetting] = useState(false);

  async function backUp() {
    const backup = await createBackup(now());
    downloadFile(backupFileName(now()), JSON.stringify(backup), 'application/json');
    notify('Backed up');
  }

  return (
    <section aria-labelledby="settings-data">
      <SectionHeading id="settings-data">Your data</SectionHeading>
      <Panel className={styles.panel}>
        <p className={styles.note}>
          Everything you add stays on this device. Nothing is sent anywhere. Back up now and then,
          so you can restore it on a new phone or browser.
        </p>
        <div className={styles.actions}>
          <Button icon={<Download />} onClick={backUp}>
            Back up data
          </Button>
          <RestoreBackup />
        </div>
        <div className={styles.danger}>
          <Button variant="destructive" icon={<Trash2 />} onClick={() => setResetting(true)}>
            Reset everything
          </Button>
          <p className={styles.note}>Deletes all your data on this device.</p>
        </div>
      </Panel>

      {resetting && <ResetSheet onClose={() => setResetting(false)} />}
    </section>
  );
}

function ResetSheet({ onClose }: { onClose: () => void }) {
  const [typed, setTyped] = useState('');
  const ready = typed.trim().toLowerCase() === 'reset';

  async function reset() {
    await resetEverything();
    try {
      localStorage.removeItem('ascent:sky-view');
    } catch {
      // Nothing to clear in private mode.
    }
    onClose();
    navigate({ screen: 'camp' }, { replace: true });
  }

  return (
    <Sheet
      title="Reset everything"
      onClose={onClose}
      footer={
        <>
          <Button variant="destructive" disabled={!ready} onClick={reset}>
            Delete everything
          </Button>
          <Button onClick={onClose}>Keep my data</Button>
        </>
      }
    >
      <div className={styles.stack}>
        <p>
          This deletes every task, objective, summit and dream on this device, and your settings. It
          can’t be undone.
        </p>
        <p className={styles.note}>If you might want them later, back up first.</p>
        <TextField
          label="Type “reset” to confirm"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
        />
      </div>
    </Sheet>
  );
}
