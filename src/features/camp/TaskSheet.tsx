import { ChevronDown, ChevronUp } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { announce, notify } from '../../app/toast';
import { Button } from '../../components/Button';
import { FieldStack, SelectField, TextField } from '../../components/Field';
import { Sheet } from '../../components/Sheet';
import { deleteTask, reorderTask, updateTask } from '../../db/tasks';
import type { ISODate, Objective, Repeat, Task } from '../../db/types';
import { repeatError } from '../../lib/recurrence';
import { RepeatPicker } from './RepeatPicker';
import styles from './Camp.module.css';

interface TaskSheetProps {
  task: Task;
  today: ISODate;
  /** Today's list, for moving the task up and down. */
  visible: Task[];
  objectives: Objective[];
  weekStartsOn: 0 | 1;
  onClose: () => void;
}

export function TaskSheet({
  task,
  today,
  visible,
  objectives,
  weekStartsOn,
  onClose,
}: TaskSheetProps) {
  const formId = useId();
  const [title, setTitle] = useState(task.title);
  const [repeat, setRepeat] = useState<Repeat>(task.repeat);
  const [objectiveId, setObjectiveId] = useState(task.objectiveId ?? '');
  const [titleError, setTitleError] = useState<string>();
  const [repeatProblem, setRepeatProblem] = useState<string>();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const index = visible.findIndex((t) => t.id === task.id);
  // Open objectives, plus the linked one if it has since been completed.
  const choices = objectives.filter((o) => o.status === 'open' || o.id === task.objectiveId);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setTitleError('Give the task a name.');
      return;
    }
    const problem = repeatError(repeat);
    if (problem) {
      setRepeatProblem(problem);
      return;
    }
    await updateTask(task.id, { title, repeat, objectiveId: objectiveId || null }, today);
    onClose();
    notify('Saved');
  }

  async function remove() {
    const result = await deleteTask(task.id);
    onClose();
    notify(
      result === 'archived' ? 'Deleted. The metres it earned stay in your altimeter.' : 'Deleted',
    );
  }

  async function move(delta: number) {
    const to = index + delta;
    if (to < 0 || to >= visible.length) return;
    await reorderTask(visible, index, to);
    announce(`Moved to position ${to + 1} of ${visible.length}`);
  }

  const footer = confirmingDelete ? (
    <div className={styles.confirmRow}>
      <p className={styles.confirmText}>Delete this task?</p>
      <Button variant="destructive" onClick={remove}>
        Delete task
      </Button>
      <Button onClick={() => setConfirmingDelete(false)}>Keep it</Button>
    </div>
  ) : (
    <>
      <Button variant="primary" type="submit" form={formId}>
        Save changes
      </Button>
      <Button variant="destructive" onClick={() => setConfirmingDelete(true)}>
        Delete task
      </Button>
    </>
  );

  return (
    <Sheet title="Edit task" onClose={onClose} footer={footer}>
      <form id={formId} onSubmit={save} noValidate>
        <FieldStack>
          <TextField
            label="Task"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setTitleError(undefined);
            }}
            error={titleError}
            maxLength={200}
            autoComplete="off"
          />
          <SelectField
            label="Link to objective"
            value={objectiveId}
            onChange={(event) => setObjectiveId(event.target.value)}
          >
            <option value="">No objective</option>
            {choices.map((objective) => (
              <option key={objective.id} value={objective.id}>
                {objective.title}
              </option>
            ))}
          </SelectField>
          <RepeatPicker
            value={repeat}
            onChange={(next) => {
              setRepeat(next);
              setRepeatProblem(undefined);
            }}
            weekStartsOn={weekStartsOn}
            today={today}
            error={repeatProblem}
          />
          {index >= 0 && visible.length > 1 && (
            <div className={styles.orderControls}>
              <p className={styles.orderLabel}>
                Position {index + 1} of {visible.length} today
              </p>
              <div className={styles.orderButtons}>
                <Button icon={<ChevronUp />} disabled={index === 0} onClick={() => move(-1)}>
                  Move up
                </Button>
                <Button
                  icon={<ChevronDown />}
                  disabled={index === visible.length - 1}
                  onClick={() => move(1)}
                >
                  Move down
                </Button>
              </div>
            </div>
          )}
        </FieldStack>
      </form>
    </Sheet>
  );
}
