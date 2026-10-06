import { CornerDownLeft, Plus, SlidersHorizontal } from 'lucide-react';
import { useId, useRef, useState, type FormEvent } from 'react';
import { IconButton } from '../../components/Button';
import { cx } from '../../components/cx';
import { SelectField } from '../../components/Field';
import { addTask } from '../../db/tasks';
import type { ISODate, Objective, Repeat } from '../../db/types';
import { repeatError, repeatLabel } from '../../lib/recurrence';
import { RepeatPicker } from './RepeatPicker';
import styles from './Camp.module.css';

interface QuickAddProps {
  today: ISODate;
  openObjectives: Objective[];
  weekStartsOn: 0 | 1;
}

/** The first row of the task panel: type, press Enter. Extras tuck away behind a toggle. */
export function QuickAdd({ today, openObjectives, weekStartsOn }: QuickAddProps) {
  const [title, setTitle] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [repeat, setRepeat] = useState<Repeat>({ kind: 'none' });
  const [objectiveId, setObjectiveId] = useState('');
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const extrasId = useId();

  const linked = openObjectives.find((o) => o.id === objectiveId);
  const summary = [repeatLabel(repeat, weekStartsOn), linked?.title].filter(Boolean).join(' · ');

  async function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const problem = repeatError(repeat);
    if (problem) {
      setExpanded(true);
      setError(problem);
      return;
    }
    await addTask({ title: trimmed, date: today, repeat, objectiveId: objectiveId || undefined });
    setTitle('');
    setRepeat({ kind: 'none' });
    setObjectiveId('');
    setError(undefined);
    inputRef.current?.focus();
  }

  return (
    <form className={styles.quickAdd} onSubmit={submit} data-tour="quick-add">
      <div className={styles.quickRow}>
        <Plus className={styles.quickIcon} aria-hidden="true" />
        <label htmlFor={inputId} className="visually-hidden">
          Add a task for today
        </label>
        <input
          ref={inputRef}
          id={inputId}
          className={styles.quickInput}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Add a task for today"
          autoComplete="off"
          enterKeyHint="done"
          maxLength={200}
        />
        <IconButton
          label={expanded ? 'Hide task options' : 'Task options'}
          icon={<SlidersHorizontal />}
          aria-expanded={expanded}
          aria-controls={extrasId}
          className={cx(expanded && styles.toggleOn)}
          onClick={() => setExpanded((open) => !open)}
        />
        <IconButton
          type="submit"
          label="Add task"
          icon={<CornerDownLeft />}
          disabled={!title.trim()}
        />
      </div>
      {!expanded && summary && <p className={styles.quickSummary}>{summary}</p>}
      <div id={extrasId} className={styles.extras} hidden={!expanded}>
        <SelectField
          label="Link to objective"
          value={objectiveId}
          onChange={(event) => setObjectiveId(event.target.value)}
          hint={
            openObjectives.length === 0 ? 'Objectives you add on the Ridge appear here.' : undefined
          }
        >
          <option value="">No objective</option>
          {openObjectives.map((objective) => (
            <option key={objective.id} value={objective.id}>
              {objective.title}
            </option>
          ))}
        </SelectField>
        <RepeatPicker
          value={repeat}
          onChange={(next) => {
            setRepeat(next);
            setError(undefined);
          }}
          weekStartsOn={weekStartsOn}
          today={today}
          error={error}
        />
      </div>
    </form>
  );
}
