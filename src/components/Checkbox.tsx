import type { ReactNode } from 'react';
import { cx } from './cx';
import styles from './Checkbox.module.css';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** The visible label. The whole row is the hit target. */
  children: ReactNode;
  className?: string;
  /** Something that floats up from the box when checked (the "+10 m"). */
  overlay?: ReactNode;
  disabled?: boolean;
}

/**
 * The task checkbox: 24px, radius 8px, a 1.5px soft-ink border. Checked, it fills with the
 * altitude's accent and the check mark draws in. A native checkbox underneath keeps it
 * keyboard and screen reader friendly.
 */
export function Checkbox({
  checked,
  onChange,
  children,
  className,
  overlay,
  disabled,
}: CheckboxProps) {
  return (
    <label className={cx(styles.row, disabled && styles.disabled, className)}>
      <input
        type="checkbox"
        className={styles.input}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={styles.box} aria-hidden="true">
        <svg viewBox="0 0 24 24" className={styles.svg}>
          <path className={styles.mark} d="M6.5 12.5l3.6 3.6 7.4-8" pathLength={1} />
        </svg>
        {overlay}
      </span>
      <span className={styles.label}>{children}</span>
    </label>
  );
}
