import Dexie, { type EntityTable } from 'dexie';
import type { Dream, Goal, Objective, Setting, Task, TaskCompletion } from './types';

/**
 * The on-device database. Every schema change must add a new `this.version(n)` with an
 * upgrade function — never edit an existing version, or existing data breaks.
 *
 * Note: IndexedDB can't index booleans or null, so `archived` and routine `date: null`
 * aren't queryable through their indexes. Those filters run in memory instead.
 */
export class AscentDB extends Dexie {
  declare tasks: EntityTable<Task, 'id'>;
  declare completions: EntityTable<TaskCompletion, 'id'>;
  declare objectives: EntityTable<Objective, 'id'>;
  declare goals: EntityTable<Goal, 'id'>;
  declare dreams: EntityTable<Dream, 'id'>;
  declare settings: EntityTable<Setting, 'key'>;

  constructor(name = 'ascent') {
    super(name);
    this.version(1).stores({
      tasks: 'id, date, objectiveId, archived',
      completions: 'id, taskId, date, [taskId+date]',
      objectives: 'id, status, goalId, dueDate',
      goals: 'id, status, dreamId',
      dreams: 'id, status',
      settings: 'key',
    });
  }
}

export const db = new AscentDB();

/** Every table, for backup, restore and reset. */
export const DATA_TABLES = [
  'tasks',
  'completions',
  'objectives',
  'goals',
  'dreams',
  'settings',
] as const;
export type DataTable = (typeof DATA_TABLES)[number];
