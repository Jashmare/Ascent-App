import { Check, Star } from 'lucide-react';
import { useId } from 'react';
import { openSheet } from '../../app/router';
import { notify } from '../../app/toast';
import { Button } from '../../components/Button';
import { Sheet } from '../../components/Sheet';
import { reopenGoal } from '../../db/goals';
import type { Dream, Goal } from '../../db/types';
import { formatFullDate } from '../../lib/dates';
import styles from './Sky.module.css';

/** A summit that was reached: a gold star. It can be moved back to active. */
export function ReachedSummitSheet({
  goal,
  dream,
  onClose,
}: {
  goal: Goal;
  dream?: Dream;
  onClose: () => void;
}) {
  const ids = useId();
  return (
    <Sheet
      title={goal.title}
      onClose={onClose}
      footer={
        <>
          <Button
            onClick={async () => {
              await reopenGoal(goal.id);
              onClose();
              notify('Moved back to active');
            }}
          >
            Move back to active
          </Button>
          <Button onClick={onClose}>Done</Button>
        </>
      }
    >
      <p className={styles.reachedLine}>
        <Star aria-hidden="true" /> Reached {formatFullDate(goal.reachedAt ?? goal.createdAt)}
      </p>
      {goal.reflection && <blockquote className={styles.reflection}>{goal.reflection}</blockquote>}

      {goal.why && (
        <section className={styles.dreamSection} aria-labelledby={`${ids}-why`}>
          <h3 id={`${ids}-why`} className={styles.dreamHeading}>
            Why it mattered
          </h3>
          <p className={styles.hopeful}>{goal.why}</p>
        </section>
      )}

      {goal.milestones.length > 0 && (
        <section className={styles.dreamSection} aria-labelledby={`${ids}-milestones`}>
          <h3 id={`${ids}-milestones`} className={styles.dreamHeading}>
            Milestones along the way
          </h3>
          <ul className={styles.milestoneList}>
            {goal.milestones.map((milestone) => (
              <li key={milestone.id}>
                <Check aria-hidden="true" className={milestone.doneAt ? undefined : styles.dim} />
                <span>
                  {milestone.title}
                  <span className="visually-hidden">
                    {milestone.doneAt ? ', done' : ', not done'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {dream && (
        <button
          type="button"
          className={styles.ledToward}
          onClick={() => openSheet('sky', `dream:${dream.id}`)}
        >
          Led toward: {dream.title}
        </button>
      )}
    </Sheet>
  );
}
