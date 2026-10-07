import { ArrowLeft, ArrowRight, Check, CornerDownLeft } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { navigate, openSheet } from '../../app/router';
import { useAppSettings } from '../../app/settingsContext';
import { notify } from '../../app/toast';
import { useToday } from '../../app/useToday';
import { AltitudeHeader } from '../../components/AltitudeHeader';
import { Button, IconButton } from '../../components/Button';
import { Checkbox } from '../../components/Checkbox';
import { cx } from '../../components/cx';
import { Page, Panel } from '../../components/Page';
import { PeakGlyph } from '../../components/PeakGlyph';
import { Tabular } from '../../components/Tabular';
import { setManualProgress, setMilestoneDone } from '../../db/goals';
import { useCompletions, useDreams, useGoals, useObjectives } from '../../db/hooks';
import { addObjective } from '../../db/objectives';
import { setSetting } from '../../db/settings';
import type { Dream, Goal, ISODate, Objective, TaskCompletion } from '../../db/types';
import { altimeter, altitudeRecords, formatAltitude } from '../../lib/altimeter';
import { endOfWeek, startOfWeek, timestampToISODate } from '../../lib/dates';
import { dreamOfTheDay } from '../../lib/dreamOfTheDay';
import { plural } from '../../lib/format';
import { dueLabel } from '../../lib/objectives';
import { goalProgress, usesManualProgress } from '../../lib/progress';
import { markObjective } from '../ridge/actions';
import styles from './WeeklyReview.module.css';

const STEPS = [
  'What got done on the ridge',
  'Update summit progress',
  'Revisit one dream',
  'Set next week’s objectives',
];

/**
 * The weekly review (docs/PRODUCT.md §8): a guided look at the week from the ridge.
 * Check what got done, update summit progress, revisit one dream, set next week's objectives.
 */
export function WeeklyReviewScreen() {
  const today = useToday();
  const { weekStartsOn } = useAppSettings();
  const objectives = useObjectives();
  const goals = useGoals();
  const dreams = useDreams();
  const completions = useCompletions();
  const [step, setStep] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstStep = useRef(true);

  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    headingRef.current?.focus();
    window.scrollTo(0, 0);
  }, [step]);

  async function finish() {
    await setSetting('lastReviewDate', today);
    navigate({ screen: 'camp' });
    notify('Review done. Have a good week.');
  }

  const loaded = objectives && goals && dreams && completions;

  return (
    <Page>
      <AltitudeHeader title="Weekly review" showAltimeter={false} back>
        <p>Time to look at the week from the ridge.</p>
      </AltitudeHeader>

      {loaded && (
        <section className={styles.step} aria-labelledby="review-step">
          <p className={styles.count}>
            Step {step + 1} of {STEPS.length}
          </p>
          <h2 id="review-step" ref={headingRef} tabIndex={-1} className={styles.heading}>
            {STEPS[step]}
          </h2>

          {step === 0 && (
            <RidgeStep
              objectives={objectives}
              goals={goals}
              completions={completions}
              today={today}
              weekStartsOn={weekStartsOn}
            />
          )}
          {step === 1 && <SummitStep goals={goals} objectives={objectives} />}
          {step === 2 && <DreamStep dream={dreamOfTheDay(dreams, goals, today)} />}
          {step === 3 && <NextWeekStep objectives={objectives} today={today} />}

          <div className={styles.nav}>
            {step > 0 && (
              <Button icon={<ArrowLeft />} onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button variant="primary" onClick={() => setStep(step + 1)}>
                Next
                <ArrowRight aria-hidden="true" />
              </Button>
            ) : (
              <Button variant="primary" icon={<Check />} onClick={finish}>
                Finish the review
              </Button>
            )}
          </div>
        </section>
      )}
    </Page>
  );
}

