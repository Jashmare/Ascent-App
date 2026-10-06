import { useId } from 'react';
import { cx } from './cx';
import styles from './PeakGlyph.module.css';

const PEAK = 'M16 4.5 L29.5 27.5 L2.5 27.5 Z';
const BASE = 27.5;
const HEIGHT = 23;

/**
 * A peak whose snowline rises from the base to the progress level, in place of a progress
 * bar. Decorative: always pair it with the percentage in text.
 */
export function PeakGlyph({
  progress,
  size = 32,
  className,
}: {
  progress: number;
  size?: number;
  className?: string;
}) {
  const clipId = useId();
  const level = (Math.min(100, Math.max(0, progress)) / 100) * HEIGHT;
  return (
    <svg
      className={cx(styles.glyph, className)}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={PEAK} />
        </clipPath>
      </defs>
      {level > 0 && (
        <rect
          className={styles.fill}
          x="0"
          y={BASE - level}
          width="32"
          height={level}
          clipPath={`url(#${clipId})`}
        />
      )}
      <path className={styles.outline} d={PEAK} />
    </svg>
  );
}
