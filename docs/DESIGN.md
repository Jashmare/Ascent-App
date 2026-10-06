# Ascent — design system

## 1. The idea

The app is a climb, and the interface rises with you. Colour, light and type change with
altitude. Camp is early morning mist at the trailhead. Each altitude above it is higher, cooler
and clearer. The Sky is dusk turning into night, full of stars. Moving up should feel like
rising, and arriving in the Sky should feel like looking up.

**Spend the boldness in one place: the Sky.** Camp, Ridge and Summit are used every day, so
they stay calm, quick and practical. The Sky is the one atmospheric screen. It's the only dark
screen in light mode, which makes entering it feel like nightfall.

**One colour ties the climb together.** The sunrise gold you earn at Camp every morning is the
same gold that lights a reached star in the Sky.

## 2. Colour

All values live in `src/styles/tokens.css` as custom properties. Each altitude sets the same
token names (`--bg`, `--accent`, `--accent-strong`) on its own container, so components never
need to know which altitude they're in.

- `--accent` is a bright fill. Text on it is always `--ink`.
- `--accent-strong` is for text, icons and focus rings on the altitude background.

### Light theme

Shared

| Token | Hex | Use |
|---|---|---|
| `--ink` (basalt) | `#1D2730` | Primary text |
| `--ink-soft` (slate) | `#4F5D66` | Secondary text |
| `--surface` (snow) | `#FAFBFA` | Panels, sheets, fields |
| `--line` (rime) | `#CDD6D3` | Borders and dividers |
| `--danger` | `#A3402A` | Overdue, destructive actions |

Altitudes

| Altitude | `--bg` | `--accent` | `--accent-strong` |
|---|---|---|---|
| Camp | `#E9EEEA` mist | `#F0B53A` sunrise | `#7D5600` |
| Ridge | `#DDE9E2` fir haze | `#7CC4A0` meadow | `#2B6A4E` pine |
| Summit | `#DEE8F1` glacier | `#9CCBEE` ice | `#2E5E8E` crevasse |

Sky (the same in both themes, slightly deeper in dark)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--sky-top` | `#2A2560` dusk | `#1A1747` | Top of the gradient |
| `--sky-bottom` | `#0E1130` night | `#05071A` | Bottom of the gradient |
| `--sky-ink` | `#EEF0FF` | `#EEF0FF` | Text |
| `--sky-ink-soft` | `#A9B0D6` | `#A9B0D6` | Secondary text |
| `--sky-surface` | `#1B1E47` | `#12143A` | Sheets on the Sky |
| `--sky-line` | `#3A3F78` | `#2C3068` | Constellation lines, borders |
| `--star` | `#D7DEFF` | `#D7DEFF` | Dream stars |
| `--gold` | `#F5C451` | `#F5C451` | Reached stars |
| `--horizon` | `#080A22` | `#03040F` | Mountain silhouette |

### Dark theme

Pre-dawn versions of the lower altitudes.

| Token | Hex |
|---|---|
| `--ink` | `#E8EDEB` |
| `--ink-soft` | `#9FADB3` |
| `--surface` | `#1C2428` |
| `--line` | `#2E3A3F` |
| `--danger` | `#F08A72` |

| Altitude | `--bg` | `--accent` | `--accent-strong` |
|---|---|---|---|
| Camp | `#141B1D` | `#F0B53A` | `#F0B53A` |
| Ridge | `#111D18` | `#7CC4A0` | `#7CC4A0` |
| Summit | `#111923` | `#9CCBEE` | `#9CCBEE` |

Theme switching: respect `prefers-color-scheme` by default, with a manual override in Settings
written to `data-theme` on `<html>`.

**The only gradient in the app is the Sky.** Nothing else gets a gradient wash.

Every text and background pair above has been checked and passes WCAG AA (4.5:1 or better).
If you add or change a colour, re-check it and keep it at 4.5:1 or above.

## 3. Type

Two families, each with one job.

| Family | Role |
|---|---|
| **Schibsted Grotesk** (400, 500, 700) | Everything practical: navigation, tasks, objectives, summits, numbers, buttons |
| **Newsreader** (italic 400, roman 500, optical sizes) | Everything hopeful: dream titles, "why it matters", "picture it", reflections, the dream glimpse, the reaching ceremony |

**The rule: if it's something you do, it's set in the grotesk. If it's something you hope
for, it's set in the serif.** The type itself shows the shift from doing to dreaming.

Self-host both fonts (Fontsource packages or downloaded files) so they work offline.

Scale, base 16px, ratio 1.25. Use rem.

| Token | Size | Use |
|---|---|---|
| `--text-xs` | 0.8rem | Link tags, captions |
| `--text-sm` | 0.875rem | Secondary text, due labels |
| `--text-md` | 1rem | Body, task titles |
| `--text-lg` | 1.25rem | Section headings, summit titles |
| `--text-xl` | 1.563rem | Dream titles in sheets |
| `--text-2xl` | 1.953rem | Altitude titles |
| `--text-3xl` | 2.441rem | The Sky title, ceremony text |

