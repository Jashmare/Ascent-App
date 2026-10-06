import { base64ToBytes, bytesToBase64 } from '../lib/base64';
import { db } from './db';
import type { Dream, Goal, Objective, Setting, Task, TaskCompletion } from './types';

/**
 * Back up, restore and reset (docs/PRODUCT.md §7). A backup is one JSON file with every
 * table, photos included as base64, so it can be restored on any device.
 *
 * When the database schema gains a version, add a step here that upgrades older backups
 * (by `schemaVersion`) before they're written, so old files always restore.
 */
export const BACKUP_FORMAT = 1;

export interface SerializedPhoto {
  type: string;
  base64: string;
}

export type SerializedDream = Omit<Dream, 'photo'> & { photo?: SerializedPhoto };

export interface Backup {
  app: 'ascent';
  format: number;
  schemaVersion: number;
  exportedAt: string;
  data: {
    tasks: Task[];
    completions: TaskCompletion[];
    objectives: Objective[];
    goals: Goal[];
    dreams: SerializedDream[];
    settings: Setting[];
  };
}

export interface BackupSummary {
  exportedAt: string;
  tasks: number;
  completions: number;
  objectives: number;
  summits: number;
  dreams: number;
  photos: number;
  reached: number;
}

// Device-only bookkeeping that shouldn't travel with a backup.
const LOCAL_ONLY_SETTINGS = new Set(['reminderLog', 'reviewDismissedOn']);

async function serializeDream(dream: Dream): Promise<SerializedDream> {
  const { photo, ...rest } = dream;
  if (!photo) return rest;
  const bytes = new Uint8Array(await photo.arrayBuffer());
  return { ...rest, photo: { type: photo.type || 'image/jpeg', base64: bytesToBase64(bytes) } };
}

function deserializeDream(dream: SerializedDream): Dream {
  const { photo, ...rest } = dream;
  if (!photo) return rest;
  const bytes = base64ToBytes(photo.base64);
  return { ...rest, photo: new Blob([bytes as BlobPart], { type: photo.type }) };
}

export async function createBackup(now: Date = new Date()): Promise<Backup> {
  // Read inside one transaction for a consistent snapshot; encode photos afterwards, since
  // awaiting anything else inside an IndexedDB transaction would end it early.
  const [tasks, completions, objectives, goals, dreams, settings] = await db.transaction(
    'r',
    db.tables,
    () =>
      Promise.all([
        db.tasks.toArray(),
        db.completions.toArray(),
        db.objectives.toArray(),
        db.goals.toArray(),
        db.dreams.toArray(),
        db.settings.toArray(),
      ]),
  );
  return {
    app: 'ascent',
    format: BACKUP_FORMAT,
    schemaVersion: db.verno,
    exportedAt: now.toISOString(),
    data: {
      tasks,
      completions,
      objectives,
      goals,
      dreams: await Promise.all(dreams.map(serializeDream)),
      settings: settings.filter((s) => !LOCAL_ONLY_SETTINGS.has(s.key)),
    },
  };
}

export function backupFileName(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `ascent-backup-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`;
}

const NOT_A_BACKUP =
  'This file isn’t an Ascent backup. Choose the .json file made with “Back up data”.';
const NEWER_FORMAT =
  'This backup was made by a newer version of Ascent. Update the app, then try again.';

function isRecordList(value: unknown, key = 'id'): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>)[key] === 'string',
    )
  );
}

function isBackup(value: unknown): value is Backup {
  if (typeof value !== 'object' || value === null) return false;
  const backup = value as Partial<Backup>;
  const data = backup.data as Partial<Backup['data']> | undefined;
  return (
    backup.app === 'ascent' &&
    typeof backup.format === 'number' &&
    typeof data === 'object' &&
    data !== null &&
    isRecordList(data.tasks) &&
    isRecordList(data.completions) &&
    isRecordList(data.objectives) &&
    isRecordList(data.goals) &&
    isRecordList(data.dreams) &&
    isRecordList(data.settings, 'key')
  );
}

export function summarize(backup: Backup): BackupSummary {
  const { data } = backup;
  return {
    exportedAt: backup.exportedAt,
    tasks: data.tasks.filter((t) => !t.archived).length,
    completions: data.completions.length,
    objectives: data.objectives.length,
    summits: data.goals.length,
    dreams: data.dreams.length,
    photos: data.dreams.filter((d) => d.photo).length,
    reached:
      data.goals.filter((g) => g.status === 'reached').length +
      data.dreams.filter((d) => d.status === 'reached').length,
  };
}

/** Reads a backup file's text, explaining plainly what's wrong if it can't be used. */
export function readBackup(
  text: string,
): { ok: true; backup: Backup; summary: BackupSummary } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: NOT_A_BACKUP };
  }
  if (!isBackup(parsed)) return { ok: false, error: NOT_A_BACKUP };
  if (parsed.format > BACKUP_FORMAT) return { ok: false, error: NEWER_FORMAT };
  return { ok: true, backup: parsed, summary: summarize(parsed) };
}

/**
 * Restores a backup. "replace" clears this device first and takes the backup's settings;
 * "merge" adds everything from the backup (updating items that exist in both) and keeps
 * this device's settings.
 */
export async function restoreBackup(backup: Backup, mode: 'replace' | 'merge'): Promise<void> {
  const dreams = backup.data.dreams.map(deserializeDream);
  await db.transaction('rw', db.tables, async () => {
    if (mode === 'replace') await Promise.all(db.tables.map((table) => table.clear()));
    await db.tasks.bulkPut(backup.data.tasks);
    await db.completions.bulkPut(backup.data.completions);
    await db.objectives.bulkPut(backup.data.objectives);
    await db.goals.bulkPut(backup.data.goals);
    await db.dreams.bulkPut(dreams);
    if (mode === 'replace') {
      await db.settings.bulkPut(
        backup.data.settings.filter((s) => !LOCAL_ONLY_SETTINGS.has(s.key)),
      );
    }
    // Restored data has already been set up, so skip the first-run welcome.
    await db.settings.put({ key: 'onboarded', value: true });
  });
}

/** Deletes everything on this device. */
export async function resetEverything(): Promise<void> {
  await db.transaction('rw', db.tables, () => Promise.all(db.tables.map((table) => table.clear())));
}
