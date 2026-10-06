import { ChevronRight } from 'lucide-react';
import { openSheet } from '../../app/router';
import { cx } from '../../components/cx';
import { Panel, SectionHeading } from '../../components/Page';
import type { ISODate, Objective } from '../../db/types';
import { dueLabel, HORIZON_LABELS, nextOnRidge } from '../../lib/objectives';
import styles from './Camp.module.css';

/** Beneath today's tasks, so today always connects to something bigger. */
export function NextOnRidge({ objectives, today }: { objectives: Objective[]; today: ISODate }) {
  const next = nextOnRidge(objectives);
  const due = next?.dueDate ? dueLabel(next.dueDate, today) : null;
  return (
    <section className={styles.nextRidge} aria-labelledby="next-on-ridge">
      <SectionHeading id="next-on-ridge">Next on the ridge</SectionHeading>
      <Panel>
        {next ? (
          <button
            type="button"
            className={styles.nextButton}
            onClick={() => openSheet('ridge', `objective:${next.id}`)}
          >
            <span className={styles.nextTitle}>{next.title}</span>
            <span className={cx(styles.nextDue, 'tabular', due?.overdue && styles.nextOverdue)}>
              {due ? due.text : HORIZON_LABELS[next.horizon]}
            </span>
          </button>
        ) : (
          <a href="#/ridge" className={styles.nextButton}>
            <span className={styles.nextEmpty}>Set an objective for the next few weeks</span>
            <ChevronRight className={styles.nextChevron} aria-hidden="true" />
          </a>
        )}
      </Panel>
    </section>
  );
}
