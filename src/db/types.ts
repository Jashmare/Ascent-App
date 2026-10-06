// The data model from docs/PRODUCT.md §10.

/** 'YYYY-MM-DD' in the device's local time zone. */
export type ISODate = string;
/** Milliseconds since the epoch. */
export type Timestamp = number;

/** How a task repeats. Days are 0 = Sunday … 6 = Saturday. */
export type Repeat =
  | { kind: 'none' }
  | { kind: 'daily' }
  | { kind: 'weekdays' }
  | { kind: 'days'; days: number[] };

export interface Task {
  id: string;
  title: string;
  /** One-off: the planned day. Routines: null. */
  date: ISODate | null;
  repeat: Repeat;
  objectiveId?: string;
  order: number;
  archived: boolean;
  createdAt: Timestamp;
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  /** The day it counted for. */
  date: ISODate;
  at: Timestamp;
}

export type Horizon = 'week' | 'month' | 'quarter' | 'someday';

export interface Objective {
  id: string;
  title: string;
  notes?: string;
  horizon: Horizon;
  dueDate?: ISODate;
  goalId?: string;
  status: 'open' | 'done';
  doneAt?: Timestamp;
  createdAt: Timestamp;
}

export interface Milestone {
  id: string;
  title: string;
  doneAt?: Timestamp;
}

/** Shown as "Summit" in the UI. */
export interface Goal {
  id: string;
  title: string;
  why?: string;
  /** 'YYYY-MM' */
  targetMonth?: string;
  dreamId?: string;
  milestones: Milestone[];
  progressMode: 'auto' | 'manual';
  /** 0–100 */
  manualProgress: number;
  status: 'active' | 'reached';
  reachedAt?: Timestamp;
  reflection?: string;
  createdAt: Timestamp;
}

export interface Dream {
  id: string;
  title: string;
  why?: string;
  /** "Picture it" */
  vision?: string;
  photo?: Blob;
  status: 'dreaming' | 'reached';
  reachedAt?: Timestamp;
  reflection?: string;
  createdAt: Timestamp;
}

export interface Setting {
  key: string;
  value: unknown;
}
