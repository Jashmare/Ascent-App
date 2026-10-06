import type { ISODate, Task, TaskCompletion } from '../db/types';
import { addDays, dayNumber, timestampToISODate, weekday } from './dates';
import { completionKey, completionKeys, isRoutine, repeatMatches } from './recurrence';

export interface Streak {
  current: number;
  longest: number;
}

/**
 * Consecutive days on which every task planned for that day was done (docs/PRODUCT.md §3).
 * A day with no tasks neither adds to nor breaks the streak. Today is still in progress,
 * so an unfinished today never breaks it — it only counts once everything is done.
 */
export function streak(tasks: Task[], completions: TaskCompletion[], today: ISODate): Streak {
  const active = tasks.filter((t) => !t.archived);
  if (active.length === 0) return { current: 0, longest: 0 };

  // Group once, so each day costs only the tasks that could fall on it.
  const oneOffByDate = new Map<ISODate, Task[]>();
  const routines: { task: Task; from: ISODate }[] = [];
  let first = today;
  for (const task of active) {
    if (isRoutine(task)) {
      const from = timestampToISODate(task.createdAt);
      routines.push({ task, from });
      if (from < first) first = from;
    } else if (task.date) {
      const list = oneOffByDate.get(task.date) ?? [];
      list.push(task);
      oneOffByDate.set(task.date, list);
      if (task.date < first) first = task.date;
    }
  }

  const done = completionKeys(completions);
  let current = 0;
  let longest = 0;
  const days = dayNumber(today) - dayNumber(first);

  for (let i = 0; i <= days; i++) {
    const date = addDays(first, i);
    const day = weekday(date);
    const planned = [
      ...(oneOffByDate.get(date) ?? []),
      ...routines
        .filter(({ task, from }) => from <= date && repeatMatches(task.repeat, day))
        .map(({ task }) => task),
    ];
    if (planned.length === 0) continue; // no tasks: neither adds nor breaks

    const allDone = planned.every((task) => done.has(completionKey(task.id, date)));
    if (allDone) {
      current += 1;
      longest = Math.max(longest, current);
    } else if (date !== today) {
      current = 0;
    }
  }

  return { current, longest };
}
