import { nowMs } from '../app/clock';
import { normaliseRepeat } from '../lib/recurrence';
import { db } from './db';
import { newId } from './ids';
import type { ISODate, Repeat, Task } from './types';

async function nextOrder(): Promise<number> {
  const tasks = await db.tasks.toArray();
  return tasks.reduce((max, t) => Math.max(max, t.order), 0) + 1;
}

export interface NewTaskInput {
  title: string;
  /** The day a one-off task is planned for. Ignored for routines. */
  date: ISODate;
  repeat?: Repeat;
  objectiveId?: string;
}

export async function addTask(input: NewTaskInput): Promise<Task> {
  const repeat = normaliseRepeat(input.repeat ?? { kind: 'none' });
  const task: Task = {
    id: newId(),
    title: input.title.trim(),
    date: repeat.kind === 'none' ? input.date : null,
    repeat,
    order: await nextOrder(),
    archived: false,
    createdAt: nowMs(),
  };
  if (input.objectiveId) task.objectiveId = input.objectiveId;
  await db.tasks.add(task);
  return task;
}

export interface TaskChanges {
  title?: string;
  repeat?: Repeat;
  objectiveId?: string | null;
}

/**
 * Updates a task. Turning a routine into a one-off plans it for `today`; turning a one-off
 * into a routine clears its date.
 */
export async function updateTask(id: string, changes: TaskChanges, today: ISODate): Promise<void> {
  await db.transaction('rw', db.tasks, async () => {
    const task = await db.tasks.get(id);
    if (!task) return;
    const next: Task = { ...task };
    if (changes.title !== undefined) next.title = changes.title.trim() || task.title;
    if (changes.repeat !== undefined) {
      next.repeat = normaliseRepeat(changes.repeat);
      if (next.repeat.kind === 'none') next.date = task.date ?? today;
      else next.date = null;
    }
    if (changes.objectiveId !== undefined) {
      if (changes.objectiveId) next.objectiveId = changes.objectiveId;
      else delete next.objectiveId;
    }
    await db.tasks.put(next);
  });
}

/** Checks a task off for a day, or unchecks it. Returns true when it's now done. */
export async function toggleTaskDone(taskId: string, date: ISODate): Promise<boolean> {
  return db.transaction('rw', db.completions, async () => {
    const existing = await db.completions.where('[taskId+date]').equals([taskId, date]).toArray();
    if (existing.length > 0) {
      await db.completions.bulkDelete(existing.map((c) => c.id));
      return false;
    }
    await db.completions.add({ id: newId(), taskId, date, at: nowMs() });
    return true;
  });
}

/**
 * Moves a task within the list shown for a day. Only the moved task changes: it takes an
 * order between its new neighbours, so its place relative to tasks on other days holds.
 */
export async function reorderTask(visible: Task[], from: number, to: number): Promise<void> {
  if (from === to || from < 0 || to < 0 || from >= visible.length || to >= visible.length) return;
  const list = [...visible];
  const [moved] = list.splice(from, 1);
  list.splice(to, 0, moved);
  const before = list[to - 1]?.order;
  const after = list[to + 1]?.order;
  const order =
    before === undefined ? after! - 1 : after === undefined ? before + 1 : (before + after) / 2;
  await db.tasks.update(moved.id, { order });
}

/** Carry-over: plans unfinished earlier tasks for today, after today's existing tasks. */
export async function bringToToday(taskIds: string[], today: ISODate): Promise<void> {
  await db.transaction('rw', db.tasks, async () => {
    let order = await nextOrder();
    for (const id of taskIds) await db.tasks.update(id, { date: today, order: order++ });
  });
}

/** Carry-over: lets tasks go. They're archived, not deleted. */
export async function letTasksGo(taskIds: string[]): Promise<void> {
  await db.tasks.where('id').anyOf(taskIds).modify({ archived: true });
}

/**
 * Removes a task. A task with completions is archived instead, so the climbing it already
 * did stays in the altimeter; a task never done is deleted outright.
 */
export async function deleteTask(id: string): Promise<'archived' | 'deleted'> {
  return db.transaction('rw', db.tasks, db.completions, async () => {
    const count = await db.completions.where('taskId').equals(id).count();
    if (count > 0) {
      await db.tasks.update(id, { archived: true });
      return 'archived';
    }
    await db.tasks.delete(id);
    return 'deleted';
  });
}
