import { useId, type ReactNode } from 'react';
import { cx } from './cx';
import styles from './Chips.module.css';

interface Option<T extends string | number> {
  value: T;
  label: ReactNode;
  /** Full name for assistive tech when the visible label is abbreviated. */
  ariaLabel?: string;
}

interface ChoiceChipsProps<T extends string> {
  legend: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  hideLegend?: boolean;
}

/** A single choice shown as pills. Native radio buttons underneath, so arrow keys work. */
export function ChoiceChips<T extends string>({
  legend,
  value,
  options,
  onChange,
  hideLegend,
}: ChoiceChipsProps<T>) {
  const name = useId();
  return (
    <fieldset className={styles.fieldset}>
      <legend className={cx(styles.legend, hideLegend && 'visually-hidden')}>{legend}</legend>
      <div className={styles.chips}>
        {options.map((option) => (
          <label key={option.value} className={styles.chip}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className={styles.input}
              aria-label={option.ariaLabel}
            />
            <span className={styles.face}>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

interface ToggleChipsProps<T extends number | string> {
  legend: string;
  values: T[];
  options: Option<T>[];
  onChange: (values: T[]) => void;
  hideLegend?: boolean;
  /** Spread the chips evenly across the width (used for days of the week). */
  even?: boolean;
}

/** Any number of choices shown as pills. Native checkboxes underneath. */
export function ToggleChips<T extends number | string>({
  legend,
  values,
  options,
  onChange,
  hideLegend,
  even,
}: ToggleChipsProps<T>) {
  return (
    <fieldset className={styles.fieldset}>
      <legend className={cx(styles.legend, hideLegend && 'visually-hidden')}>{legend}</legend>
      <div className={cx(styles.chips, even && styles.even)}>
        {options.map((option) => {
          const checked = values.includes(option.value);
          return (
            <label key={String(option.value)} className={styles.chip}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() =>
                  onChange(
                    checked ? values.filter((v) => v !== option.value) : [...values, option.value],
                  )
                }
                className={styles.input}
                aria-label={option.ariaLabel}
              />
              <span className={styles.face}>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
