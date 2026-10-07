import type { Horizon, ISODate, Objective, Task, TaskCompletion } from '../db/types';
import { daysBetween, endOfMonth, endOfQuarter, endOfWeek, formatShortDate } from './dates';
import { plural } from './format';

export type ObjectiveGroup = 'overdue' | Horizon;

export const GROUP_ORDER: ObjectiveGroup[] = ['overdue', 'week', 'month', 'quarter', 'someday'];

export const GROUP_LABELS: Record<ObjectiveGroup, string> = {
  overdue: 'Overdue',
  week: 'This week',
  month: 'This month',
  quarter: 'This quarter',
  someday: 'Someday',
};

export const HORIZON_LABELS: Record<Horizon, string> = {
  week: 'This week',
  month: 'This month',
  quarter: 'This quarter',
  someday: 'Someday',
};

const HORIZON_RANK: Record<Horizon, number> = { week: 0, month: 1, quarter: 2, someday: 3 };

/** The horizon a due date falls in: the smallest of this week, month or quarter. */
export function horizonForDate(dueDate: ISODate, today: ISODate, weekStartsOn: 0 | 1): Horizon {
  if (dueDate <= endOfWeek(today, weekStartsOn)) return 'week';
  if (dueDate <= endOfMonth(today)) return 'month';
  if (dueDate <= endOfQuarter(today)) return 'quarter';
  return 'someday';
}

/**
 * Which group an open objective sits in. Past its due date it's overdue. With a due date,
 * the date decides (so a quarter objective due in two days shows under this week). Without
 * one, its chosen horizon decides.
 */
export function objectiveGroup(
  objective: Objective,
  today: ISODate,
  weekStartsOn: 0 | 1,
): ObjectiveGroup {
  const { dueDate, horizon } = objective;
  if (!dueDate) return horizon;
  if (dueDate < today) return 'overdue';
  const byDate = horizonForDate(dueDate, today, weekStartsOn);
  return byDate === 'someday' ? horizon : byDate;
}

function compareOpen(a: Objective, b: Objective): number {
  if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
  if (a.dueDate && !b.dueDate) return -1;
  if (!a.dueDate && b.dueDate) return 1;
  return a.createdAt - b.createdAt;
}

/** Open objectives in their groups, in order. Groups with nothing in them are left out. */
export function groupObjectives(
  objectives: Objective[],
  today: ISODate,
  weekStartsOn: 0 | 1,
): { group: ObjectiveGroup; label: string; items: Objective[] }[] {
  const buckets = new Map<ObjectiveGroup, Objective[]>();
  for (const objective of objectives) {
    if (objective.status !== 'open') continue;
    const group = objectiveGroup(objective, today, weekStartsOn);
    buckets.set(group, [...(buckets.get(group) ?? []), objective]);
  }
  return GROUP_ORDER.filter((group) => buckets.has(group)).map((group) => ({
    group,
    label: GROUP_LABELS[group],
    items: buckets.get(group)!.sort(compareOpen),
  }));
}

/** "Due today", "3 days left", "2 days overdue", or the date when it's further off. */
export function dueLabel(dueDate: ISODate, today: ISODate): { text: string; overdue: boolean } {
  const days = daysBetween(today, dueDate);
  if (days < 0) return { text: `${plural(-days, 'day')} overdue`, overdue: true };
  if (days === 0) return { text: 'Due today', overdue: false };
  if (days === 1) return { text: 'Due tomorrow', overdue: false };
  if (days <= 7) return { text: `${days} days left`, overdue: false };
  return { text: formatShortDate(dueDate, today), overdue: false };
}

/**
 * "Next on the ridge": the open objective with the nearest due date (overdue ones first).
 * Without any due dates, the one on the shortest horizon.
 */
export function nextOnRidge(objectives: Objective[]): Objective | undefined {
  const open = objectives.filter((o) => o.status === 'open');
  const dated = open.filter((o) => o.dueDate).sort(compareOpen);
  if (dated.length > 0) return dated[0];
  return open.sort(
    (a, b) => HORIZON_RANK[a.horizon] - HORIZON_RANK[b.horizon] || a.createdAt - b.createdAt,
  )[0];
}

/** Open objectives due on a given day. */
export function dueOn(objectives: Objective[], date: ISODate): Objective[] {
  return objectives.filter((o) => o.status === 'open' && o.dueDate === date);
}

/** How many times tasks linked to an objective have been completed. */
export function linkedTasksDone(
  objectiveId: string,
  tasks: Task[],
  completions: TaskCompletion[],
): number {
  const ids = new Set(tasks.filter((t) => t.objectiveId === objectiveId).map((t) => t.id));
  return completions.filter((c) => ids.has(c.taskId)).length;
}
