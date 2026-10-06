import type { ISODate, Task, TaskCompletion } from '../db/types';
import { addDays } from './dates';
import { byOrder, completionKey, completionKeys, isRoutine } from './recurrence';

/** One-off tasks planned before today that were left unfinished (and not let go). */
export function unfinishedEarlier(
  tasks: Task[],
  completions: TaskCompletion[],
  today: ISODate,
): Task[] {
  const done = completionKeys(completions);
  return tasks
    .filter(
      (task) =>
        !task.archived &&
        !isRoutine(task) &&
        task.date != null &&
        task.date < today &&
        !done.has(completionKey(task.id, task.date)),
    )
    .sort((a, b) => (a.date! < b.date! ? -1 : a.date! > b.date! ? 1 : byOrder(a, b)));
}

export interface CarryOverCopy {
  message: string;
  bring: string;
  letGo: string;
}

/** "2 tasks from yesterday aren't done. Bring them to today?" */
export function carryOverCopy(tasks: Task[], today: ISODate): CarryOverCopy {
  const count = tasks.length;
  const one = count === 1;
  const yesterday = addDays(today, -1);
  const allYesterday = tasks.every((t) => t.date === yesterday);
  const subject = allYesterday
    ? `${count} ${one ? 'task' : 'tasks'} from yesterday`
    : `${count} earlier ${one ? 'task' : 'tasks'}`;
  return {
    message: `${subject} ${one ? "isn't" : "aren't"} done. Bring ${one ? 'it' : 'them'} to today?`,
    bring: `Bring ${one ? 'it' : 'them'} to today`,
    letGo: `Let ${one ? 'it' : 'them'} go`,
  };
}
