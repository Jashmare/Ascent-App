import { Plus, X } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { openSheet } from '../../app/router';
import { useAppSettings } from '../../app/settingsContext';
import { notify } from '../../app/toast';
import { useAutosave } from '../../app/useAutosave';
import { Button, IconButton } from '../../components/Button';
import { Checkbox } from '../../components/Checkbox';
import { ChoiceChips } from '../../components/Chips';
import { cx } from '../../components/cx';
import { FieldRow, FieldStack, SelectField, TextArea, TextField } from '../../components/Field';
import { Menu } from '../../components/Menu';
import { PeakGlyph } from '../../components/PeakGlyph';
import { Sheet } from '../../components/Sheet';
import { linkSummitToDream } from '../../db/dreams';
import {
  addMilestone,
  deleteGoal,
  removeMilestone,
  setManualProgress,
  setMilestoneDone,
  setProgressMode,
  updateGoal,
} from '../../db/goals';
import { addObjective } from '../../db/objectives';
import type { Dream, Goal, ISODate, Objective } from '../../db/types';
import { ALTITUDE_GAIN, formatGain } from '../../lib/altimeter';
import { formatMonthYear } from '../../lib/dates';
import { dueLabel, HORIZON_LABELS } from '../../lib/objectives';
import { goalProgress, linkedObjectives, usesManualProgress } from '../../lib/progress';
import { requestReach } from '../sky/reach';
import styles from './Summit.module.css';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface SummitSheetProps {
  goal: Goal;
  objectives: Objective[];
  dreams: Dream[];
  today: ISODate;
  onClose: () => void;
}

