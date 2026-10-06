import { ClimbLine } from '../../components/ClimbLine';
import { Tabular } from '../../components/Tabular';
import { plural } from '../../lib/format';
import type { Streak } from '../../lib/streak';
import styles from './Camp.module.css';

interface ClimbSummaryProps {
  done: number;
  total: number;
  streak: Streak;
}

/** The climb line with its text equivalent and the streak. Never streak-shaming. */
export function ClimbSummary({ done, total, streak }: ClimbSummaryProps) {
  const allDone = total > 0 && done === total;
  return (
    <section className={styles.climb} aria-label="Today’s climb" data-tour="climb">
      <ClimbLine progress={total === 0 ? 0 : done / total} />
      <div className={styles.climbFooter}>
        <p className={styles.climbLabel}>
          {allDone ? 'Today’s climb is done.' : <Tabular>{`${done} of ${total} done`}</Tabular>}
        </p>
        <StreakText streak={streak} />
      </div>
    </section>
  );
}

/** Current and longest streak. When a streak ends, the copy is simply "Fresh start today." */
export function StreakText({ streak }: { streak: Streak }) {
  if (streak.longest === 0) return null;
  const longest = `Longest ${plural(streak.longest, 'day')}`;
  if (streak.current === 0) {
    return (
      <p className={styles.streak}>
        <span className={styles.streakMain}>Fresh start today.</span>
        <Tabular className={styles.streakLongest}>{longest}</Tabular>
      </p>
    );
  }
  const note =
    streak.longest > streak.current ? longest : streak.current > 1 ? 'Your longest yet' : null;
  return (
    <p className={styles.streak}>
      <Tabular className={styles.streakMain}>{`${streak.current}-day streak`}</Tabular>
      {note && <Tabular className={styles.streakLongest}>{note}</Tabular>}
    </p>
  );
}
