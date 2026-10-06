import { nowMs } from '../app/clock';
import { db } from './db';
import { newId } from './ids';
import type { Horizon, ISODate, Objective } from './types';

export interface ObjectiveInput {
  title: string;
  notes?: string;
  horizon: Horizon;
  dueDate?: ISODate;
  goalId?: string;
}

function clean(input: Partial<ObjectiveInput>): Partial<Objective> {
  const out: Partial<Objective> = {};
  if (input.title !== undefined) out.title = input.title.trim();
  if (input.notes !== undefined) out.notes = input.notes.trim() || undefined;
  if (input.horizon !== undefined) out.horizon = input.horizon;
  if (input.dueDate !== undefined) out.dueDate = input.dueDate || undefined;
  if (input.goalId !== undefined) out.goalId = input.goalId || undefined;
  return out;
}

export async function addObjective(input: ObjectiveInput): Promise<Objective> {
  const objective: Objective = {
    id: newId(),
    title: input.title.trim(),
    horizon: input.horizon,
    status: 'open',
    createdAt: nowMs(),
    ...clean({ notes: input.notes, dueDate: input.dueDate, goalId: input.goalId }),
  };
  await db.objectives.add(objective);
  return objective;
}

export async function updateObjective(id: string, changes: Partial<ObjectiveInput>): Promise<void> {
  await db.transaction('rw', db.objectives, async () => {
    const objective = await db.objectives.get(id);
    if (!objective) return;
    const next = { ...objective, ...clean(changes) };
    // Optional fields set to undefined are dropped rather than stored as undefined.
    for (const key of ['notes', 'dueDate', 'goalId'] as const) {
      if (next[key] === undefined) delete next[key];
    }
    await db.objectives.put(next);
  });
}

/** Completing adds 100 m; reopening takes it back (the altimeter reads doneAt). */
export async function setObjectiveDone(id: string, done: boolean): Promise<void> {
  await db.transaction('rw', db.objectives, async () => {
    const objective = await db.objectives.get(id);
    if (!objective) return;
    if (done) {
      await db.objectives.put({ ...objective, status: 'done', doneAt: nowMs() });
    } else {
      const reopened: Objective = { ...objective, status: 'open' };
      delete reopened.doneAt;
      await db.objectives.put(reopened);
    }
  });
}

/** Deletes an objective. Its linked tasks stay, unlinked. */
export async function deleteObjective(id: string): Promise<void> {
  await db.transaction('rw', db.objectives, db.tasks, async () => {
    await db.tasks
      .where('objectiveId')
      .equals(id)
      .modify((task) => {
        delete task.objectiveId;
      });
    await db.objectives.delete(id);
  });
}
