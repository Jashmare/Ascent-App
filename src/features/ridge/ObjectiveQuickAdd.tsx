import { CornerDownLeft, Plus, SlidersHorizontal } from 'lucide-react';
import { useId, useRef, useState, type FormEvent } from 'react';
import { notify } from '../../app/toast';
import { IconButton } from '../../components/Button';
import { cx } from '../../components/cx';
import { SelectField, TextField } from '../../components/Field';
import { addObjective } from '../../db/objectives';
import type { Goal, Horizon, ISODate } from '../../db/types';
import { formatShortDate } from '../../lib/dates';
import { HORIZON_LABELS, horizonForDate } from '../../lib/objectives';
import { HorizonPicker } from './HorizonPicker';
import styles from './Ridge.module.css';

interface ObjectiveQuickAddProps {
  today: ISODate;
  weekStartsOn: 0 | 1;
  activeGoals: Goal[];
}

/** "Add an objective" + Enter. Options: horizon (this month by default), due date, summit. */
export function ObjectiveQuickAdd({ today, weekStartsOn, activeGoals }: ObjectiveQuickAddProps) {
  const [title, setTitle] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [horizon, setHorizon] = useState<Horizon>('month');
  const [dueDate, setDueDate] = useState('');
  const [goalId, setGoalId] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const extrasId = useId();

  const goal = activeGoals.find((g) => g.id === goalId);
  const summary = [
    HORIZON_LABELS[horizon],
    dueDate && `due ${formatShortDate(dueDate, today)}`,
    goal?.title,
  ]
    .filter(Boolean)
    .join(' · ');

  async function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    await addObjective({
      title: trimmed,
      horizon,
      dueDate: dueDate || undefined,
      goalId: goalId || undefined,
    });
    notify('Added to the ridge');
    setTitle('');
    setDueDate('');
    setGoalId('');
    setHorizon('month');
    inputRef.current?.focus();
  }

  return (
    <form className={styles.quickAdd} onSubmit={submit} data-tour="ridge-add">
      <div className={styles.quickRow}>
        <Plus className={styles.quickIcon} aria-hidden="true" />
        <label htmlFor={inputId} className="visually-hidden">
          Add an objective
        </label>
        <input
          ref={inputRef}
          id={inputId}
          className={styles.quickInput}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add an objective"
          autoComplete="off"
          enterKeyHint="done"
          maxLength={200}
        />
        <IconButton
          label={expanded ? 'Hide objective options' : 'Objective options'}
          icon={<SlidersHorizontal />}
          aria-expanded={expanded}
          aria-controls={extrasId}
          className={cx(expanded && styles.toggleOn)}
          onClick={() => setExpanded((open) => !open)}
        />
        <IconButton
          type="submit"
          label="Add objective"
          icon={<CornerDownLeft />}
          disabled={!title.trim()}
        />
      </div>
      {!expanded && title.trim() && <p className={styles.quickSummary}>{summary}</p>}
      <div id={extrasId} className={styles.extras} hidden={!expanded}>
        <HorizonPicker value={horizon} onChange={setHorizon} />
        <TextField
          label="Due date (optional)"
          type="date"
          value={dueDate}
          min={today}
          onChange={(event) => {
            setDueDate(event.target.value);
            if (event.target.value) {
              setHorizon(horizonForDate(event.target.value, today, weekStartsOn));
            }
          }}
        />
        <SelectField
          label="Linked summit (optional)"
          value={goalId}
          onChange={(event) => setGoalId(event.target.value)}
          hint={activeGoals.length === 0 ? 'Summits you add appear here.' : undefined}
        >
          <option value="">No summit</option>
          {activeGoals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </SelectField>
      </div>
    </form>
  );
}
