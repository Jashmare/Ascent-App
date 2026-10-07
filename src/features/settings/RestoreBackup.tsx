import { Upload } from 'lucide-react';
import { useState, type ChangeEvent } from 'react';
import { navigate } from '../../app/router';
import { notify } from '../../app/toast';
import { Button } from '../../components/Button';
import { ChoiceChips } from '../../components/Chips';
import { cx } from '../../components/cx';
import { Sheet } from '../../components/Sheet';
import { readBackup, restoreBackup, type Backup, type BackupSummary } from '../../db/backup';
import { formatFullDate } from '../../lib/dates';
import { plural } from '../../lib/format';
import styles from './Settings.module.css';

/**
 * "Restore a backup": choose the file, see what's in it, then replace or merge. Used in
 * Settings and on the first-run screen, for moving to a new phone or browser.
 */
export function RestoreBackup({ variant = 'button' }: { variant?: 'button' | 'link' }) {
  const [restore, setRestore] = useState<{ backup: Backup; summary: BackupSummary } | null>(null);
  const [error, setError] = useState<string>();

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
    <div className={styles.restore}>
      <label className={cx(variant === 'link' ? styles.fileLink : styles.fileButton)}>
        <Upload aria-hidden="true" />
        Restore a backup
        <input
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          onChange={chooseFile}
        />
      </label>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {restore && (
        <RestoreSheet
          backup={restore.backup}
          summary={restore.summary}
          onClose={() => setRestore(null)}
        />
      )}
    </div>
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
