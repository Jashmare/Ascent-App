# Ascent: context capsule

A compact brief for picking this project back up (or handing it to another person or AI
session). Last updated 7 October 2026.

## What it is

**Ascent** is a personal planning PWA built on one idea: everything you do today is part of a
climb. _The sky is the limit._

| Altitude | Holds | Horizon | Screen |
|---|---|---|---|
| Camp | Tasks and routines | Today | `#/camp` (home) |
| Ridge | Objectives | Week, month, quarter, someday | `#/ridge` |
| Summit | Long-term goals ("goals" in code) with milestones | A year or more | `#/summit` |
| Sky | Dreams, plus every reached summit and dream as a gold star | No deadline | `#/sky` |

Links run upward: task → objective → summit → dream. Local-only (IndexedDB), no accounts, no
backend. Installable and offline.

- **Repo:** https://github.com/Jashmare/Ascent-App (branch `main`)
- **Local:** `C:\Users\Prince\Documents\Claude Files\ASCENT APP\ascent`
- **Source of truth:** `docs/PRODUCT.md` (spec, phases §9, data model §10),
  `docs/DESIGN.md` (tokens, type, layouts, motion §6, copy §7), `CLAUDE.md` (stack and rules).
  User guide: `docs/GUIDE.md`. Screenshots: `docs/screenshots/`.

## Status

- **Done and verified:** Phases 0–4 of PRODUCT.md §9, plus an in-app guide (`#/guide`) and a
  12-step guided tour. 162 tests passing (24 files). Typecheck, lint and Prettier are clean.
- **Checked in a real browser:**
  - The production build runs offline with the server stopped.
  - A photo is resized from 3000×2000 to 1600×1067 JPEG.
  - A backup restored into a wiped install reproduced every record, with the photo byte-identical.
  - The ceremony, tour, weekly review and settings flows all work.
- **Not built:** Phase 5 (optional Capacitor Android wrapper with local notifications).
- **Not verified:**
  - Installing on a real phone, which needs HTTPS hosting.
  - System notifications, which the embedded test browser blocks; only the in-app fallback was seen.
  - iOS Safari specifics.

## Stack (current stable as of Oct 2026, with deliberate pins)

React 19.3 · Vite 8.3 (Rolldown) · TypeScript **6.0.3** strict (TS 7 isn't supported by
typescript-eslint yet) · Dexie 4.4 + dexie-react-hooks · date-fns 4 · motion 14 · lucide-react 1.52
· vite-plugin-pwa 2.0 (generateSW, Workbox 7) · Fontsource variable fonts (Schibsted Grotesk,
Newsreader with opsz) · Vitest 5 + React Testing Library 16 + jsdom **29** (30 needs Node ≥24.15)
+ fake-indexeddb · ESLint **10** + typescript-eslint 8.71 + react-hooks 7 (compiler rules) +
**eslint-plugin-jsx-a11y-x** (maintained fork; original stops at ESLint 9) + react-refresh ·
Prettier 3. Node 22.12+ required (machine has 24.13).

## Commands

```
npm run dev        # http://localhost:5180
npm run build      # tsc -b && vite build (dist/ + service worker)
npm run preview    # serve dist/ at http://localhost:5181
npm run test       # vitest run (test:watch to watch)
npm run lint       # eslint .
npm run typecheck  # tsc -b
npm run format     # prettier --write .
npm run icons      # regenerate PNG icons from public/logo.svg
```

Dev-only helpers (stripped from production):
- `ascentSampleData()` in the console loads a generic sample climb, replacing local data.
  `{ tourDone: false }` brings the tour prompt back.
- `/?now=2026-10-12T07:00` shifts the app clock; clear it with `/?now=`.

Claude Code preview configs live in `Claude Files\.claude\launch.json`: `ascent-dev` (5180) and
`ascent-preview` (5181). Port 5173 is the user's `portfolio` config.

## Architecture

```
src/
  app/        App (settings gate → Onboarding | AppShell), AppShell (screen transitions with
              AnimatePresence popLayout, Nav, overlays), router (hash; sheets in ?open=kind:id),
              clock (single source of "now", dev time travel), useToday/useNowMinute, theme,
              toast store, pwa (registerSW + install prompt), ErrorBoundary, useAutosave
  db/         db.ts (Dexie v1 schema), types.ts (spec §10), tasks/objectives/goals/dreams/settings
              data access, hooks.ts (useLiveQuery views, useAltimeter), backup.ts (format 1)
  lib/        Pure, unit-tested logic: dates (UTC day maths on 'YYYY-MM-DD'), recurrence
              (tasksForDay, isDoneOn), streak, altimeter, progress (goalProgress), objectives
              (groups, dueLabel, nextOnRidge), dreamOfTheDay, stars (layoutStars, restingLabels),
              horizon, sky, climb, carryOver, ics (RFC 5545), calendar, reminders, base64, image
  features/   camp, ridge, summit, sky (starfield, ceremony, reach.ts phase store), reminders
              (runner, notifications, weekly review, Camp banners), settings (incl. RestoreBackup),
              onboarding, guide (GuideScreen, Tour, tourState, tourSteps, TourPrompt)
  components/ Button, Sheet (native <dialog> showModal), Field, Chips, Checkbox, Switch, Menu,
              LinkTag, ClimbLine, PeakGlyph, Tabular, Toaster, Page/Panel, AltitudeHeader
  styles/     tokens.css (all colours, per altitude and theme), globals.css, fonts.ts
  dev/        sampleData.ts (dev only)
```

