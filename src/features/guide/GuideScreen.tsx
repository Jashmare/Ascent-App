import { Compass, Flag, MoonStar, MountainSnow, Tent } from 'lucide-react';
import type { ReactNode } from 'react';
import { AltitudeHeader } from '../../components/AltitudeHeader';
import { Button } from '../../components/Button';
import { ClimbLine } from '../../components/ClimbLine';
import { Page, Panel } from '../../components/Page';
import { PeakGlyph } from '../../components/PeakGlyph';
import { STAR_PATH } from '../sky/StarButton';
import { startTour } from './tourState';
import styles from './Guide.module.css';

const SECTIONS = [
  { id: 'guide-climb', label: 'The climb' },
  { id: 'guide-camp', label: 'Camp' },
  { id: 'guide-ridge', label: 'Ridge' },
  { id: 'guide-summit', label: 'Summit' },
  { id: 'guide-sky', label: 'Sky' },
  { id: 'guide-altimeter', label: 'Altimeter' },
  { id: 'guide-reminders', label: 'Reminders' },
  { id: 'guide-data', label: 'Your data' },
  { id: 'guide-keys', label: 'Keyboard' },
];

/** "How Ascent works": a guide to every part of the app, with the tour one tap away. */
export function GuideScreen() {
  return (
    <Page>
      <AltitudeHeader title="How Ascent works" showAltimeter={false} back hideLinks>
        <p>Everything you do today is part of a climb.</p>
      </AltitudeHeader>

      <Panel className={styles.tourPanel}>
        <Compass className={styles.tourIcon} aria-hidden="true" />
        <div className={styles.tourText}>
          <p className={styles.tourTitle}>New here?</p>
          <p className={styles.muted}>
            Take a one-minute tour that points out each part of the app, right where it lives.
          </p>
          <div>
            <Button variant="primary" onClick={startTour}>
              Take the tour
            </Button>
          </div>
        </div>
      </Panel>

      <nav aria-label="On this page" className={styles.contents}>
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            className={styles.jump}
            onClick={() => {
              const target = document.getElementById(section.id);
              target?.scrollIntoView({ block: 'start' });
              target?.focus({ preventScroll: true });
            }}
          >
            {section.label}
          </button>
        ))}
      </nav>

      <GuideSection id="guide-climb" title="The climb">
        <p>
          Your plans are organised by altitude, from what you’ll do today up to the dreams you’re
          reaching for. Each level can point to the one above it, so you can always see what
          something is for.
        </p>
        <ul className={styles.altitudes}>
          <Altitude icon={<Tent />} name="Camp" span="Today">
            Daily tasks and routines.
          </Altitude>
          <Altitude icon={<Flag />} name="Ridge" span="This week, month or quarter">
            Objectives: concrete outcomes.
          </Altitude>
          <Altitude icon={<MountainSnow />} name="Summit" span="A year or more">
            Long-term goals, with milestones.
          </Altitude>
          <Altitude icon={<MoonStar />} name="Sky" span="No deadline">
            Dreams, and everything you’ve reached.
          </Altitude>
        </ul>
        <p className={styles.muted}>
          Move between them with the bar at the bottom of the screen (or the rail on the left of a
          wide screen).
        </p>
      </GuideSection>

      <GuideSection id="guide-camp" title="Camp: today">
        <div className={styles.figure}>
          <ClimbLine progress={0.6} />
          <p className={styles.caption}>3 of 5 done · 6-day streak</p>
        </div>
        <Steps>
          <li>
            <strong>Add a task:</strong> type in “Add a task for today” and press Enter.
          </li>
          <li>
            <strong>Extras:</strong> the sliders button links a task to an objective, or makes it a
            routine that repeats daily, on weekdays, or on days you choose.
          </li>
          <li>
            <strong>Check it off</strong> with one tap; each one adds 10 m. Tap again to undo.
          </li>
          <li>
            <strong>Reorder</strong> by dragging the grip, or focus the grip and press the up and
            down arrows. The ⋯ button edits or deletes a task.
          </li>
          <li>
            <strong>Carry-over:</strong> if earlier tasks were left unfinished, Camp asks whether to
            bring them to today or let them go. Letting go archives them; nothing is deleted.
          </li>
          <li>
            <strong>The climb line</strong> rises as you finish tasks. Your streak counts days when
            everything planned got done; days with nothing planned don’t count either way.
          </li>
          <li>
            <strong>Above and below:</strong> the night-sky strip shows one dream each day, and
            “Next on the ridge” shows the objective due soonest.
          </li>
        </Steps>
      </GuideSection>

      <GuideSection id="guide-ridge" title="Ridge: objectives">
        <Steps>
          <li>
            <strong>Add an objective:</strong> type it and press Enter. It’s set for this month; the
            options set a horizon (this week, month, quarter or someday), a due date, and a linked
            summit.
          </li>
          <li>
            Objectives are grouped as Overdue, This week, This month, This quarter and Someday, with
            due dates in plain words like “3 days left”.
          </li>
          <li>
            <strong>Tap one</strong> to edit it, see its linked tasks, or add a task for today that
            links to it.
          </li>
          <li>
            <strong>Check it off</strong> to add 100 m. Finished objectives move to Done, where you
            can reopen them.
          </li>
        </Steps>
      </GuideSection>

      <GuideSection id="guide-summit" title="Summit: long-term goals">
        <div className={styles.figureRow}>
          <PeakGlyph progress={62} size={48} />
          <p className={styles.caption}>A peak fills like a snowline as you climb: 62%.</p>
        </div>
        <Steps>
          <li>
            <strong>Add a summit:</strong> type it and press Enter. Its sheet opens so you can add
            why it matters, a target month, milestones, and the dream it leads toward.
          </li>
          <li>
            <strong>Progress</strong> is automatic: finished milestones and linked objectives out of
            all of them. Switch to manual for goals that don’t break down neatly.
          </li>
          <li>Each milestone you check off adds 250 m.</li>
          <li>
            <strong>Reach the summit:</strong> at 100% a button appears (it’s always in the ⋯ menu
            too). You can add a reflection, then watch it rise into your sky as a gold star, adding
            1,000 m.
          </li>
        </Steps>
      </GuideSection>

      <GuideSection id="guide-sky" title="Sky: dreams">
        <div className={styles.skyFigure} data-altitude="sky" aria-hidden="true">
          <svg viewBox="0 0 320 90" className={styles.skySvg}>
            <line x1="70" y1="30" x2="150" y2="55" className={styles.skyLine} />
            <path d={STAR_PATH} transform="translate(62 22) scale(0.7)" className={styles.gold} />
            <path d={STAR_PATH} transform="translate(142 47) scale(0.7)" className={styles.gold} />
            <path d={STAR_PATH} transform="translate(236 24) scale(0.5)" className={styles.pale} />
            <path d={STAR_PATH} transform="translate(272 60) scale(0.45)" className={styles.pale} />
          </svg>
        </div>
        <Steps>
          <li>
            <strong>Add a dream</strong> with the button in the Sky: a title, why it matters, what
            it looks like when it’s real, and a photo if you like. No deadlines, no percentages.
          </li>
          <li>
            <strong>Pale stars</strong> are dreams you’re still reaching for.{' '}
            <strong>Gold stars</strong> are summits and dreams you’ve reached, joined in order into
            your constellation.
          </li>
          <li>
            <strong>The horizon</strong> has a peak for each active summit, as tall as its progress.
            Tap a peak to open it.
          </li>
          <li>
            <strong>Tap a star</strong> to open it: link a summit as a path toward it, mark it as
            reached, or move it back to dreaming.
          </li>
          <li>
            <strong>List</strong> shows the whole sky as lists: still reaching, reached, and on the
            horizon.
          </li>
        </Steps>
      </GuideSection>

      <GuideSection id="guide-altimeter" title="The altimeter">
        <p>A light measure of effort, shown at the top of Camp, Ridge and Summit.</p>
        <table className={styles.table}>
          <tbody>
            <tr>
              <th scope="row">Task done</th>
              <td>+10 m</td>
            </tr>
            <tr>
              <th scope="row">Objective done</th>
              <td>+100 m</td>
            </tr>
            <tr>
              <th scope="row">Milestone done</th>
              <td>+250 m</td>
            </tr>
            <tr>
              <th scope="row">Summit reached</th>
              <td>+1,000 m</td>
            </tr>
          </tbody>
        </table>
        <p className={styles.muted}>
          Uncheck something and its metres come off. Switch to feet in Settings.
        </p>
      </GuideSection>

      <GuideSection id="guide-reminders" title="Reminders">
        <Steps>
          <li>
            <strong>Morning</strong> (on, 7:00): today’s climb and a dream.{' '}
            <strong>Evening check-in</strong> (off): only if tasks are left.{' '}
            <strong>Objectives due</strong> (on): the day before and the morning of.{' '}
            <strong>Weekly review</strong> (on, Sunday 18:00). <strong>Dream nudge</strong> (off):
            one dream’s picture-it note each week.
          </li>
          <li>
            Turn on notifications in Settings to get them while Ascent is open or in the background.
            Without them, reminders appear inside the app.
          </li>
          <li>
            <strong>Add to calendar</strong> in Settings saves your routines, due dates and weekly
            review to your phone’s calendar, which reminds you even when Ascent is closed.
          </li>
          <li>
            <strong>The weekly review</strong> is a short guided look at the week: what got done on
            the ridge, summit progress, one dream, and next week’s objectives. On review day, Camp
            offers to start it.
          </li>
        </Steps>
      </GuideSection>

      <GuideSection id="guide-data" title="Your data">
        <Steps>
          <li>Everything stays on this device. There are no accounts and nothing is uploaded.</li>
          <li>
            <strong>Back up data</strong> in Settings saves one file with everything, photos
            included. <strong>Restore a backup</strong> shows what’s in it, then replaces or merges.
          </li>
          <li>
            <strong>Reset everything</strong> deletes all data on this device after you type
            “reset”.
          </li>
          <li>
            <strong>Install</strong> Ascent from your browser’s menu (“Install app” or “Add to Home
            Screen”). After the first visit it works offline.
          </li>
        </Steps>
      </GuideSection>

      <GuideSection id="guide-keys" title="Keyboard">
        <table className={styles.table}>
          <tbody>
            <tr>
              <th scope="row">Tab</th>
              <td>Move between controls</td>
            </tr>
            <tr>
              <th scope="row">Enter</th>
              <td>Add what you typed, or press a button</td>
            </tr>
            <tr>
              <th scope="row">Space</th>
              <td>Check or uncheck</td>
            </tr>
            <tr>
              <th scope="row">Up and down arrows</th>
              <td>Reorder a task while its grip has focus</td>
            </tr>
            <tr>
              <th scope="row">Escape</th>
              <td>Close a sheet, or skip the reaching ceremony</td>
            </tr>
          </tbody>
        </table>
      </GuideSection>

      <div className={styles.end}>
        <Button variant="primary" onClick={startTour}>
          Take the tour
        </Button>
        <a href="#/camp" className={styles.endLink}>
          Back to Camp
        </a>
      </div>
    </Page>
  );
}

function GuideSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className={styles.section} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={styles.sectionTitle}>
        <span id={id} tabIndex={-1} className={styles.anchor} />
        {title}
      </h2>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function Steps({ children }: { children: ReactNode }) {
  return <ul className={styles.steps}>{children}</ul>;
}

function Altitude({
  icon,
  name,
  span,
  children,
}: {
  icon: ReactNode;
  name: string;
  span: string;
  children: ReactNode;
}) {
  return (
    <li className={styles.altitude}>
      <span className={styles.altitudeIcon} aria-hidden="true">
        {icon}
      </span>
      <span>
        <span className={styles.altitudeName}>{name}</span>{' '}
        <span className={styles.muted}>· {span}</span>
        <br />
        {children}
      </span>
    </li>
  );
}
