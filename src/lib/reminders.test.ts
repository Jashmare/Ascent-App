import { DEFAULT_SETTINGS } from '../db/settings';
import { bytesToBase64, base64ToBytes } from './base64';
import { dueReminders, midSentence, type ReminderContext } from './reminders';

function context(overrides: Partial<ReminderContext> = {}): ReminderContext {
  return {
    today: '2026-10-11', // a Sunday
    minute: 7 * 60 + 5,
    weekday: 0,
    settings: structuredClone(DEFAULT_SETTINGS.reminders),
    log: {},
    tasksToday: 4,
    unfinishedToday: 2,
    glimpse: 'A studio by the sea',
    dueSoon: [],
    reviewedToday: false,
    ...overrides,
  };
}

describe('dueReminders', () => {
  it('sends the morning reminder from 07:00 with the day and a dream', () => {
    expect(dueReminders(context({ minute: 6 * 60 + 59 })).due).toEqual([]);
    const [morning] = dueReminders(context()).due;
    expect(morning.body).toBe('Today’s climb: 4 tasks. Still reaching for: a studio by the sea.');
  });

  it('fires each reminder at most once a day', () => {
    expect(dueReminders(context({ log: { morning: '2026-10-11' } })).due).toEqual([]);
    expect(dueReminders(context({ log: { morning: '2026-10-10' } })).due).toHaveLength(1);
  });

  it('only checks in at night when tasks are unfinished, and only when switched on', () => {
    const settings = structuredClone(DEFAULT_SETTINGS.reminders);
    settings.morning.on = false;
    settings.weeklyReview.on = false;
    expect(dueReminders(context({ minute: 20 * 60 + 1, settings })).due).toEqual([]);
    settings.evening.on = true;
    expect(dueReminders(context({ minute: 20 * 60 + 1, settings })).due[0].body).toBe(
      '2 tasks left today. Still time.',
    );
    expect(
      dueReminders(context({ minute: 20 * 60 + 1, settings, unfinishedToday: 0 })).due,
    ).toEqual([]);
  });

  it('reminds about objectives due today and tomorrow', () => {
    const { due } = dueReminders(
      context({
        dueSoon: [
          { id: 'o1', title: 'Finish portfolio', when: 'tomorrow' },
          { id: 'o2', title: 'Send the invoice', when: 'today' },
        ],
      }),
    );
    expect(due.map((r) => r.body)).toContain('Finish portfolio is due tomorrow.');
    expect(due.map((r) => r.body)).toContain('Send the invoice is due today.');
  });

  it('asks for the weekly review on review day, unless it is done', () => {
    const evening = 18 * 60 + 10;
    expect(
      dueReminders(context({ minute: evening, log: { morning: '2026-10-11' } })).due[0].body,
    ).toBe('Time to look at the week from the ridge.');
    expect(
      dueReminders(context({ minute: evening, weekday: 1, log: { morning: '2026-10-11' } })).due,
    ).toEqual([]);
    expect(
      dueReminders(
        context({ minute: evening, reviewedToday: true, log: { morning: '2026-10-11' } }),
      ).due,
    ).toEqual([]);
  });

  it('nudges with a dream’s picture-it note when switched on', () => {
    const settings = structuredClone(DEFAULT_SETTINGS.reminders);
    settings.dreamNudge = { on: true, day: 0, time: '12:00' };
    const { due } = dueReminders(
      context({
        minute: 12 * 60,
        settings,
        log: { morning: '2026-10-11' },
        nudge: { title: 'A studio by the sea', vision: 'Morning light on the workbench.' },
      }),
    );
    expect(due).toEqual([
      {
        id: 'dream-nudge',
        title: 'A studio by the sea',
        body: 'Morning light on the workbench.',
        screen: 'sky',
      },
    ]);
  });

  it('skips reminders that are hours late', () => {
    const { due, stale } = dueReminders(context({ minute: 12 * 60 }));
    expect(due).toEqual([]);
    expect(stale).toEqual(['morning']);
  });

  it('keeps names capitalised mid-sentence', () => {
    expect(midSentence('A studio by the sea')).toBe('a studio by the sea');
    expect(midSentence('Paris in spring')).toBe('Paris in spring');
  });
});

describe('base64', () => {
  it('round-trips bytes, including large ones', () => {
    const bytes = new Uint8Array(200_000).map((_, i) => (i * 31) % 256);
    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
    expect(bytesToBase64(new TextEncoder().encode('Ascent'))).toBe('QXNjZW50');
  });
});
