import type { CSSProperties } from 'react';
import { cx } from '../../components/cx';
import type { SkyStar } from '../../lib/sky';
import { starStyle } from '../../lib/stars';
import styles from './Sky.module.css';

/** A four-point star. */
export const STAR_PATH = 'M12 0 L14.4 9.6 L24 12 L14.4 14.4 L12 24 L9.6 14.4 L0 12 L9.6 9.6 Z';

interface StarButtonProps {
  star: SkyStar;
  x: number;
  y: number;
  /** Which side of the star its label sits on. */
  labelSide: 'left' | 'right';
  /** Show the label at rest, not only on hover and focus. */
  labelResting: boolean;
  /** Ceremony state for the star being reached right now. */
  ceremony?: 'pending' | 'igniting';
  onOpen: () => void;
}

/**
 * Dream stars: 10–14px, pale, softly twinkling. Reached stars: 14–18px, gold, glowing.
 * Each is a real button; its label shows on hover and focus.
 */
export function StarButton({
  star,
  x,
  y,
  labelSide,
  labelResting,
  ceremony,
  onOpen,
}: StarButtonProps) {
  const { size, duration, delay } = starStyle(star.key);
  const px = star.reached ? 14 + size * 4 : 10 + size * 4;
  const style = {
    left: x,
    top: y,
    '--star-size': `${px.toFixed(1)}px`,
    '--twinkle-duration': `${duration.toFixed(2)}s`,
    '--twinkle-delay': `${delay.toFixed(2)}s`,
  } as CSSProperties;

  return (
    <button
      type="button"
      className={cx(
        styles.star,
        star.reached ? styles.gold : styles.pale,
        ceremony === 'pending' && styles.pending,
        ceremony === 'igniting' && styles.igniting,
      )}
      style={style}
      aria-label={star.ariaLabel}
      data-star-key={star.key}
      onClick={onOpen}
    >
      <svg className={styles.starShape} viewBox="0 0 24 24" aria-hidden="true">
        <path d={STAR_PATH} />
      </svg>
      <span
        className={cx(
          styles.starLabel,
          labelSide === 'left' && styles.starLabelLeft,
          labelResting && styles.starLabelResting,
        )}
        aria-hidden="true"
      >
        {star.title}
      </span>
    </button>
  );
}
