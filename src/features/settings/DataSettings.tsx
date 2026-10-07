import { Download, Trash2, Upload } from 'lucide-react';
import { useState, type ChangeEvent } from 'react';
import { now } from '../../app/clock';
import { navigate } from '../../app/router';
import { notify } from '../../app/toast';
import { Button } from '../../components/Button';
import { ChoiceChips } from '../../components/Chips';
import { TextField } from '../../components/Field';
import { Panel, SectionHeading } from '../../components/Page';
import { Sheet } from '../../components/Sheet';
import {
  backupFileName,
  createBackup,
  readBackup,
  resetEverything,
  restoreBackup,
  type Backup,
  type BackupSummary,
} from '../../db/backup';
import { formatFullDate } from '../../lib/dates';
import { plural } from '../../lib/format';
import { downloadFile } from './download';
import styles from './Settings.module.css';

/** Back up, restore and reset (docs/PRODUCT.md §7). */
export function DataSettings() {
  const [restore, setRestore] = useState<{ backup: Backup; summary: BackupSummary } | null>(null);
  const [error, setError] = useState<string>();
  const [resetting, setResetting] = useState(false);

  async function backUp() {
    const backup = await createBackup(now());
    downloadFile(backupFileName(now()), JSON.stringify(backup), 'application/json');
    notify('Backed up');
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const result = readBackup(await file.text());
    if (result.ok) {
      setError(undefined);
      setRestore({ backup: result.backup, summary: result.summary });
    } else {
      setError(result.error);
    }
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
          <label className={styles.fileButton}>
            <Upload aria-hidden="true" />
            Restore a backup
            <input
              type="file"
              accept="application/json,.json"
              className="visually-hidden"
              onChange={chooseFile}
            />
          </label>
        </div>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.danger}>
          <Button variant="destructive" icon={<Trash2 />} onClick={() => setResetting(true)}>
            Reset everything
          </Button>
          <p className={styles.note}>Deletes all your data on this device.</p>
        </div>
      </Panel>

      {restore && (
        <RestoreSheet
          backup={restore.backup}
          summary={restore.summary}
          onClose={() => setRestore(null)}
        />
      )}
      {resetting && <ResetSheet onClose={() => setResetting(false)} />}
    </section>
  );
}

function RestoreSheet({
  backup,
  summary,
  onClose,
}: {
  backup: Backup;
  summary: BackupSummary;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<'replace' | 'merge'>('replace');
  const [busy, setBusy] = useState(false);

  async function restore() {
    setBusy(true);
    await restoreBackup(backup, mode);
    onClose();
    navigate({ screen: 'camp' });
    notify('Restored');
  }

  return (
    <Sheet
      title="Restore a backup"
      onClose={onClose}
      footer={
        <>
          <Button variant="primary" disabled={busy} onClick={restore}>
            Restore
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </>
      }
    >
      <p className={styles.note}>
        Backed up on {formatFullDate(new Date(summary.exportedAt).getTime())}. It holds:
      </p>
      <ul className={styles.summary}>
        <li>{plural(summary.tasks, 'task')}</li>
        <li>{plural(summary.objectives, 'objective')}</li>
        <li>{plural(summary.summits, 'summit')}</li>
        <li>
          {plural(summary.dreams, 'dream')}
          {summary.photos > 0 && `, ${plural(summary.photos, 'photo')}`}
        </li>
        <li>{plural(summary.reached, 'star')} reached</li>
      </ul>
      <ChoiceChips
        legend="How to restore"
        value={mode}
        options={[
          { value: 'replace', label: 'Replace' },
          { value: 'merge', label: 'Merge' },
        ]}
        onChange={setMode}
      />
      <p className={styles.note}>
        {mode === 'replace'
          ? 'Everything on this device is replaced by the backup, settings included.'
          : 'Everything in the backup is added. Items in both are updated from the backup. Your settings here stay as they are.'}
      </p>
    </Sheet>
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
