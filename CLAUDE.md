# Ascent

A personal planning app built on one idea: everything you do today is part of a climb.
Work is organised by altitude, from today's tasks up to the dreams you're reaching for.
Tagline: **The sky is the limit.**

| Altitude | What lives there | Time horizon |
|---|---|---|
| Camp | Daily tasks and routines | Today |
| Ridge | Objectives | This week, month or quarter |
| Summit | Long-term goals | A year or more |
| Sky | Dreams, and everything already reached | No deadline |

The full product spec is in `docs/PRODUCT.md`. The design system and screen layouts are in
`docs/DESIGN.md`. Read both before starting a phase, and re-read the relevant section before
building any screen.

## How to work with me

- I learn best by building step by step. Explain a new concept in one or two sentences the
  first time it comes up, then move on.
- Build one phase at a time (phases are in `docs/PRODUCT.md` §9). At the start of a phase,
  give me a short plan and wait for my OK. At the end, tell me how to run it and what to
  click to check each acceptance criterion.
- If something in the spec is unclear or looks wrong, ask me instead of guessing.
- Commit after each working step with a clear message.

## Stack

- Vite + React + TypeScript (strict mode)
- Styling: plain CSS with custom properties (tokens in `src/styles/tokens.css`) plus CSS
  Modules per component. No Tailwind, no component library. The design is custom.
- Icons: `lucide-react`. No emoji as UI icons.
- Local data: IndexedDB through Dexie and `dexie-react-hooks` (`useLiveQuery`).
  No backend, no accounts. All data stays on the device.
- Dates: `date-fns`. Every "day" uses the device's local time zone and is stored as a
  `YYYY-MM-DD` string.
- Motion: `motion` (Framer Motion), only for the moments listed in `docs/DESIGN.md` §6.
- PWA: `vite-plugin-pwa` (installable, works offline).
- Tests: Vitest + React Testing Library.
- Lint and format: ESLint + Prettier.

Use current stable versions of each package.

## Commands

Fill these in once the project is scaffolded, and keep them up to date.

- `npm run dev`
- `npm run build`
- `npm run test`
- `npm run lint`

## Project structure

```
src/
  app/          App shell, routing, altitude navigation and transitions
  db/           Dexie schema, versioned migrations, data-access functions
  features/
    camp/       Today: tasks, routines, carry-over, streak, dream glimpse
    ridge/      Objectives
    summit/     Goals and milestones
    sky/        Dreams, starfield, constellation, horizon
    reminders/  Notifications, in-app reminders, .ics calendar export
    settings/   Preferences, backup and restore
    onboarding/ First-run flow
  lib/          Pure logic with unit tests: dates, recurrence, streak, progress,
                altimeter, dream of the day, star positions
  components/   Shared UI: Button, Checkbox, Sheet, Field, LinkTag, ClimbLine…
  styles/       tokens.css, globals.css, fonts
```

## Rules

- Keep logic (recurrence, streaks, progress, altitude, star placement) in `src/lib` as plain
  functions with unit tests. Components stay thin.
- App data never goes in `localStorage`. Everything goes through `src/db`. `localStorage` is
  only for small UI conveniences, wrapped in try/catch.
- Any schema change means a new Dexie version with a migration. Never break existing data.
- Every colour, font, radius and spacing value comes from tokens. No hard-coded hex values in
  components.
- Accessibility is part of done: keyboard reachable, visible focus, a label on every
  control, `prefers-reduced-motion` respected, WCAG AA contrast in every altitude theme,
  touch targets at least 44px.
- Copy follows `docs/DESIGN.md` §7: sentence case, plain verbs, no all-caps labels.
- Sample and seed data must be generic. Never use real names, employers or personal details.
