# Ascent — product spec

## 1. Concept

**The sky is the limit.**

You start each day at Camp. Today's tasks carry you up to the Ridge, objectives carry you to the
Summit, and above every summit is the open Sky: the dreams you haven't put a date on yet, and
the place where everything you've reached ends up.

The Sky does two jobs at once. It's where hope lives, so your bigger ambitions stay in view even
on ordinary days. And it's where achievement is remembered: every summit you reach and every
dream that comes true becomes a star. Over time your sky fills up with proof of how far you've
climbed.

The app has two jobs:

1. Remind me what to do today, and why it matters.
2. Keep my bigger hopes in view so I stay hopeful about the future.

## 2. Principles

- **Everything connects upward.** A task can point to an objective, an objective to a summit,
  a summit to a dream. At every level the app can answer "what is this for?"
- **Dreams are not tasks.** No percentages, no deadlines, no guilt. They are there to be seen
  and remembered.
- **Achievements rise.** When a summit or a dream is reached, it becomes a gold star in the Sky.
- **Encourage, never nag.** Reminders are short and warm. Missed days never shame.
- **Private by default.** Data lives on the device and can be exported at any time.
- **Fast for daily use.** Camp opens instantly and adding a task takes one line and Enter.

## 3. Camp — today

The home screen. Everything needed for today, plus one glimpse of the sky.

**Tasks**
- Quick add field at the top: type, press Enter. Optional extras in an expandable row: link to
  an objective, make it a routine.
- Two kinds: one-off tasks (planned for a date) and routines (repeat on a schedule).
- Repeat options: daily, weekdays, or chosen days of the week.
- Check off with one tap. Unchecking undoes it.
- Reorder by drag, with move up / move down as the keyboard alternative.
- Tasks linked to an objective show a small link tag beneath the title.

