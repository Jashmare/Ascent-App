import { Check, Plus, Repeat } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { openSheet } from '../../app/router';
import { useAppSettings } from '../../app/settingsContext';
import { notify } from '../../app/toast';
import { Button } from '../../components/Button';
import { cx } from '../../components/cx';
import { FieldStack, SelectField, TextArea, TextField } from '../../components/Field';
import { Sheet } from '../../components/Sheet';
import { deleteObjective, updateObjective } from '../../db/objectives';
import { addTask } from '../../db/tasks';
import type { Goal, Horizon, ISODate, Objective, Task, TaskCompletion } from '../../db/types';
import { formatShortDate } from '../../lib/dates';
import { plural } from '../../lib/format';
import { horizonForDate } from '../../lib/objectives';
import { completionKey, completionKeys, isRoutine, repeatLabel } from '../../lib/recurrence';
import { markObjective } from './actions';
import { HorizonPicker } from './HorizonPicker';
import styles from './Ridge.module.css';

interface ObjectiveSheetProps {
  objective: Objective;
  goals: Goal[];
  tasks: Task[];
  completions: TaskCompletion[];
  today: ISODate;
  onClose: () => void;
}

export function ObjectiveSheet({
  objective,
  goals,
  tasks,
  completions,
  today,
  onClose,
}: ObjectiveSheetProps) {
  const { units, weekStartsOn } = useAppSettings();
  const formId = useId();
  const [title, setTitle] = useState(objective.title);
  const [notes, setNotes] = useState(objective.notes ?? '');
  const [horizon, setHorizon] = useState<Horizon>(objective.horizon);
  const [dueDate, setDueDate] = useState(objective.dueDate ?? '');
  const [goalId, setGoalId] = useState(objective.goalId ?? '');
  const [titleError, setTitleError] = useState<string>();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const done = objective.status === 'done';

  const linked = tasks.filter((t) => t.objectiveId === objective.id && !t.archived);
  const doneKeys = completionKeys(completions);
  const choices = goals.filter((g) => g.status === 'active' || g.id === objective.goalId);

  async function saveFields(): Promise<boolean> {
    if (!title.trim()) {
      setTitleError('Give the objective a name.');
      return false;
    }
    await updateObjective(objective.id, { title, notes, horizon, dueDate, goalId });
    return true;
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (await saveFields()) {
      onClose();
      notify('Saved');
    }
  }

  async function toggleDone() {
    if (!(await saveFields())) return;
    await markObjective(objective.id, !done, units);
    onClose();
  }

  const footer = confirmingDelete ? (
    <div className={styles.confirmRow}>
      <p className={styles.confirmText}>Delete this objective? Its linked tasks stay on Camp.</p>
      <Button
        variant="destructive"
        onClick={async () => {
          await deleteObjective(objective.id);
          onClose();
          notify('Deleted');
        }}
      >
        Delete objective
      </Button>
      <Button onClick={() => setConfirmingDelete(false)}>Keep it</Button>
    </div>
  ) : (
    <>
      <Button variant="primary" type="submit" form={formId}>
        Save changes
      </Button>
      <Button icon={done ? undefined : <Check />} onClick={toggleDone}>
        {done ? 'Reopen' : 'Mark as done'}
      </Button>
      <Button variant="destructive" onClick={() => setConfirmingDelete(true)}>
        Delete
      </Button>
    </>
  );

  return (
    <Sheet title={done ? 'Objective · done' : 'Objective'} onClose={onClose} footer={footer}>
      <form id={formId} onSubmit={save} noValidate>
        <FieldStack>
          <TextField
            label="Objective"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setTitleError(undefined);
            }}
            error={titleError}
            maxLength={200}
            autoComplete="off"
          />
          <TextArea
            label="Notes (optional)"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
          />
          <HorizonPicker value={horizon} onChange={setHorizon} />
          <TextField
            label="Due date (optional)"
            type="date"
            value={dueDate}
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
          >
            <option value="">No summit</option>
            {choices.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </SelectField>
        </FieldStack>
      </form>

      <section className={styles.linkedSection} aria-labelledby={`${formId}-tasks`}>
        <h3 id={`${formId}-tasks`} className={styles.subheading}>
          Linked tasks
        </h3>
        {linked.length === 0 ? (
          <p className={styles.muted}>No tasks linked yet. Add one for today below.</p>
        ) : (
          <ul className={styles.linkedList}>
            {linked.map((task) => (
              <li key={task.id}>
                <button
                  type="button"
                  className={styles.linkedTask}
                  onClick={() => openSheet('camp', `task:${task.id}`)}
                >
                  <span className={styles.linkedTitle}>{task.title}</span>
                  <span className={cx(styles.linkedStatus, 'tabular')}>
                    {isRoutine(task) ? (
                      <>
                        <Repeat aria-hidden="true" /> {repeatLabel(task.repeat, weekStartsOn)} ·{' '}
                        {plural(completions.filter((c) => c.taskId === task.id).length, 'time')}
                      </>
                    ) : task.date && doneKeys.has(completionKey(task.id, task.date)) ? (
                      'Done'
                    ) : task.date === today ? (
                      'Today'
                    ) : task.date ? (
                      `Planned ${formatShortDate(task.date, today)}`
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {!done && <AddLinkedTask objectiveId={objective.id} today={today} />}
      </section>
    </Sheet>
  );
}

function AddLinkedTask({ objectiveId, today }: { objectiveId: string; today: ISODate }) {
  const [title, setTitle] = useState('');
  const inputId = useId();

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    await addTask({ title, date: today, objectiveId });
    setTitle('');
    notify('Added to today');
  }

  return (
    <form className={styles.addLinked} onSubmit={submit}>
      <label htmlFor={inputId} className="visually-hidden">
        Add a task for today that links here
      </label>
      <input
        id={inputId}
        className={styles.addLinkedInput}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Add a task for today"
        autoComplete="off"
        maxLength={200}
      />
      <Button type="submit" icon={<Plus />} disabled={!title.trim()}>
        Add task
      </Button>
    </form>
  );
}
