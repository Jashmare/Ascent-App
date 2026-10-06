import { useMemo } from 'react';
import { closeSheet, parseOpen, type Route } from '../../app/router';
import { useAppSettings } from '../../app/settingsContext';
import { useToday } from '../../app/useToday';
import { AltitudeHeader } from '../../components/AltitudeHeader';
import { EmptyState, Page, Panel, SectionHeading } from '../../components/Page';
import { useCompletions, useGoals, useObjectives, useTasks } from '../../db/hooks';
import type { Objective } from '../../db/types';
import { groupObjectives, linkedTasksDone } from '../../lib/objectives';
import { ObjectiveQuickAdd } from './ObjectiveQuickAdd';
import { ObjectiveRow } from './ObjectiveRow';
import { ObjectiveSheet } from './ObjectiveSheet';
import styles from './Ridge.module.css';

/** Ridge: concrete outcomes for the next few weeks or months. */
export function RidgeScreen({ route }: { route: Route }) {
  const today = useToday();
  const { weekStartsOn } = useAppSettings();
  const objectives = useObjectives();
  const goals = useGoals();
  const tasks = useTasks();
  const completions = useCompletions();

  const groups = useMemo(
    () => (objectives ? groupObjectives(objectives, today, weekStartsOn) : []),
    [objectives, today, weekStartsOn],
  );
  const finished = useMemo(
    () =>
      (objectives ?? [])
        .filter((o) => o.status === 'done')
        .sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0)),
    [objectives],
  );
  const goalsById = useMemo(() => new Map((goals ?? []).map((g) => [g.id, g])), [goals]);
  const activeGoals = useMemo(() => (goals ?? []).filter((g) => g.status === 'active'), [goals]);

  const loaded = objectives && goals && tasks && completions;
  const open = parseOpen(route.open);
  const selected =
    open?.kind === 'objective' ? objectives?.find((o) => o.id === open.id) : undefined;

  function row(objective: Objective) {
    return (
      <ObjectiveRow
        key={objective.id}
        objective={objective}
        goal={objective.goalId ? goalsById.get(objective.goalId) : undefined}
        tasksDone={linkedTasksDone(objective.id, tasks ?? [], completions ?? [])}
        hasLinkedTasks={(tasks ?? []).some((t) => t.objectiveId === objective.id && !t.archived)}
        today={today}
      />
    );
  }

  return (
    <Page>
      <AltitudeHeader title="Ridge" />
      {loaded && (
        <>
          {groups.length === 0 && (
            <EmptyState>
              No objectives yet. What do you want done by the end of this month?
            </EmptyState>
          )}
          <Panel className={styles.addPanel}>
            <ObjectiveQuickAdd
              today={today}
              weekStartsOn={weekStartsOn}
              activeGoals={activeGoals}
            />
          </Panel>

          {groups.map(({ group, label, items }) => (
            <section key={group} aria-labelledby={`ridge-${group}`}>
              <SectionHeading id={`ridge-${group}`}>{label}</SectionHeading>
              <Panel>
                <ul className={styles.list}>{items.map(row)}</ul>
              </Panel>
            </section>
          ))}

          {finished.length > 0 && (
            <details className={styles.done}>
              <summary className={styles.doneSummary}>
                Done <span className="tabular">({finished.length})</span>
              </summary>
              <Panel>
                <ul className={styles.list}>{finished.map(row)}</ul>
              </Panel>
            </details>
          )}
        </>
      )}

      {selected && loaded && (
        <ObjectiveSheet
          key={selected.id}
          objective={selected}
          goals={goals}
          tasks={tasks}
          completions={completions}
          today={today}
          onClose={closeSheet}
        />
      )}
    </Page>
  );
}