**Carry-over**
- On the first open of a new day, if earlier one-off tasks were left unfinished, show a quiet
  prompt: "2 tasks from yesterday aren't done. Bring them to today?" with **Bring them** and
  **Let them go**. Letting go archives them (they're not deleted).

**Progress and streak**
- Today's progress (done of total) shown as the climb line (see DESIGN.md §5).
- Streak: consecutive days on which every task planned for that day was done. A day with no
  tasks neither adds to nor breaks the streak. Show the current and longest streak.
- When a streak ends, the copy is "Fresh start today." Never "You broke your streak."

**Connections upward**
- **Dream glimpse**: a slim strip of night sky at the top of Camp showing one dream each day
  ("Still reaching for: …"). Tap it to open that dream in the Sky. Selection rules in §10.
- **Next on the ridge**: beneath today's tasks, the open objective with the nearest due date,
  so today always connects to something bigger.

## 4. Ridge — objectives

Concrete outcomes for the next few weeks or months.

- Fields: title, notes (optional), horizon (this week, this month, this quarter, someday),
  due date (optional), linked summit (optional).
- Grouped as: Overdue, This week, This month, This quarter, Someday. Groups with nothing in
  them are hidden.
- Due label in plain words: "Due today", "3 days left", "2 days overdue".
- Each objective shows how many linked Camp tasks have been completed.
- Completing an objective adds altitude (§7) and shows a short confirmation.
- Tapping an objective opens a detail sheet: edit fields, see linked tasks, add a task for
  today that links to it.

## 5. Summit — long-term goals

The big climbs, a year or more away.

- Fields: title, why it matters (shown in the serif face), target month and year (optional),
  linked dream (optional), milestones (a checklist), progress mode.
- Progress:
  - **Auto** (default): completed milestones plus completed linked objectives, divided by the
    total of both.
  - **Manual**: a slider from 0 to 100 in steps of 5, for goals that don't break down neatly.
  - When there are no milestones or linked objectives yet, show manual mode.
- Each summit shows: progress, the next unfinished milestone, and its linked dream
  ("Leads toward: A studio by the sea").
- **Reach the summit**: a button appears when progress hits 100%, and is always available in
  the menu. It plays the reaching ceremony (DESIGN.md §6), sets the summit to reached, and adds
  it to the Sky as a gold star. Asks for an optional reflection: "How does it feel to be here?"
- A reached summit can be moved back to active from its sheet in the Sky.

## 6. Sky — dreams and achievements

The sky is the limit. This is the screen that should make the app feel different from every
other to-do list.

**Dreams**
- Fields: title, why it matters, picture it (a short vision: what life looks like when this is
  real), optional photo, date added.
- No deadlines and no percentages. A dream can have summits linked to it; those appear on the
  dream's sheet as paths toward it, each with its own progress.
- Photos are stored as a Blob in IndexedDB, resized to a maximum of 1600px on the long side.

**Two kinds of star**
- **Dream stars**: pale and softly twinkling. Still reaching.
- **Reached stars**: gold. Dreams marked as reached, and summits that were reached. They are
  joined by thin lines in the order they were reached, forming your constellation.

**Interactions**
- Tap a star to open its sheet. Dream sheet actions: edit, link a summit, mark as reached
  (with an optional reflection), move back to dreaming. Reached-summit sheet: view, move back
  to active.
- Star labels: show the label on hover, focus or tap. Show labels for up to three dream stars
  at rest so the sky never looks empty of meaning.
- **View as list** toggle: two lists, "Still reaching" and "Reached". Required for
  accessibility and handy for quick scanning.
- **Horizon**: the bottom of the Sky is a mountain silhouette. Each active summit is a peak,
  and its height reflects its progress. Tapping a peak opens that summit.
- A small line of totals near the top: dreams, reached, and total altitude climbed.

**Adding a dream** is always one tap away from the Sky. The form leads with the title, then
"Why does this matter to you?", then "Picture it." Only the title is required.

## 7. Cross-cutting features

**Altimeter**
- A light, game-like measure of effort shown in the header: today's climb ("+60 m today")
  and the lifetime total.
- Values: task done +10 m, milestone done +250 m, objective done +100 m, summit reached
  +1,000 m. Unchecking reverses it.
- Always derived from completion records, never stored as a running counter, so it can't drift.
- Units follow settings (metres or feet).

**First run**
- One welcome screen: "Start with the sky." Ask for one dream first (skippable), then one
  thing to do today. Lead with hope, then action.
- Land on Camp with the dream glimpse already showing the dream just added.

**Settings**
- Name for the greeting, week starts on (Sunday or Monday), altitude units (m or ft), theme
  (system, light, dark), reminder times and switches (§8).
- **Back up**: export everything to one JSON file, photos included as base64.
- **Restore**: import a backup with a preview of what's inside and a choice to replace or merge.
- **Reset**: delete all data, with typed confirmation.

## 8. Reminders

What gets reminded:

| Reminder | Default | Message example |
|---|---|---|
| Morning | On, 07:00 | "Today's climb: 4 tasks. Still reaching for: a studio by the sea." |
| Evening check-in | Off, 20:00 | Only when tasks are unfinished. "2 tasks left today. Still time." |
| Objective due | On | Day before and morning of. "Finish portfolio is due tomorrow." |
| Weekly review | On, Sunday 18:00 | "Time to look at the week from the ridge." |
| Dream nudge | Off, weekly | Shows one dream's "picture it" note. |

**Weekly review** is a guided screen, not just a notification: check what got done on the
ridge, update summit progress, revisit one dream, set next week's objectives.

**Platform reality — build reminders in this order:**

1. **In-app (Phase 4).** On open, Camp shows anything due today and a weekly review banner on
   review day. Uses the Notification API while the app is open or backgrounded.
2. **Calendar export (Phase 4).** "Add to calendar" exports an `.ics` file for routines,
   objective due dates and the weekly review. The phone's own calendar then delivers reliable
   alerts with no server. This is the dependable reminder path for the web version.
3. **Native (Phase 5, optional).** Wrap the app with Capacitor for Android and use
   `@capacitor/local-notifications` for true scheduled reminders when the app is closed.

A web app cannot reliably fire a notification at a set time while closed without a push server.
Don't build a push server.

## 9. Build phases

Each phase ends with a working, testable app. Plan first, wait for approval, then build.

**Phase 0 — Foundation**
- Scaffold with the stack in CLAUDE.md. Tokens, fonts, global styles.
- App shell with altitude navigation (bottom bar on mobile, altitude rail on desktop) and the
  altitude transition.
- Empty states for all four altitudes. Dexie database with the tables from §10.
- Done when: all four altitudes are reachable by tap and keyboard, each has its own background,
  the transition plays (and is replaced by a fade with reduced motion), and the tests pass.

**Phase 1 — Camp**
- Tasks, routines, check-off, reorder, carry-over prompt, climb line, streak, altimeter.
- Unit tests for `tasksForDay`, `isDoneOn`, streak and altimeter, including month boundaries
  and days with no tasks.
- Done when: a routine set for weekdays appears Monday to Friday only; yesterday's unfinished
  one-off task triggers the carry-over prompt; the streak survives a reload.

**Phase 2 — Ridge and Summit**
- Objectives with grouping and due labels; summits with milestones, auto and manual progress.
- Linking: task to objective, objective to summit. "Next on the ridge" on Camp.
- Done when: completing a linked objective moves its summit's auto progress, and link tags
  navigate to the linked item.

**Phase 3 — Sky**
- Dreams (with photo), starfield, labels, list view, constellation, horizon peaks.
- Summit to dream linking. Reaching ceremony for summits and dreams. Dream glimpse on Camp.
- Done when: reaching a summit plays the ceremony and adds a gold star joined to the previous
  one; the list view and keyboard can reach every star; the dream glimpse changes daily.

**Phase 4 — Reminders, settings and install**
- Settings screen, backup and restore, reset. In-app reminders, Notification API, `.ics`
  export, weekly review flow. PWA manifest, icons, offline support.
- Done when: the app installs to a phone home screen, works offline, and a backup restored
  into a fresh install reproduces everything, photos included.

**Phase 5 — Android app (optional)**
- Capacitor wrapper and scheduled local notifications for the reminders in §8.

## 10. Data model and logic

```ts
type ISODate = string;    // 'YYYY-MM-DD', device local time
type Timestamp = number;  // ms since epoch

type Repeat =
  | { kind: 'none' }
  | { kind: 'daily' }
  | { kind: 'weekdays' }
  | { kind: 'days'; days: number[] }; // 0 = Sunday … 6 = Saturday

interface Task {
  id: string;
  title: string;
  date: ISODate | null;     // one-off: the planned day. Routines: null.
  repeat: Repeat;
  objectiveId?: string;
  order: number;
  archived: boolean;
  createdAt: Timestamp;
}

interface TaskCompletion {
  id: string;
  taskId: string;
  date: ISODate;            // the day it counted for
  at: Timestamp;
}

interface Objective {
  id: string;
  title: string;
  notes?: string;
  horizon: 'week' | 'month' | 'quarter' | 'someday';
  dueDate?: ISODate;
  goalId?: string;
  status: 'open' | 'done';
  doneAt?: Timestamp;
  createdAt: Timestamp;
}

interface Milestone {
  id: string;
  title: string;
  doneAt?: Timestamp;
}

interface Goal {                // shown as "Summit" in the UI
  id: string;
  title: string;
  why?: string;
  targetMonth?: string;       // 'YYYY-MM'
  dreamId?: string;
  milestones: Milestone[];
  progressMode: 'auto' | 'manual';
  manualProgress: number;     // 0–100
  status: 'active' | 'reached';
  reachedAt?: Timestamp;
  reflection?: string;
  createdAt: Timestamp;
}

interface Dream {
  id: string;
  title: string;
  why?: string;
  vision?: string;            // "Picture it"
  photo?: Blob;
  status: 'dreaming' | 'reached';
  reachedAt?: Timestamp;
  reflection?: string;
  createdAt: Timestamp;
}

interface Setting {
  key: string;
  value: unknown;
}
```

**Dexie tables (version 1)**

```
tasks:       'id, date, objectiveId, archived'
completions: 'id, taskId, date, [taskId+date]'
objectives:  'id, status, goalId, dueDate'
goals:       'id, status, dreamId'
dreams:      'id, status'
settings:    'key'
```

**Pure functions in `src/lib` (all unit-tested)**

- `tasksForDay(tasks, date)`: one-off tasks planned for that date, plus routines whose repeat
  rule matches that weekday and that were created on or before that date. Excludes archived.
- `isDoneOn(taskId, date, completions)`
- `streak(tasks, completions, today)`: returns `{ current, longest }` using the rule in §3.
- `goalProgress(goal, objectives)`: returns 0–100 using the rule in §5.
- `altimeter(records, today)`: returns `{ today, total }` in metres using the values in §7.
- `dreamOfTheDay(dreams, goals, date)`: deterministic for a given date. Only dreams with
  status `dreaming`. Prefer dreams linked to an active summit. Rotate so the same dream doesn't
  repeat on consecutive days when there are two or more.
- `starPosition(id, viewport)`: deterministic position seeded from the id. Keep stars out of
  the horizon band and the header, and at least 32px apart.
- `buildIcs(events)`: produces a valid `.ics` string for calendar export.

## 11. Out of scope for now

Accounts, cloud sync, sharing, AI features, a push server, multiple users.