- Line height: 1.5 for the grotesk, 1.6 for the serif.
- Tabular numerals (`font-variant-numeric: tabular-nums`) for the altimeter, counts and dates.
- Sentence case everywhere. No all-caps, no letter-spaced labels above headings.
- Keep text lines under 70 characters.

## 4. Layout and navigation

**Mobile first.** Design at 360–430px wide. On larger screens, content sits in a centred
column with a maximum width of 640px. Content is left-aligned. Side gutters are 16px on
mobile and 24px from 600px up.

**Navigation**
- Mobile: bottom bar with four stops in climbing order, left to right: Camp, Ridge, Summit, Sky.
  Icon plus label. The current stop uses `--accent-strong`. Settings is an icon in the header.
- Desktop (900px and up): an altitude rail on the left, like an altimeter. Stops are stacked
  bottom to top (Camp at the bottom, Sky at the top), joined by a thin vertical line, with a
  marker on the current altitude.

**Header** on Camp, Ridge and Summit: altitude title on the left, altimeter readout on the
right ("+60 m today" over "4,320 m climbed", tabular numerals). Camp adds the date and a
greeting beneath the title.

**Spacing** scale (4px base): 4, 8, 12, 16, 24, 32, 48, 64.

**Radii** carry hierarchy, so they differ by role:

| Element | Radius |
|---|---|
| Sheets and dialogs | 24px (top corners only on mobile) |
| Panels | 16px |
| Fields and buttons | 12px |
| Task checkbox | 8px |
| Chips and link tags | 999px |

**Depth:** on Camp, Ridge and Summit, panels have a 1px `--line` border and no shadow. Only
sheets cast a shadow. In the Sky, depth comes from glow, not shadow.

Content is grouped by meaning, not chopped into identical cards. A list of tasks is one panel
with dividers between rows, not a card per task.

## 5. Screens and components

### Camp

```
┌──────────────────────────────────────┐
│ ·   Still reaching for         ·     │  dream glimpse: 64px strip of night sky,
│   A studio by the sea   ·            │  serif italic title, a few static stars
├──────────────────────────────────────┤
│ Camp                     +60 m today │
│ Monday, 5 October     4,320 m climbed│
│ Good morning                         │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ Add a task for today          ⏎  │ │
│ ├──────────────────────────────────┤ │
│ │ ☐ Reply to the recruiter email   │ │
│ │ ☑ Morning walk          ↻ Daily  │ │
│ │ ☐ Draft the case study           │ │
│ │   ⤴ Refresh portfolio            │ │  link tag to its objective
│ └──────────────────────────────────┘ │
│                                      │
│  ____/\___•                          │  climb line: progress as a trail
│ 3 of 5 done            6-day streak  │
│                                      │
│ Next on the ridge                    │
│ Refresh portfolio       3 days left  │
└──────────────────────────────────────┘
  Camp     Ridge     Summit     Sky
```

### Ridge

```
┌──────────────────────────────────────┐
│ Ridge                    +60 m today │
│                                      │
│ [ Add an objective               ⏎ ] │
│                                      │
│ Overdue                              │
│ ☐ Send the invoice      2 days over  │  --danger
│                                      │
│ This week                            │
│ ☐ Refresh portfolio      3 days left │
│   ⤴ Lead my own design team          │
│   4 tasks done                       │
│                                      │
│ This month                           │
│ ☐ Finish the course module  Oct 28   │
└──────────────────────────────────────┘
```

Group headings are sentence case in `--text-sm`, weight 500, `--ink-soft`. No capitals.

### Summit

```
┌──────────────────────────────────────┐
│ Summit                   +60 m today │
│                                      │
│  ▲  Lead my own design team      62% │  peak glyph: snowline fills to progress
│     Next: Mentor one junior designer │
│     Leads toward: A studio by the sea│  serif italic
│ ─────────────────────────────────────│
│  ▲  Run a half marathon          20% │
│     Next: Run 10 km without stopping │
└──────────────────────────────────────┘
```

Summits are rows in one panel, not separate cards. Each has a small **peak glyph** (24–32px)
that fills from the base upward to its progress, like a snowline. This replaces a generic
progress bar.

### Sky

```
┌──────────────────────────────────────┐
│ The sky is the limit        ☰ List   │  serif, --text-3xl
│ 6 dreams   2 reached   4,320 m       │
│                                      │
│     ·          ✦                     │
│  ✦       ·   A studio by the sea     │  label on 3 stars at rest, others on focus
│          ★────★                      │  gold reached stars, joined in order
│   ·            ╲                     │
│                 ★                    │
│     ✦                  ·             │
│                                      │
│    /\      /\  /\        /\          │  horizon: one peak per active summit,
│ __/  \____/  \/  \______/  \________ │  height = its progress
│        [ + Add a dream ]             │
└──────────────────────────────────────┘
```

- Background: vertical gradient `--sky-top` to `--sky-bottom`, full bleed behind the nav.
- A faint fixed field of tiny background stars (decorative, `aria-hidden`), separate from
  dream stars.
