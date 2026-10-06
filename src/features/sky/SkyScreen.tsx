import { List, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { closeSheet, parseOpen, type Route } from '../../app/router';
import { useAppSettings } from '../../app/settingsContext';
import { useToday } from '../../app/useToday';
import { AltitudeHeader } from '../../components/AltitudeHeader';
import { Button } from '../../components/Button';
import { Page } from '../../components/Page';
import { Tabular } from '../../components/Tabular';
import { useAltimeter, useDreams, useGoals, useObjectives } from '../../db/hooks';
import { formatAltitude } from '../../lib/altimeter';
import { dreamOfTheDay } from '../../lib/dreamOfTheDay';
import { plural } from '../../lib/format';
import { goalProgress } from '../../lib/progress';
import { skyStars } from '../../lib/sky';
import { DreamFormSheet } from './DreamFormSheet';
import { DreamSheet } from './DreamSheet';
import type { HorizonSummit } from './Horizon';
import { useReachState } from './reach';
import { ReachedSummitSheet } from './ReachedSummitSheet';
import { SkyList } from './SkyList';
import { Starfield } from './Starfield';
import styles from './Sky.module.css';

const VIEW_KEY = 'ascent:sky-view';

function readListPreference(): boolean {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list';
  } catch {
    return false;
  }
}

/** The Sky: dreams, and everything already reached. The sky is the limit. */
export function SkyScreen({ route }: { route: Route }) {
  const today = useToday();
  const { units } = useAppSettings();
  const dreams = useDreams();
  const goals = useGoals();
  const objectives = useObjectives();
  const climbed = useAltimeter(today);
  const { ceremony } = useReachState();
  const [listView, setListView] = useState(readListPreference);

  const stars = useMemo(() => skyStars(dreams ?? [], goals ?? []), [dreams, goals]);
  const summits = useMemo<HorizonSummit[]>(
    () =>
      (goals ?? [])
        .filter((g) => g.status === 'active')
        .sort((a, b) => a.createdAt - b.createdAt)
        .map((g) => ({ id: g.id, title: g.title, progress: goalProgress(g, objectives ?? []) })),
    [goals, objectives],
  );
  const labelCandidates = useMemo(() => {
    const ofTheDay = dreamOfTheDay(dreams ?? [], goals ?? [], today);
    const newest = (dreams ?? [])
      .filter((d) => d.status === 'dreaming')
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((d) => `dream:${d.id}`);
    return [...new Set([ofTheDay ? `dream:${ofTheDay.id}` : '', ...newest].filter(Boolean))];
  }, [dreams, goals, today]);
  const whyById = useMemo(() => new Map((dreams ?? []).map((d) => [d.id, d.why])), [dreams]);

  const dreamingCount = stars.filter((s) => !s.reached).length;
  const reachedCount = stars.filter((s) => s.reached).length;
  const loaded = dreams && goals && objectives;

  const open = parseOpen(route.open);
  const openDream = open?.kind === 'dream' ? dreams?.find((d) => d.id === open.id) : undefined;
  const editDream = open?.kind === 'edit-dream' ? dreams?.find((d) => d.id === open.id) : undefined;
  const openSummit =
    open?.kind === 'summit'
      ? goals?.find((g) => g.id === open.id && g.status === 'reached')
      : undefined;

  function toggleView() {
    const next = !listView;
    setListView(next);
    try {
      localStorage.setItem(VIEW_KEY, next ? 'list' : 'sky');
    } catch {
      // Not remembered in private mode; the toggle still works.
    }
  }

  return (
    <div className={styles.sky}>
      <Page className={styles.skyTop}>
        <AltitudeHeader
          title="The sky is the limit"
          variant="sky"
          showAltimeter={false}
          actions={
            <Button
              variant="ghost"
              icon={listView ? <Sparkles /> : <List />}
              aria-pressed={listView}
              aria-label="View as list"
              onClick={toggleView}
              className={styles.viewToggle}
            >
              List
            </Button>
          }
        />
        {loaded && (
          <p className={styles.totals}>
            <Tabular>
              {[
                plural(dreamingCount, 'dream'),
                `${reachedCount} reached`,
                `${formatAltitude(climbed?.total ?? 0, units)} climbed`,
              ].join(' · ')}
            </Tabular>
          </p>
        )}
      </Page>

      {loaded &&
        (listView ? (
          <SkyList stars={stars} summits={summits} whyById={whyById} />
        ) : (
          <Starfield
            stars={stars}
            summits={summits}
            labelCandidates={labelCandidates}
            ceremony={ceremony}
            empty={stars.length === 0}
          />
        ))}

      {loaded && openDream && (
        <DreamSheet
          key={openDream.id}
          dream={openDream}
          goals={goals}
          objectives={objectives}
          onClose={closeSheet}
        />
      )}
      {loaded && open?.kind === 'new-dream' && <DreamFormSheet onClose={closeSheet} />}
      {loaded && editDream && (
        <DreamFormSheet key={editDream.id} dream={editDream} onClose={closeSheet} />
      )}
      {loaded && openSummit && (
        <ReachedSummitSheet
          key={openSummit.id}
          goal={openSummit}
          dream={dreams.find((d) => d.id === openSummit.dreamId)}
          onClose={closeSheet}
        />
      )}
    </div>
  );
}
