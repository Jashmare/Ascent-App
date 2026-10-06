import { openSheet } from '../../app/router';
import { Button } from '../../components/Button';
import { PeakGlyph } from '../../components/PeakGlyph';
import type { Dream, Goal } from '../../db/types';
import { nextMilestone } from '../../lib/progress';
import { requestReach } from '../sky/reach';
import styles from './Summit.module.css';

interface SummitRowProps {
  goal: Goal;
  progress: number;
  dream?: Dream;
}

export function SummitRow({ goal, progress, dream }: SummitRowProps) {
  const next = nextMilestone(goal);
  return (
    <li className={styles.row}>
      <button
        type="button"
        className={styles.main}
        onClick={() => openSheet('summit', `summit:${goal.id}`)}
      >
        <PeakGlyph progress={progress} className={styles.glyph} />
        <span className={styles.text}>
          <span className={styles.title}>{goal.title}</span>
          {next && <span className={styles.next}>Next: {next.title}</span>}
        </span>
        <span className={styles.percent}>
          <span className="tabular">{progress}%</span>
          <span className="visually-hidden"> climbed</span>
        </span>
      </button>
      {dream && (
        <button
          type="button"
          className={styles.leads}
          onClick={() => openSheet('sky', `dream:${dream.id}`)}
        >
          Leads toward: {dream.title}
        </button>
      )}
      {progress === 100 && (
        <div className={styles.reachRow}>
          <Button
            variant="primary"
            onClick={() => requestReach({ kind: 'summit', id: goal.id, title: goal.title })}
          >
            Reach the summit
          </Button>
        </div>
      )}
    </li>
  );
}
