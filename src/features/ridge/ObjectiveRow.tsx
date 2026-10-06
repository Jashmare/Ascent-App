import { openSheet } from '../../app/router';
import { useAppSettings } from '../../app/settingsContext';
import { Checkbox } from '../../components/Checkbox';
import { cx } from '../../components/cx';
import { LinkTag } from '../../components/LinkTag';
import type { Goal, ISODate, Objective } from '../../db/types';
import { formatShortDate, timestampToISODate } from '../../lib/dates';
import { plural } from '../../lib/format';
import { dueLabel } from '../../lib/objectives';
import { markObjective } from './actions';
import styles from './Ridge.module.css';

interface ObjectiveRowProps {
  objective: Objective;
  goal?: Goal;
  tasksDone: number;
  hasLinkedTasks: boolean;
  today: ISODate;
}

export function ObjectiveRow({
  objective,
  goal,
  tasksDone,
  hasLinkedTasks,
  today,
}: ObjectiveRowProps) {
  const { units } = useAppSettings();
  const done = objective.status === 'done';
  const due = !done && objective.dueDate ? dueLabel(objective.dueDate, today) : null;

  return (
    <li className={styles.row} data-done={done || undefined}>
      <Checkbox
        hideLabel
        checked={done}
        onChange={(checked) => markObjective(objective.id, checked, units)}
      >
        {done ? `Reopen “${objective.title}”` : `Mark “${objective.title}” as done`}
      </Checkbox>
      <button
        type="button"
        className={styles.main}
        onClick={() => openSheet('ridge', `objective:${objective.id}`)}
      >
        <span className={styles.title}>{objective.title}</span>
        {due && (
          <span className={cx(styles.due, 'tabular', due.overdue && styles.overdue)}>
            {due.text}
          </span>
        )}
        {done && objective.doneAt && (
          <span className={cx(styles.due, 'tabular')}>
            Done {formatShortDate(timestampToISODate(objective.doneAt), today)}
          </span>
        )}
      </button>
      {(goal || hasLinkedTasks) && (
        <div className={styles.meta}>
          {goal && (
            <LinkTag
              kind="summit"
              title={goal.title}
              onOpen={() =>
                goal.status === 'reached'
                  ? openSheet('sky', `summit:${goal.id}`)
                  : openSheet('summit', `summit:${goal.id}`)
              }
            />
          )}
          {hasLinkedTasks && (
            <span className={cx(styles.count, 'tabular')}>{plural(tasksDone, 'task')} done</span>
          )}
        </div>
      )}
    </li>
  );
}
