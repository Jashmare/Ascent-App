import type { Goal, ISODate, Objective, TaskCompletion } from '../db/types';
import { timestampToISODate } from './dates';

/** Metres climbed per kind of achievement (docs/PRODUCT.md §7). */
export const ALTITUDE_GAIN = {
  task: 10,
  milestone: 250,
  objective: 100,
  summit: 1000,
} as const;

export type AltitudeKind = keyof typeof ALTITUDE_GAIN;

export interface AltitudeRecord {
  kind: AltitudeKind;
  /** The local day it happened. */
  date: ISODate;
}

/**
 * Collects every completion record that adds altitude. Unchecking something removes its
 * record, so the altimeter can never drift from what's actually done.
 */
export function altitudeRecords(
  completions: TaskCompletion[],
  objectives: Objective[],
  goals: Goal[],
): AltitudeRecord[] {
  const records: AltitudeRecord[] = completions.map((c) => ({ kind: 'task', date: c.date }));
  for (const objective of objectives) {
    if (objective.status === 'done' && objective.doneAt != null) {
      records.push({ kind: 'objective', date: timestampToISODate(objective.doneAt) });
    }
  }
  for (const goal of goals) {
    for (const milestone of goal.milestones) {
      if (milestone.doneAt != null) {
        records.push({ kind: 'milestone', date: timestampToISODate(milestone.doneAt) });
      }
    }
    if (goal.status === 'reached' && goal.reachedAt != null) {
      records.push({ kind: 'summit', date: timestampToISODate(goal.reachedAt) });
    }
  }
  return records;
}

/** Today's climb and the lifetime total, in metres. */
export function altimeter(
  records: AltitudeRecord[],
  today: ISODate,
): { today: number; total: number } {
  let todayMetres = 0;
  let total = 0;
  for (const record of records) {
    const gain = ALTITUDE_GAIN[record.kind];
    total += gain;
    if (record.date === today) todayMetres += gain;
  }
  return { today: todayMetres, total };
}

const METRES_TO_FEET = 3.28084;

export function toUnits(metres: number, units: 'm' | 'ft'): number {
  return units === 'ft' ? Math.round(metres * METRES_TO_FEET) : metres;
}

const numberFormat = new Intl.NumberFormat('en');

/** "4,320 m" or "14,173 ft" */
export function formatAltitude(metres: number, units: 'm' | 'ft'): string {
  return `${numberFormat.format(toUnits(metres, units))} ${units}`;
}

/** "+60 m" */
export function formatGain(metres: number, units: 'm' | 'ft'): string {
  return `+${formatAltitude(metres, units)}`;
}
