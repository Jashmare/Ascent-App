import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { altimeter, altitudeRecords } from '../lib/altimeter';
import { db } from './db';
import type { Dream, Goal, ISODate, Objective, Task, TaskCompletion } from './types';

// Live views of each table. They re-render whenever the underlying data changes,
// including changes made in another tab. Undefined means the first read is in flight.

export function useTasks(): Task[] | undefined {
  return useLiveQuery(() => db.tasks.toArray(), []);
}

export function useCompletions(): TaskCompletion[] | undefined {
  return useLiveQuery(() => db.completions.toArray(), []);
}

export function useObjectives(): Objective[] | undefined {
  return useLiveQuery(() => db.objectives.toArray(), []);
}

export function useGoals(): Goal[] | undefined {
  return useLiveQuery(() => db.goals.toArray(), []);
}

export function useDreams(): Dream[] | undefined {
  return useLiveQuery(() => db.dreams.toArray(), []);
}

/** Today's climb and the lifetime total, in metres. */
export function useAltimeter(today: ISODate): { today: number; total: number } | undefined {
  const records = useLiveQuery(async () => {
    const [completions, objectives, goals] = await Promise.all([
      db.completions.toArray(),
      db.objectives.toArray(),
      db.goals.toArray(),
    ]);
    return altitudeRecords(completions, objectives, goals);
  }, []);
  return useMemo(() => (records ? altimeter(records, today) : undefined), [records, today]);
}
