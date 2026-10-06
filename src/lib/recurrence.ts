import type { ISODate, Repeat, Task, TaskCompletion } from '../db/types';
import { timestampToISODate, weekday, WEEKDAY_SHORT } from './dates';

export function isRoutine(task: Pick<Task, 'repeat'>): boolean {
  return task.repeat.kind !== 'none';
}

/** Does a repeat rule fall on this weekday (0 = Sunday … 6 = Saturday)? */
export function repeatMatches(repeat: Repeat, day: number): boolean {
  switch (repeat.kind) {
    case 'none':
      return false;
    case 'daily':
      return true;
    case 'weekdays':
      return day >= 1 && day <= 5;
    case 'days':
      return repeat.days.includes(day);
  }
}

/** Stable list order: the user's order first, then creation time. */
export function byOrder(a: Task, b: Task): number {
  return a.order - b.order || a.createdAt - b.createdAt;
}

/**
 * The tasks planned for a day: one-off tasks planned for that date, plus routines whose
 * repeat rule matches that weekday and that were created on or before that date.
 * Archived tasks are excluded.
 */
export function tasksForDay(tasks: Task[], date: ISODate): Task[] {
  const day = weekday(date);
  return tasks
    .filter((task) => {
      if (task.archived) return false;
      if (!isRoutine(task)) return task.date === date;
      return repeatMatches(task.repeat, day) && timestampToISODate(task.createdAt) <= date;
    })
    .sort(byOrder);
}

export function isDoneOn(taskId: string, date: ISODate, completions: TaskCompletion[]): boolean {
  return completions.some((c) => c.taskId === taskId && c.date === date);
}

/** A set of "taskId|date" keys for fast done-checks over many days. */
export function completionKeys(completions: TaskCompletion[]): Set<string> {
  return new Set(completions.map((c) => `${c.taskId}|${c.date}`));
}

export function completionKey(taskId: string, date: ISODate): string {
  return `${taskId}|${date}`;
}

/** An error message if a repeat rule would never show the task. */
export function repeatError(repeat: Repeat): string | undefined {
  return repeat.kind === 'days' && repeat.days.length === 0
    ? 'Choose at least one day, or pick another repeat option.'
    : undefined;
}

/** Normalises a chosen set of days: Daily if all seven, Weekdays if exactly Mon–Fri. */
export function normaliseRepeat(repeat: Repeat): Repeat {
  if (repeat.kind !== 'days') return repeat;
  const days = [...new Set(repeat.days)].filter((d) => d >= 0 && d <= 6).sort((a, b) => a - b);
  if (days.length === 7) return { kind: 'daily' };
  if (days.join() === '1,2,3,4,5') return { kind: 'weekdays' };
  return { kind: 'days', days };
}

/** "Daily", "Weekdays", "Weekends", "Mon, Wed, Fri" — or "" for one-off tasks. */
export function repeatLabel(repeat: Repeat, weekStartsOn: 0 | 1 = 1): string {
  switch (repeat.kind) {
    case 'none':
      return '';
    case 'daily':
      return 'Daily';
    case 'weekdays':
      return 'Weekdays';
    case 'days': {
      const days = [...new Set(repeat.days)];
      if (days.length === 7) return 'Daily';
      if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';
      return days
        .sort((a, b) => ((a - weekStartsOn + 7) % 7) - ((b - weekStartsOn + 7) % 7))
        .map((d) => WEEKDAY_SHORT[d])
        .join(', ');
    }
  }
}
