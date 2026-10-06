import { CornerDownLeft, Plus } from 'lucide-react';
import { useId, useMemo, useState, type FormEvent } from 'react';
import { closeSheet, openSheet, parseOpen, type Route } from '../../app/router';
import { useToday } from '../../app/useToday';
import { AltitudeHeader } from '../../components/AltitudeHeader';
import { IconButton } from '../../components/Button';
import { EmptyState, Page, Panel } from '../../components/Page';
import { addGoal } from '../../db/goals';
import { useDreams, useGoals, useObjectives } from '../../db/hooks';
import { plural } from '../../lib/format';
import { goalProgress } from '../../lib/progress';
import { SummitRow } from './SummitRow';
import { SummitSheet } from './SummitSheet';
import styles from './Summit.module.css';

/** Summit: the big climbs, a year or more away. */
export function SummitScreen({ route }: { route: Route }) {
  const today = useToday();
  const goals = useGoals();
  const objectives = useObjectives();
  const dreams = useDreams();

  const active = useMemo(
    () =>
      (goals ?? []).filter((g) => g.status === 'active').sort((a, b) => a.createdAt - b.createdAt),
    [goals],
  );
  const reachedCount = (goals ?? []).filter((g) => g.status === 'reached').length;
  const dreamsById = useMemo(() => new Map((dreams ?? []).map((d) => [d.id, d])), [dreams]);

  const loaded = goals && objectives && dreams;
  const open = parseOpen(route.open);
  const selected = open?.kind === 'summit' ? active.find((goal) => goal.id === open.id) : undefined;

  return (
    <Page>
      <AltitudeHeader title="Summit" />
      {loaded && (
        <>
          {active.length === 0 && (
            <EmptyState>
              No summits yet. Pick something worth a year or more of climbing.
            </EmptyState>
          )}
          <Panel className={styles.addPanel}>
            <SummitQuickAdd />
          </Panel>
          {active.length > 0 && (
            <Panel as="section" aria-label="Your summits" className={styles.listPanel}>
              <ul className={styles.list}>
                {active.map((goal) => (
                  <SummitRow
                    key={goal.id}
                    goal={goal}
                    progress={goalProgress(goal, objectives)}
                    dream={goal.dreamId ? dreamsById.get(goal.dreamId) : undefined}
                  />
                ))}
              </ul>
            </Panel>
          )}
          {reachedCount > 0 && (
            <p className={styles.footnote}>
              {plural(reachedCount, 'summit')} reached. <a href="#/sky">See them in your sky</a>
            </p>
          )}
        </>
      )}

      {selected && loaded && (
        <SummitSheet
          key={selected.id}
          goal={selected}
          objectives={objectives}
          dreams={dreams}
          today={today}
          onClose={closeSheet}
        />
      )}
    </Page>
  );
}

/** "Add a summit" + Enter, then its sheet opens to fill in the rest. */
function SummitQuickAdd() {
  const [title, setTitle] = useState('');
  const inputId = useId();

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    const goal = await addGoal({ title });
    setTitle('');
    openSheet('summit', `summit:${goal.id}`);
  }

  return (
    <form className={styles.quickAdd} onSubmit={submit} data-tour="summit-add">
      <Plus className={styles.quickIcon} aria-hidden="true" />
      <label htmlFor={inputId} className="visually-hidden">
        Add a summit
      </label>
      <input
        id={inputId}
        className={styles.quickInput}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Add a summit"
        autoComplete="off"
        enterKeyHint="done"
        maxLength={200}
      />
      <IconButton
        type="submit"
        label="Add summit"
        icon={<CornerDownLeft />}
        disabled={!title.trim()}
      />
    </form>
  );
}
