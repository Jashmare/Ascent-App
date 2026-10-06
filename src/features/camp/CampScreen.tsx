import { useMemo } from 'react';
import { closeSheet, parseOpen, type Route } from '../../app/router';
import { useAppSettings } from '../../app/settingsContext';
import { useNowMinute, useToday } from '../../app/useToday';
import { AltitudeHeader } from '../../components/AltitudeHeader';
import { EmptyState, Page, Panel } from '../../components/Page';
import { useCompletions, useDreams, useGoals, useObjectives, useTasks } from '../../db/hooks';
import { unfinishedEarlier } from '../../lib/carryOver';
import { formatLongDate } from '../../lib/dates';
import { greeting } from '../../lib/format';
import { completionKey, completionKeys, tasksForDay } from '../../lib/recurrence';
import { streak } from '../../lib/streak';
import { CarryOverPrompt } from './CarryOverPrompt';
import { ClimbSummary } from './ClimbSummary';
import { DreamGlimpse } from './DreamGlimpse';
import { NextOnRidge } from './NextOnRidge';
import { QuickAdd } from './QuickAdd';
import { TaskList } from './TaskList';
import { TaskSheet } from './TaskSheet';
import styles from './Camp.module.css';

/** Camp: today. Everything needed for today, plus one glimpse of the sky. */
export function CampScreen({ route }: { route: Route }) {
  const today = useToday();
  const now = useNowMinute();
  const settings = useAppSettings();
  const tasks = useTasks();
  const completions = useCompletions();
  const objectives = useObjectives();
  const dreams = useDreams();
  const goals = useGoals();

  const todays = useMemo(() => (tasks ? tasksForDay(tasks, today) : []), [tasks, today]);
  const doneKeys = useMemo(() => completionKeys(completions ?? []), [completions]);
  const streakValue = useMemo(
    () => (tasks && completions ? streak(tasks, completions, today) : { current: 0, longest: 0 }),
    [tasks, completions, today],
  );
  const carryOver = useMemo(
    () => (tasks && completions ? unfinishedEarlier(tasks, completions, today) : []),
    [tasks, completions, today],
  );
  const objectivesById = useMemo(
    () => new Map((objectives ?? []).map((o) => [o.id, o])),
    [objectives],
  );
  const openObjectives = useMemo(
    () => (objectives ?? []).filter((o) => o.status === 'open'),
    [objectives],
  );

  const loaded = tasks !== undefined && completions !== undefined && objectives !== undefined;
  const doneCount = todays.filter((t) => doneKeys.has(completionKey(t.id, today))).length;
  const open = parseOpen(route.open);
  const editing = open?.kind === 'task' ? tasks?.find((t) => t.id === open.id) : undefined;

  return (
    <>
      {dreams && goals ? (
        <DreamGlimpse dreams={dreams} goals={goals} today={today} />
      ) : (
        <div className={styles.glimpseSpace} aria-hidden="true" />
      )}
      <Page>
        <AltitudeHeader title="Camp">
          <p>{formatLongDate(today)}</p>
          <p className={styles.greeting}>{greeting(new Date(now).getHours(), settings.name)}</p>
        </AltitudeHeader>

        {loaded && (
          <>
            {carryOver.length > 0 && <CarryOverPrompt tasks={carryOver} today={today} />}

            {todays.length === 0 && (
              <EmptyState>Nothing planned for today yet. Add the first thing you’ll do.</EmptyState>
            )}

            <Panel as="section" aria-label="Today’s tasks" className={styles.taskPanel}>
              <QuickAdd
                today={today}
                openObjectives={openObjectives}
                weekStartsOn={settings.weekStartsOn}
              />
              <TaskList
                tasks={todays}
                doneKeys={doneKeys}
                today={today}
                objectivesById={objectivesById}
                units={settings.units}
                weekStartsOn={settings.weekStartsOn}
              />
            </Panel>

            {todays.length > 0 && (
              <ClimbSummary done={doneCount} total={todays.length} streak={streakValue} />
            )}

            <NextOnRidge objectives={objectives} today={today} />
          </>
        )}

        {editing && (
          <TaskSheet
            key={editing.id}
            task={editing}
            today={today}
            visible={todays}
            objectives={objectives ?? []}
            weekStartsOn={settings.weekStartsOn}
            onClose={closeSheet}
          />
        )}
      </Page>
    </>
  );
}