- Dream stars: 10–14px four-point stars in `--star`, with a soft glow.
- Reached stars: 14–18px in `--gold`, stronger glow, joined by 1px `--sky-line` lines.
- Star labels: Newsreader italic, `--sky-ink`, with a subtle dark text shadow for legibility.
- Sheets on the Sky use `--sky-surface` and `--sky-ink`, with dream text in the serif.

### Components

- **Quick add field**: a single line inside the list panel's first row. Enter adds. An
  expand control reveals "Link to objective" and "Repeat".
- **Task checkbox**: 24px, radius 8px, 1.5px `--ink-soft` border. Checked: `--accent` fill,
  check icon in `--ink`. The whole row is the hit target (44px minimum height).
- **Link tag**: small pill under a title, "⤴ Objective name", `--text-xs`, `--ink-soft`.
  Tapping it opens the linked item.
- **Climb line**: an SVG trail that rises from left to right across the panel width. The
  walked part is drawn in `--accent-strong`, the rest in `--line`, with a dot at the current
  point. Label below in plain text: "3 of 5 done".
- **Peak glyph**: a triangle outline with a fill that rises to the progress level.
- **Sheet**: slides up from the bottom on mobile, centred dialog on desktop. Close button,
  Escape to close, focus trapped while open, focus returned on close.
- **Buttons**: primary is `--accent` fill with `--ink` text. Secondary is a `--line` outline.
  Destructive is `--danger` text.
- **Empty states**: one line of direction and the add control right beneath it.
- **App icon**: a single peak with one gold star above it, on `--sky-top`.

## 6. Motion

Only these moments move. Nothing animates on page load.

1. **Changing altitude.** Going up, the current screen slides down and fades while the new one
   enters from above; going down is the reverse. 260ms, ease-out. The background colour
   crossfades over 400ms. With reduced motion: a 120ms crossfade only.
2. **Checking a task.** The check mark draws in (150ms) and "+10 m" floats up 12px and fades
   (600ms). With reduced motion: no float, the check simply appears.
3. **Reaching a summit or a dream — the one big moment.** The item lifts and shrinks to a point
   of light that rises off the top of the screen. The Sky opens, the new gold star ignites, and
   a line draws from the previous reached star to it. Text fades in, in the serif:
   "Reached. It's in your sky now." Around 1.6s in total, skippable with a tap or Escape.
   With reduced motion: go straight to the Sky with the star already lit and the text faded in.
4. **Twinkle.** Dream stars only, a very slow opacity change between 0.7 and 1 over 3–6s,
   each star on its own random timing. Paused when the tab is hidden and off entirely with
   reduced motion.

No confetti, no bouncing, no hover animations on rows.

## 7. Copy and voice

Warm, plain and brief. Encouraging without cheerleading.

- Sentence case everywhere. Plain verbs. No exclamation marks except in the ceremony, and
  even there, prefer none.
- Buttons say exactly what happens: "Add task", "Bring them to today", "Mark as reached",
  "Back up data". The confirmation uses the same verb: "Reached", "Backed up".
- Write from the user's side: "Your sky", not "Dream database".

**Empty states**

| Screen | Copy |
|---|---|
| Camp | Nothing planned for today yet. Add the first thing you'll do. |
| Ridge | No objectives yet. What do you want done by the end of this month? |
| Summit | No summits yet. Pick something worth a year or more of climbing. |
| Sky | Your sky is open. Add a dream — no deadline needed. |

**Key lines**

| Moment | Copy |
|---|---|
| Dream glimpse | Still reaching for |
| First run | Start with the sky. What's one thing you dream of? |
| Streak ended | Fresh start today. |
| All tasks done | Today's climb is done. |
| Reached | Reached. It's in your sky now. |
| Reflection prompt | How does it feel to be here? |
| Dream form | Why does this matter to you? / Picture it. |
| Error | Say what went wrong and how to fix it. Never apologise, never be vague. |

## 8. Accessibility

- WCAG AA contrast for every text and background pair, in every altitude and both themes.
- Every interactive element reachable by keyboard, in a sensible order, with a visible
  2px focus ring in `--accent-strong` (in the Sky, `--gold`) offset by 2px.
- Touch targets at least 44 × 44px.
- Stars are real buttons with labels such as "Dream: A studio by the sea, still reaching" or
  "Reached summit: Run a half marathon, reached 12 March 2026".
- The list view in the Sky shows everything the starfield shows.
- Progress glyphs and the climb line always have a text equivalent next to them.
- Sizes in rem so text scales with the user's settings.
- `prefers-reduced-motion` handled as described in §6.

## 9. Avoid

- Identical rounded cards with soft grey shadows for every item.
- Gradient washes anywhere except the Sky.
- All-caps or letter-spaced labels above headings.
- Emoji as UI icons, confetti, streak-shaming copy.
- Generic progress bars where the climb line or peak glyph should be used.
- Placeholder content that uses real names, employers or personal details.
