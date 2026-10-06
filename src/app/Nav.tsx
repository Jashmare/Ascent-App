import type { CSSProperties } from 'react';
import { cx } from '../components/cx';
import { ALTITUDE_META } from './altitudes';
import { ALTITUDES, type Altitude } from './router';
import styles from './Nav.module.css';

interface NavProps {
  /** The altitude being viewed, or null on screens outside the climb (settings, guide). */
  current: Altitude | null;
}

/**
 * Four stops in climbing order. A bottom bar on mobile; on desktop, an altitude rail like an
 * altimeter, Camp at the bottom and Sky at the top, with the climbed part of the line lit.
 */
export function Nav({ current }: NavProps) {
  const level = current ? ALTITUDE_META[current].level : -1;
  const style = { '--climbed': Math.max(level, 0) / (ALTITUDES.length - 1) } as CSSProperties;

  return (
    <nav className={styles.nav} aria-label="Altitudes" data-tour="nav">
      <ol className={cx(styles.list, level < 0 && styles.offClimb)} style={style}>
        {ALTITUDES.map((altitude) => {
          const meta = ALTITUDE_META[altitude];
          const Icon = meta.icon;
          const isCurrent = altitude === current;
          return (
            <li key={altitude} className={styles.item}>
              <a
                href={`#/${altitude}`}
                className={cx(styles.link, isCurrent && styles.current)}
                aria-current={isCurrent ? 'page' : undefined}
              >
                <span className={styles.tick} aria-hidden="true" />
                <Icon className={styles.icon} aria-hidden="true" />
                <span className={styles.label}>{meta.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
