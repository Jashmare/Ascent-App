import { ChoiceChips, ToggleChips } from '../../components/Chips';
import type { ISODate, Repeat } from '../../db/types';
import { weekday, WEEKDAY_NAMES, WEEKDAY_SHORT } from '../../lib/dates';
import styles from './Camp.module.css';

interface RepeatPickerProps {
  value: Repeat;
  onChange: (repeat: Repeat) => void;
  weekStartsOn: 0 | 1;
  today: ISODate;
  error?: string;
}

const KIND_OPTIONS: { value: Repeat['kind']; label: string }[] = [
  { value: 'none', label: 'Doesn’t repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'days', label: 'Chosen days' },
];

/** Repeat options: daily, weekdays, or chosen days of the week. */
export function RepeatPicker({ value, onChange, weekStartsOn, today, error }: RepeatPickerProps) {
  const orderedDays = Array.from({ length: 7 }, (_, i) => (i + weekStartsOn) % 7);
  return (
    <div className={styles.repeatPicker}>
      <ChoiceChips
        legend="Repeat"
        value={value.kind}
        options={KIND_OPTIONS}
        onChange={(kind) =>
          onChange(kind === 'days' ? { kind, days: [weekday(today)] } : ({ kind } as Repeat))
        }
      />
      {value.kind === 'days' && (
        <ToggleChips
          legend="On these days"
          even
          values={value.days}
          options={orderedDays.map((day) => ({
            value: day,
            label: WEEKDAY_SHORT[day],
            ariaLabel: WEEKDAY_NAMES[day],
          }))}
          onChange={(days) => onChange({ kind: 'days', days })}
        />
      )}
      {error && (
        <p className={styles.fieldError} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
