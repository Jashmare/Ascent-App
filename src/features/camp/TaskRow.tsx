import { Ellipsis, GripVertical, Repeat } from 'lucide-react';
import { useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { openSheet } from '../../app/router';
import { IconButton } from '../../components/Button';
import { Checkbox } from '../../components/Checkbox';
import { cx } from '../../components/cx';
import { LinkTag } from '../../components/LinkTag';
import { toggleTaskDone } from '../../db/tasks';
import type { ISODate, Objective, Task } from '../../db/types';
import { ALTITUDE_GAIN, formatGain } from '../../lib/altimeter';
import { isRoutine, repeatLabel } from '../../lib/recurrence';
import styles from './Camp.module.css';

interface TaskRowProps {
  task: Task;
  done: boolean;
  today: ISODate;
  objective?: Objective;
  units: 'm' | 'ft';
  weekStartsOn: 0 | 1;
  handleHintId: string;
  dragging: boolean;
  style?: CSSProperties;
  onHandlePointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onHandleKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}

export function TaskRow({
  task,
  done,
  today,
  objective,
  units,
  weekStartsOn,
  handleHintId,
  dragging,
  style,
  onHandlePointerDown,
  onHandleKeyDown,
}: TaskRowProps) {
  // Each check gets a fresh key so the "+10 m" float plays again.
  const [floatKey, setFloatKey] = useState(0);
  const routine = isRoutine(task);

  async function toggle() {
    const nowDone = await toggleTaskDone(task.id, today);
    if (nowDone) setFloatKey((key) => key + 1);
  }

  return (
    <li
      className={cx(styles.taskRow, dragging && styles.dragging)}
      style={style}
      data-row
      data-done={done || undefined}
    >
      <Checkbox
        checked={done}
        onChange={toggle}
        className={styles.taskCheck}
        overlay={
          floatKey > 0 ? (
            <span
              key={floatKey}
              className={styles.float}
              onAnimationEnd={() => setFloatKey(0)}
              aria-hidden="true"
            >
              {formatGain(ALTITUDE_GAIN.task, units)}
            </span>
          ) : null
        }
      >
        <span className={styles.taskTitle}>{task.title}</span>
      </Checkbox>
      <IconButton
        label={`Edit “${task.title}”`}
        icon={<Ellipsis />}
        className={styles.rowButton}
        onClick={() => openSheet('camp', `task:${task.id}`)}
      />
      <button
        type="button"
        className={styles.handle}
        aria-label={`Reorder “${task.title}”`}
        aria-describedby={handleHintId}
        data-handle-for={task.id}
        onPointerDown={onHandlePointerDown}
        onKeyDown={onHandleKeyDown}
      >
        <GripVertical aria-hidden="true" />
      </button>
      {(routine || objective) && (
        <div className={styles.taskMeta}>
          {routine && (
            <span className={styles.repeatBadge}>
              <Repeat aria-hidden="true" />
              <span className="visually-hidden">Repeats </span>
              {repeatLabel(task.repeat, weekStartsOn)}
            </span>
          )}
          {objective && (
            <LinkTag
              kind="objective"
              title={objective.title}
              onOpen={() => openSheet('ridge', `objective:${objective.id}`)}
            />
          )}
        </div>
      )}
    </li>
  );
}
