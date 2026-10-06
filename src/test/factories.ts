import type { Dream, Goal, ISODate, Milestone, Objective, Task, TaskCompletion } from '../db/types';

// Generic sample data for tests. Never real names or personal details.

let seq = 0;
const next = (prefix: string) => `${prefix}${++seq}`;

/** A timestamp at a local hour on an ISO day. */
export function at(date: ISODate, hour = 9, minute = 0): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d, hour, minute).getTime();
}

export function makeTask(overrides: Partial<Task> = {}): Task {
  const id = overrides.id ?? next('task-');
  return {
    id,
    title: `Task ${id}`,
    date: null,
    repeat: { kind: 'none' },
    order: seq,
    archived: false,
    createdAt: at('2026-01-01'),
    ...overrides,
  };
}

export function done(taskId: string, date: ISODate): TaskCompletion {
  return { id: `done-${taskId}-${date}`, taskId, date, at: at(date, 18) };
}

export function makeObjective(overrides: Partial<Objective> = {}): Objective {
  const id = overrides.id ?? next('objective-');
  return {
    id,
    title: `Objective ${id}`,
    horizon: 'month',
    status: 'open',
    createdAt: at('2026-01-01'),
    ...overrides,
  };
}

export function makeMilestone(overrides: Partial<Milestone> = {}): Milestone {
  const id = overrides.id ?? next('milestone-');
  return { id, title: `Milestone ${id}`, ...overrides };
}

export function makeGoal(overrides: Partial<Goal> = {}): Goal {
  const id = overrides.id ?? next('goal-');
  return {
    id,
    title: `Summit ${id}`,
    milestones: [],
    progressMode: 'auto',
    manualProgress: 0,
    status: 'active',
    createdAt: at('2026-01-01'),
    ...overrides,
  };
}

export function makeDream(overrides: Partial<Dream> = {}): Dream {
  const id = overrides.id ?? next('dream-');
  return {
    id,
    title: `Dream ${id}`,
    status: 'dreaming',
    createdAt: at('2026-01-01'),
    ...overrides,
  };
}
