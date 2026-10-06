import { cx } from '../../components/cx';
import { seededRandom } from '../../lib/random';
import styles from './SkyBackdrop.module.css';

// A faint, fixed field of tiny background stars. Decorative only, and separate from dream
// stars. Seeded so it looks the same on every visit.
const FIELD = (() => {
  const rand = seededRandom(20261005);
  return Array.from({ length: 110 }, () => ({
    x: Math.round(rand() * 1000),
    y: Math.round(rand() * 1000),
    r: Number((0.5 + rand() * 1.1).toFixed(2)),
    opacity: Number((0.2 + rand() * 0.5).toFixed(2)),
  }));
})();

/** The Sky's gradient, full bleed behind everything (nav included). Crossfades in and out. */
export function SkyBackdrop({ visible }: { visible: boolean }) {
  return (
    <div className={cx(styles.backdrop, visible && styles.visible)} aria-hidden="true">
      <svg className={styles.field} viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
        {FIELD.map((star, i) => (
          <circle key={i} cx={star.x} cy={star.y} r={star.r} opacity={star.opacity} />
        ))}
      </svg>
    </div>
  );
}
