import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import type { ISODate } from './types';

export type Units = 'm' | 'ft';
export type ThemePreference = 'system' | 'light' | 'dark';
export type WeekStart = 0 | 1;

export interface DailyReminder {
  on: boolean;
  /** 'HH:mm', local time */
  time: string;
}

export interface WeeklyReminder extends DailyReminder {
  /** 0 = Sunday … 6 = Saturday */
  day: number;
}

export interface ReminderSettings {
  morning: DailyReminder;
  evening: DailyReminder;
  objectiveDue: { on: boolean };
  weeklyReview: WeeklyReminder;
  dreamNudge: WeeklyReminder;
}

export interface Settings {
  /** Name for the greeting. */
  name: string;
  weekStartsOn: WeekStart;
  units: Units;
  theme: ThemePreference;
  reminders: ReminderSettings;
  /** First-run flow finished (or skipped). */
  onboarded: boolean;
  /** The guided tour was offered and finished or dismissed. */
  tourDone: boolean;
  /** Last day the weekly review was completed. */
  lastReviewDate: ISODate | null;
  /** Day the weekly review banner was dismissed with "Not now". */
  reviewDismissedOn: ISODate | null;
  /** Reminder id → the last day it fired, so each fires at most once a day. */
  reminderLog: Record<string, ISODate>;
}

// Reminder defaults come from docs/PRODUCT.md §8.
export const DEFAULT_SETTINGS: Settings = {
  name: '',
  weekStartsOn: 1,
  units: 'm',
  theme: 'system',
  reminders: {
    morning: { on: true, time: '07:00' },
    evening: { on: false, time: '20:00' },
    objectiveDue: { on: true },
    weeklyReview: { on: true, day: 0, time: '18:00' },
    dreamNudge: { on: false, day: 3, time: '12:00' },
  },
  onboarded: false,
  tourDone: false,
  lastReviewDate: null,
  reviewDismissedOn: null,
  reminderLog: {},
};

export type SettingKey = keyof Settings;

function merge(rows: { key: string; value: unknown }[]): Settings {
  const settings: Settings = structuredClone(DEFAULT_SETTINGS);
  for (const row of rows) {
    if (!(row.key in DEFAULT_SETTINGS)) continue;
    const key = row.key as SettingKey;
    if (key === 'reminders' && row.value && typeof row.value === 'object') {
      // Merge per reminder so a newer app version can add reminders without losing old ones.
      const stored = row.value as Partial<ReminderSettings>;
      settings.reminders = {
        morning: { ...DEFAULT_SETTINGS.reminders.morning, ...stored.morning },
        evening: { ...DEFAULT_SETTINGS.reminders.evening, ...stored.evening },
        objectiveDue: { ...DEFAULT_SETTINGS.reminders.objectiveDue, ...stored.objectiveDue },
        weeklyReview: { ...DEFAULT_SETTINGS.reminders.weeklyReview, ...stored.weeklyReview },
        dreamNudge: { ...DEFAULT_SETTINGS.reminders.dreamNudge, ...stored.dreamNudge },
      };
    } else {
      (settings as unknown as Record<string, unknown>)[key] = row.value;
    }
  }
  return settings;
}

export async function getSettings(): Promise<Settings> {
  return merge(await db.settings.toArray());
}

export async function setSetting<K extends SettingKey>(key: K, value: Settings[K]): Promise<void> {
  await db.settings.put({ key, value });
}

/** Live settings, with defaults filled in. Undefined while the first read is in flight. */
export function useSettings(): Settings | undefined {
  return useLiveQuery(async () => merge(await db.settings.toArray()), []);
}
