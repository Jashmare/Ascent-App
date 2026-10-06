import { useId } from 'react';
import { notify } from '../../app/toast';
import { Button } from '../../components/Button';
import { bringToToday, letTasksGo } from '../../db/tasks';
import type { ISODate, Task } from '../../db/types';
import { carryOverCopy } from '../../lib/carryOver';
import styles from './Camp.module.css';

/**
 * A quiet prompt on the first open of a new day: "2 tasks from yesterday aren't done.
 * Bring them to today?" Letting go archives the tasks; nothing is deleted.
 */
export function CarryOverPrompt({ tasks, today }: { tasks: Task[]; today: ISODate }) {
  const headingId = useId();
  const copy = carryOverCopy(tasks, today);
  const ids = tasks.map((t) => t.id);
  const shown = tasks.slice(0, 3);
  const more = tasks.length - shown.length;

  return (
    <section className={styles.carryOver} aria-labelledby={headingId}>
      <p id={headingId} className={styles.carryMessage}>
        {copy.message}
      </p>
      <ul className={styles.carryList}>
        {shown.map((task) => (
          <li key={task.id}>{task.title}</li>
        ))}
        {more > 0 && <li>and {more} more</li>}
      </ul>
      <div className={styles.carryActions}>
        <Button
          variant="primary"
          onClick={async () => {
            await bringToToday(ids, today);
            notify(tasks.length === 1 ? 'Brought to today' : 'Brought them to today');
          }}
        >
          {copy.bring}
        </Button>
        <Button
          onClick={async () => {
            await letTasksGo(ids);
            notify(tasks.length === 1 ? 'Let it go' : 'Let them go');
          }}
        >
          {copy.letGo}
        </Button>
      </div>
    </section>
  );
}
