import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { announce } from '../../app/toast';
import { reorderTask } from '../../db/tasks';
import type { ISODate, Objective, Task } from '../../db/types';
import { completionKey } from '../../lib/recurrence';
import { TaskRow } from './TaskRow';
import styles from './Camp.module.css';

interface TaskListProps {
  tasks: Task[];
  doneKeys: Set<string>;
  today: ISODate;
  objectivesById: Map<string, Objective>;
  units: 'm' | 'ft';
  weekStartsOn: 0 | 1;
}

interface Drag {
  id: string;
  from: number;
  to: number;
  dy: number;
  startY: number;
  heights: number[];
}

/** Where the dragged row would land, given how far it has moved. */
function targetIndex(from: number, dy: number, heights: number[]): number {
  let to = from;
  let travelled = 0;
  if (dy > 0) {
    for (let i = from + 1; i < heights.length; i++) {
      if (dy > travelled + heights[i] / 2) to = i;
      else break;
      travelled += heights[i];
    }
  } else {
    for (let i = from - 1; i >= 0; i--) {
      if (-dy > travelled + heights[i] / 2) to = i;
      else break;
      travelled += heights[i];
    }
  }
  return to;
}

function shiftFor(index: number, drag: Drag): number {
  const size = drag.heights[drag.from];
  if (drag.from < drag.to && index > drag.from && index <= drag.to) return -size;
  if (drag.to < drag.from && index >= drag.to && index < drag.from) return size;
  return 0;
}

/**
 * Today's tasks, one panel with dividers. Reorder by dragging the grip, or focus the grip
 * and use the up and down arrow keys.
 */
export function TaskList({
  tasks,
  doneKeys,
  today,
  objectivesById,
  units,
  weekStartsOn,
}: TaskListProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const hintId = useId();
  const [drag, setDrag] = useState<Drag | null>(null);
  // Show a dropped order straight away, until the database catches up with it.
  const [optimistic, setOptimistic] = useState<{ basis: Task[]; ids: string[] } | null>(null);
  const focusAfterMove = useRef<string | null>(null);

  const shown =
    optimistic && optimistic.basis === tasks
      ? optimistic.ids
          .map((id) => tasks.find((t) => t.id === id))
          .filter((t): t is Task => Boolean(t))
      : tasks;

  // Moving a row in the DOM can drop focus from its grip; put it back.
  useEffect(() => {
    const id = focusAfterMove.current;
    if (!id) return;
    focusAfterMove.current = null;
    listRef.current?.querySelector<HTMLElement>(`[data-handle-for="${id}"]`)?.focus();
  }, [tasks, optimistic]);

  function move(from: number, to: number) {
    if (to < 0 || to >= shown.length || from === to) return;
    const ids = shown.map((t) => t.id);
    const [id] = ids.splice(from, 1);
    ids.splice(to, 0, id);
    setOptimistic({ basis: tasks, ids });
    focusAfterMove.current = id;
    void reorderTask(shown, from, to);
    announce(`Moved to position ${to + 1} of ${shown.length}`);
  }

  function onPointerDown(event: PointerEvent<HTMLButtonElement>, index: number) {
    if (event.button !== 0) return;
    event.preventDefault();
    const rows = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[data-row]') ?? []);
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({
      id: shown[index].id,
      from: index,
      to: index,
      dy: 0,
      startY: event.clientY,
      heights: rows.map((row) => row.getBoundingClientRect().height),
    });
  }

  function onPointerMove(event: PointerEvent<HTMLUListElement>) {
    if (!drag) return;
    const dy = event.clientY - drag.startY;
    setDrag({ ...drag, dy, to: targetIndex(drag.from, dy, drag.heights) });
  }

  function endDrag() {
    if (!drag) return;
    if (drag.to !== drag.from) move(drag.from, drag.to);
    setDrag(null);
  }

  function onHandleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      move(index, index - 1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      move(index, index + 1);
    }
  }

  if (shown.length === 0) return null;

  return (
    <>
      <p id={hintId} className="visually-hidden">
        Drag, or press the up and down arrow keys, to reorder.
      </p>
      <ul
        ref={listRef}
        className={styles.taskList}
        aria-label="Today’s tasks"
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={() => setDrag(null)}
      >
        {shown.map((task, index) => {
          let style: CSSProperties | undefined;
          if (drag) {
            const offset = task.id === drag.id ? drag.dy : shiftFor(index, drag);
            if (offset) style = { transform: `translateY(${offset}px)` };
          }
          return (
            <TaskRow
              key={task.id}
              task={task}
              done={doneKeys.has(completionKey(task.id, today))}
              today={today}
              objective={task.objectiveId ? objectivesById.get(task.objectiveId) : undefined}
              units={units}
              weekStartsOn={weekStartsOn}
              handleHintId={hintId}
              dragging={drag?.id === task.id}
              style={style}
              onHandlePointerDown={(event) => onPointerDown(event, index)}
              onHandleKeyDown={(event) => onHandleKeyDown(event, index)}
            />
          );
        })}
      </ul>
    </>
  );
}