function RidgeStep({
  objectives,
  goals,
  completions,
  today,
  weekStartsOn,
}: {
  objectives: Objective[];
  goals: Goal[];
  completions: TaskCompletion[];
  today: ISODate;
  weekStartsOn: 0 | 1;
}) {
  const { units } = useAppSettings();
  const weekStart = startOfWeek(today, weekStartsOn);
  const weekEnd = endOfWeek(today, weekStartsOn);
  const inWeek = (date: ISODate) => date >= weekStart && date <= today;

  const tasksDone = completions.filter((c) => inWeek(c.date)).length;
  const climbed = altimeter(
    altitudeRecords(completions, objectives, goals).filter((r) => inWeek(r.date)),
    today,
  ).total;
  const finished = objectives.filter(
    (o) => o.status === 'done' && o.doneAt != null && inWeek(timestampToISODate(o.doneAt)),
  );
  const pending = objectives.filter(
    (o) => o.status === 'open' && o.dueDate != null && o.dueDate <= weekEnd,
  );

  return (
    <div className={styles.body}>
      <p className={styles.lead}>
        This week you checked off <Tabular>{plural(tasksDone, 'task')}</Tabular> and climbed{' '}
        <Tabular>{formatAltitude(climbed, units)}</Tabular>.
      </p>

      {finished.length > 0 ? (
        <Panel className={styles.panel}>
          <h3 className={styles.subheading}>Done this week</h3>
          <ul className={styles.doneList}>
            {finished.map((o) => (
              <li key={o.id}>
                <Check aria-hidden="true" />
                {o.title}
              </li>
            ))}
          </ul>
        </Panel>
      ) : (
        <p className={styles.note}>
          Nothing finished on the ridge this week. That’s all right: every review is a fresh start.
        </p>
      )}

      {pending.length > 0 && (
        <Panel className={styles.panel}>
          <h3 className={styles.subheading}>Due this week</h3>
          <ul>
            {pending.map((o) => {
              const due = dueLabel(o.dueDate!, today);
              return (
                <li key={o.id} className={styles.checkRow}>
                  <Checkbox checked={false} onChange={() => markObjective(o.id, true, units)}>
                    {o.title}{' '}
                    <span className={cx(styles.due, due.overdue && styles.overdue)}>
                      {due.text}
                    </span>
                  </Checkbox>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </div>
  );
}

function SummitStep({ goals, objectives }: { goals: Goal[]; objectives: Objective[] }) {
  const active = goals.filter((g) => g.status === 'active');
  if (active.length === 0) {
    return (
      <p className={styles.note}>
        No summits yet. When you have something worth a year of climbing, add it on the Summit.
      </p>
    );
  }
  return (
    <div className={styles.body}>
      {active.map((goal) => (
        <SummitProgress key={goal.id} goal={goal} objectives={objectives} />
      ))}
    </div>
  );
}

function SummitProgress({ goal, objectives }: { goal: Goal; objectives: Objective[] }) {
  const sliderId = useId();
  const manual = usesManualProgress(goal, objectives);
  const progress = goalProgress(goal, objectives);
  return (
    <Panel className={styles.panel}>
      <div className={styles.summitHead}>
        <PeakGlyph progress={progress} />
        <button
          type="button"
          className={styles.summitTitle}
          onClick={() => openSheet('summit', `summit:${goal.id}`)}
        >
          {goal.title}
        </button>
        <span className={cx(styles.percent, 'tabular')}>{progress}%</span>
      </div>
      {manual ? (
        <div className={styles.slider}>
          <label htmlFor={sliderId}>How far along is it?</label>
          <input
            id={sliderId}
            type="range"
            min={0}
            max={100}
            step={5}
            value={goal.manualProgress}
            aria-valuetext={`${goal.manualProgress}%`}
            onChange={(event) => void setManualProgress(goal.id, Number(event.target.value))}
          />
        </div>
      ) : goal.milestones.length > 0 ? (
        <ul>
          {goal.milestones.map((m) => (
            <li key={m.id}>
              <Checkbox
                checked={m.doneAt != null}
                onChange={(checked) => void setMilestoneDone(goal.id, m.id, checked)}
              >
                {m.title}
              </Checkbox>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.note}>Its progress follows the objectives linked to it.</p>
      )}
    </Panel>
  );
}

function DreamStep({ dream }: { dream?: Dream }) {
  if (!dream) {
    return (
      <p className={styles.note}>
        Your sky is open. Add a dream whenever one comes to you — no deadline needed.
      </p>
    );
  }
  return (
    <div className={styles.dream} data-altitude="sky">
      <p className={styles.dreamLead}>Still reaching for</p>
      <p className={styles.dreamTitle}>{dream.title}</p>
      {dream.why && <p className={styles.dreamText}>{dream.why}</p>}
      {dream.vision && <p className={cx(styles.dreamText, styles.vision)}>{dream.vision}</p>}
      <div>
        <Button variant="ghost" onClick={() => openSheet('sky', `dream:${dream.id}`)}>
          Open in your sky
        </Button>
      </div>
    </div>
  );
}

function NextWeekStep({ objectives, today }: { objectives: Objective[]; today: ISODate }) {
  const [title, setTitle] = useState('');
  const inputId = useId();
  const forWeek = objectives.filter((o) => o.status === 'open' && o.horizon === 'week');

  async function add(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    await addObjective({ title, horizon: 'week' });
    setTitle('');
  }

  return (
    <div className={styles.body}>
      <p className={styles.note}>What do you want done by the end of next week?</p>
      <Panel>
        <form className={styles.addRow} onSubmit={add}>
          <label htmlFor={inputId} className="visually-hidden">
            Add an objective for next week
          </label>
          <input
            id={inputId}
            className={styles.addInput}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Add an objective for next week"
            autoComplete="off"
            maxLength={200}
          />
          <IconButton
            type="submit"
            label="Add objective"
            icon={<CornerDownLeft />}
            disabled={!title.trim()}
          />
        </form>
        {forWeek.length > 0 && (
          <ul className={styles.weekList}>
            {forWeek.map((o) => (
              <li key={o.id}>
                {o.title}
                {o.dueDate && (
                  <span className={styles.due}> · {dueLabel(o.dueDate, today).text}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