- **Routes:** `#/camp|ridge|summit|sky|settings|review|guide`.
  - Sheets: `?open=task:id`, `objective:id`, `summit:id`, `dream:id`, `edit-dream:id`, `new-dream`.
  - `openSheet()` pushes history (so Back closes the sheet); `closeSheet()` goes back or replaces.
- **Data:**
  - Dexie tables `tasks, completions, objectives, goals, dreams, settings` (spec schema v1).
  - Settings keys: `name, weekStartsOn, units, theme, reminders, onboarded, tourDone,
    lastReviewDate, reviewDismissedOn, reminderLog` (reminderLog and reviewDismissedOn are
    device-only, never backed up).
  - Any schema change means a new Dexie version plus migration, and an upgrade step in `backup.ts`.
- **Theming:** each altitude maps its palette onto shared tokens (`--bg --accent --accent-strong
  --ink --surface --line`) via `[data-altitude]`. `<html data-theme>` is resolved from the setting
  plus `prefers-color-scheme`, mirrored to localStorage for a flash-free boot.

## Rules that matter (from CLAUDE.md and DESIGN.md)

- Logic goes in `src/lib` as tested pure functions; components stay thin.
- App data only in IndexedDB; localStorage only for small UI conveniences, in try/catch.
- Every colour, font, radius and spacing value comes from tokens. No hex in components.
- **Accessibility:** WCAG AA (enforced by `src/styles/contrast.test.ts`), keyboard reachable,
  visible focus, labels on every control, 44px targets, `prefers-reduced-motion` honoured.
- **Copy:** sentence case, plain verbs, no exclamation marks, never streak-shaming
  ("Fresh start today.").
- **Type:** grotesk for doing, Newsreader serif for hoping. Only gradient: the Sky. Only sheets
  cast shadows.
- **Motion** only for altitude change, task check (+10 m float), the reaching ceremony, and
  twinkle (plus sheet slide-up).
- Sample and seed data stay generic: no real names or employers.
- Commit after each working step.

## Decisions and deviations from the spec

- **Built end to end** without per-phase approval, because the user asked; Phase 5 skipped.
- **Tokens:**
  - `--on-accent` (basalt) is the text colour on any accent fill in every theme. The spec's `--ink`
    fails contrast on accent in dark mode.
  - `--field-border` is derived so inputs reach 3:1.
- **Streak:** uses `tasksForDay` (archived excluded), so carrying a task over or letting it go
  doesn't break a past day. Today never breaks a streak; it only counts once complete.
- **Ridge:**
  - Grouping: overdue first; a due date decides the group, else the chosen horizon. Due dates
    beyond this quarter fall back to the horizon.
  - Next on the ridge: earliest due date, overdue first, else the shortest horizon.
- **Summit:** auto progress uses floor, so 100% only when everything is done. "Reach the summit"
  asks for the reflection before the ceremony.
- **Dream of the day:** dreams linked to an active summit fill every slot of a rotation except one,
  which cycles through the others. It never repeats two days running.
- **Tasks:** deleting a task that has completions archives it, so the altimeter keeps its history.
  The repeat badge sits under the title, so the row controls align.
- **Reminders:**
  - Each fires once a day; more than 3 hours late, it's skipped quietly.
  - Objective-due reminders fire at the morning time.
  - Dream nudge defaults to Wednesday 12:00. Week starts Monday by default.
- **Restore** is offered on the welcome screen as well as in Settings, for moving devices.
- **Numbers:** a `Tabular` component keeps tabular figures but gives commas proportional width
  (the font widens them).
- **Build:** React and the other libraries are split into long-lived chunks; app code is about
  45 kB gzipped.

## Environment pitfalls (Windows machine)

- PowerShell 5.1 `Get-Content`/`Set-Content` corrupt UTF-8 (’ — ·). Edit files with proper
  tools, or pass `-Encoding utf8`.
- Case-insensitive filesystem: `tour.ts` and `Tour.tsx` collided, so the state module is
  `tourState.ts`.
- Vite's watcher missed rapid successive writes; `server.watch.awaitWriteFinish` fixes it.
- `git commit` exits 255 on CRLF warnings even when it succeeds. `.gitattributes` forces LF.
- The embedded test browser pauses rendering and `requestAnimationFrame` when the window is
  hidden, so don't make UI depend on rAF to appear (the tour uses timers).

## Good next steps

1. Deploy `dist/` to a static HTTPS host (Netlify, Vercel, Cloudflare Pages, GitHub Pages; note
   `base` if served from a subpath), then install on a phone and test notifications for real.
2. Phase 5: Capacitor Android wrapper with `@capacitor/local-notifications` for scheduled
   reminders while closed.
3. Playwright end-to-end tests, including iOS Safari (WebKit).
4. Nice to have:
   - Undo for deletes.
   - Renormalise task `order` after many drags.
   - Version routine schedules, so editing repeat days doesn't rewrite past streak days.
   - Queue toasts rather than showing one at a time.