/** A summit's sheet. Changes save as you go; milestones count the moment they're checked. */
export function SummitSheet({ goal, objectives, dreams, today, onClose }: SummitSheetProps) {
  const { units } = useAppSettings();
  const ids = useId();
  const [title, setTitle] = useState(goal.title);
  const [why, setWhy] = useState(goal.why ?? '');
  const [manualValue, setManualValue] = useState(goal.manualProgress);
  const [month, setMonth] = useState(goal.targetMonth?.slice(5, 7) ?? '');
  const [year, setYear] = useState(goal.targetMonth?.slice(0, 4) ?? '');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useAutosave(title, (value) => void updateGoal(goal.id, { title: value }));
  useAutosave(why, (value) => void updateGoal(goal.id, { why: value }));
  useAutosave(manualValue, (value) => void setManualProgress(goal.id, value), 150);

  const linked = linkedObjectives(goal, objectives);
  const counted = goal.milestones.length + linked.length;
  const manual = usesManualProgress(goal, objectives);
  const progress = manual ? manualValue : goalProgress(goal, objectives);
  const doneCount =
    goal.milestones.filter((m) => m.doneAt != null).length +
    linked.filter((o) => o.status === 'done').length;
  const dreamChoices = dreams.filter((d) => d.status === 'dreaming' || d.id === goal.dreamId);
  const thisYear = Number(today.slice(0, 4));
  const years = Array.from({ length: 16 }, (_, i) => String(thisYear + i));
  if (year && !years.includes(year)) years.unshift(year);

  function setTarget(nextMonth: string, nextYear: string) {
    setMonth(nextMonth);
    setYear(nextYear);
    if (nextMonth && nextYear)
      void updateGoal(goal.id, { targetMonth: `${nextYear}-${nextMonth}` });
    else if (!nextMonth && !nextYear) void updateGoal(goal.id, { targetMonth: '' });
  }

  async function toggleMilestone(milestoneId: string, done: boolean) {
    await setMilestoneDone(goal.id, milestoneId, done);
    if (done) notify(`Milestone done. ${formatGain(ALTITUDE_GAIN.milestone, units)}`);
  }

  const reach = () => requestReach({ kind: 'summit', id: goal.id, title: goal.title });

  const footer = confirmingDelete ? (
    <div className={styles.confirmRow}>
      <p className={styles.confirmText}>
        Delete this summit and its milestones? Linked objectives stay on the ridge.
      </p>
      <Button
        variant="destructive"
        onClick={async () => {
          await deleteGoal(goal.id);
          onClose();
          notify('Deleted');
        }}
      >
        Delete summit
      </Button>
      <Button onClick={() => setConfirmingDelete(false)}>Keep it</Button>
    </div>
  ) : (
    <>
      {progress === 100 && (
        <Button variant="primary" onClick={reach}>
          Reach the summit
        </Button>
      )}
      <Button onClick={onClose}>Done</Button>
      <span className={styles.footerSpacer} />
      <Menu
        label="More summit actions"
        items={[
          { label: 'Mark as reached', onSelect: reach },
          { label: 'Delete summit', destructive: true, onSelect: () => setConfirmingDelete(true) },
        ]}
      />
    </>
  );

  return (
    <Sheet title={goal.title} onClose={onClose} footer={footer}>
      <section className={styles.progressBlock} aria-labelledby={`${ids}-progress`}>
        <PeakGlyph progress={progress} size={64} />
        <div>
          <h3 id={`${ids}-progress`} className={styles.bigPercent}>
            <span className="tabular">{progress}%</span>
            <span className="visually-hidden"> climbed</span>
          </h3>
          <p className={styles.muted}>
            {manual ? 'Set by hand' : `${doneCount} of ${counted} milestones and objectives done`}
          </p>
          {goal.targetMonth && (
            <p className={styles.muted}>Aiming for {formatMonthYear(goal.targetMonth)}</p>
          )}
        </div>
      </section>

      {counted > 0 ? (
        <ChoiceChips
          legend="Progress"
          value={goal.progressMode}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'manual', label: 'Manual' },
          ]}
          onChange={(mode) => void setProgressMode(goal.id, mode)}
        />
      ) : (
        <p className={styles.note}>
          Add milestones or link objectives to track progress automatically. Until then, set it by
          hand.
        </p>
      )}

      {manual && (
        <div className={styles.slider}>
          <label htmlFor={`${ids}-slider`} className={styles.sliderLabel}>
            Progress <span className="tabular">{manualValue}%</span>
          </label>
          <input
            id={`${ids}-slider`}
            type="range"
            min={0}
            max={100}
            step={5}
            value={manualValue}
            aria-valuetext={`${manualValue}%`}
            onChange={(event) => setManualValue(Number(event.target.value))}
          />
        </div>
      )}

      <section className={styles.section} aria-labelledby={`${ids}-milestones`}>
        <h3 id={`${ids}-milestones`} className={styles.subheading}>
          Milestones
        </h3>
        {goal.milestones.length > 0 && (
          <ul className={styles.milestones}>
            {goal.milestones.map((milestone) => (
              <li
                key={milestone.id}
                className={styles.milestone}
                data-done={milestone.doneAt ? '' : undefined}
              >
                <Checkbox
                  checked={milestone.doneAt != null}
                  onChange={(checked) => toggleMilestone(milestone.id, checked)}
                >
                  {milestone.title}
                </Checkbox>
                <IconButton
                  label={`Remove “${milestone.title}”`}
                  icon={<X />}
                  onClick={() => removeMilestone(goal.id, milestone.id)}
                />
              </li>
            ))}
          </ul>
        )}
        <InlineAdd
          label="Add a milestone"
          button="Add milestone"
          onAdd={(text) => addMilestone(goal.id, text)}
        />
      </section>

      <section className={styles.section} aria-labelledby={`${ids}-objectives`}>
        <h3 id={`${ids}-objectives`} className={styles.subheading}>
          Objectives on the ridge
        </h3>
        {linked.length === 0 ? (
          <p className={styles.muted}>None linked yet.</p>
        ) : (
          <ul className={styles.linkedList}>
            {linked.map((objective) => {
              const status =
                objective.status === 'done'
                  ? 'Done'
                  : objective.dueDate
                    ? dueLabel(objective.dueDate, today).text
                    : HORIZON_LABELS[objective.horizon];
              return (
                <li key={objective.id}>
                  <button
                    type="button"
                    className={styles.linkedItem}
                    onClick={() => openSheet('ridge', `objective:${objective.id}`)}
                  >
                    <span className={cx(objective.status === 'done' && styles.struck)}>
                      {objective.title}
                    </span>
                    <span className={cx(styles.muted, 'tabular')}>{status}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <InlineAdd
          label="Add an objective for this summit"
          button="Add objective"
          onAdd={async (text) => {
            await addObjective({ title: text, horizon: 'month', goalId: goal.id });
            notify('Added to the ridge');
          }}
        />
      </section>

      <section className={styles.section} aria-labelledby={`${ids}-about`}>
        <h3 id={`${ids}-about`} className={styles.subheading}>
          About this summit
        </h3>
        <FieldStack>
          <TextField
            label="Summit"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            autoComplete="off"
          />
          <TextArea
            label="Why it matters"
            serif
            rows={3}
            value={why}
            onChange={(event) => setWhy(event.target.value)}
          />
          <FieldRow>
            <SelectField
              label="Target month"
              value={month}
              onChange={(event) => {
                const nextMonth = event.target.value;
                // Picking a month first fills in its next occurrence.
                const nextYear =
                  year ||
                  (nextMonth
                    ? String(
                        Number(nextMonth) < Number(today.slice(5, 7)) ? thisYear + 1 : thisYear,
                      )
                    : '');
                setTarget(nextMonth, nextYear);
              }}
            >
              <option value="">None</option>
              {MONTHS.map((name, i) => (
                <option key={name} value={String(i + 1).padStart(2, '0')}>
                  {name}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Target year"
              value={year}
              onChange={(event) => setTarget(month, event.target.value)}
            >
              <option value="">None</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </SelectField>
          </FieldRow>
          {Boolean(month) !== Boolean(year) && (
            <p className={styles.note}>Pick a month and a year, or clear both.</p>
          )}
          <SelectField
            label="Leads toward"
            value={goal.dreamId ?? ''}
            onChange={(event) => void linkSummitToDream(goal.id, event.target.value)}
            hint={dreamChoices.length === 0 ? 'Dreams you add in the Sky appear here.' : undefined}
          >
            <option value="">No dream yet</option>
            {dreamChoices.map((dream) => (
              <option key={dream.id} value={dream.id}>
                {dream.title}
              </option>
            ))}
          </SelectField>
        </FieldStack>
      </section>
    </Sheet>
  );
}

function InlineAdd({
  label,
  button,
  onAdd,
}: {
  label: string;
  button: string;
  onAdd: (text: string) => Promise<void> | void;
}) {
  const [text, setText] = useState('');
  const inputId = useId();
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    await onAdd(text.trim());
    setText('');
  }
  return (
    <form className={styles.inlineAdd} onSubmit={submit}>
      <label htmlFor={inputId} className="visually-hidden">
        {label}
      </label>
      <input
        id={inputId}
        className={styles.inlineInput}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={label}
        autoComplete="off"
        maxLength={200}
      />
      <Button type="submit" icon={<Plus />} disabled={!text.trim()}>
        <span className="visually-hidden">{button}</span>
        <span aria-hidden="true">Add</span>
      </Button>
    </form>
  );
}
