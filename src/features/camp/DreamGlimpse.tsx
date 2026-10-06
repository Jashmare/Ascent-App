import { openSheet } from '../../app/router';
import type { Dream, Goal, ISODate } from '../../db/types';
import { dreamOfTheDay } from '../../lib/dreamOfTheDay';
import { seededRandom } from '../../lib/random';
import styles from './DreamGlimpse.module.css';

// A few static stars for the strip. Seeded, so they sit still in the same places.
const STARS = (() => {
  const random = seededRandom(64);
  return Array.from({ length: 16 }, () => ({
    x: Math.round(random() * 1000),
    y: Math.round(4 + random() * 56),
    r: Number((0.6 + random() * 0.9).toFixed(2)),
    opacity: Number((0.35 + random() * 0.5).toFixed(2)),
  }));
})();

/**
 * A slim strip of night sky at the top of Camp, showing one dream each day:
 * "Still reaching for …". Tap it to open that dream in the Sky.
 */
export function DreamGlimpse({
  dreams,
  goals,
  today,
}: {
  dreams: Dream[];
  goals: Goal[];
  today: ISODate;
}) {
  const dream = dreamOfTheDay(dreams, goals, today);
  return (
    <div className={styles.glimpse} data-altitude="sky" data-tour="glimpse">
      <svg
        className={styles.stars}
        viewBox="0 0 1000 64"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {STARS.map((star, i) => (
          <circle key={i} cx={star.x} cy={star.y} r={star.r} opacity={star.opacity} />
        ))}
      </svg>
      <div className={styles.inner}>
        {dream ? (
          <button
            type="button"
            className={styles.button}
            onClick={() => openSheet('sky', `dream:${dream.id}`)}
          >
            <span className={styles.lead}>Still reaching for</span>
            <span className={styles.title}>{dream.title}</span>
          </button>
        ) : (
          <button
            type="button"
            className={styles.button}
            onClick={() => openSheet('sky', 'new-dream')}
          >
            <span className={styles.lead}>Your sky is open</span>
            <span className={styles.title}>Add a dream — no deadline needed</span>
          </button>
        )}
      </div>
    </div>
  );
}
