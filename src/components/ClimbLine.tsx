import { pointAlong, TRAIL_VIEWBOX, trailPath } from '../lib/climb';
import styles from './ClimbLine.module.css';

const PATH = trailPath();

/**
 * Today's progress as a trail rising left to right. The walked part is drawn in the
 * altitude's strong accent, the rest in the line colour, with a dot where you are.
 * Decorative: the caller always puts the text equivalent ("3 of 5 done") next to it.
 */
export function ClimbLine({ progress }: { progress: number }) {
  const t = Math.min(1, Math.max(0, progress));
  const [x, y] = pointAlong(t);
  return (
    <svg
      className={styles.svg}
      viewBox={`0 0 ${TRAIL_VIEWBOX.width} ${TRAIL_VIEWBOX.height}`}
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATH} className={styles.rest} pathLength={1} />
      {t > 0 && (
        <path
          d={PATH}
          className={styles.walked}
          pathLength={1}
          style={{ strokeDasharray: `${t} 1` }}
        />
      )}
      <circle cx={x} cy={y} r={5.5} className={styles.dot} />
    </svg>
  );
}
