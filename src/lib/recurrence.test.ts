import { at, done, makeTask } from '../test/factories';
import { addDays } from './dates';
import { isDoneOn, normaliseRepeat, repeatLabel, tasksForDay } from './recurrence';

describe('tasksForDay', () => {
  it('shows a weekday routine Monday to Friday only', () => {
    const routine = makeTask({ repeat: { kind: 'weekdays' }, createdAt: at('2026-10-01') });
    // Mon 5 Oct 2026 … Sun 11 Oct 2026
    const shown = Array.from({ length: 7 }, (_, i) => addDays('2026-10-05', i)).map(
      (date) => tasksForDay([routine], date).length === 1,
    );
    expect(shown).toEqual([true, true, true, true, true, false, false]);
  });

  it('shows a daily routine every day from the day it was created', () => {
    const routine = makeTask({ repeat: { kind: 'daily' }, createdAt: at('2026-10-05', 21) });
    expect(tasksForDay([routine], '2026-10-04')).toHaveLength(0);
    expect(tasksForDay([routine], '2026-10-05')).toHaveLength(1);
    expect(tasksForDay([routine], '2026-11-30')).toHaveLength(1);
  });

  it('shows a routine on chosen days', () => {
    const routine = makeTask({ repeat: { kind: 'days', days: [1, 3, 5] } });
    expect(tasksForDay([routine], '2026-10-05')).toHaveLength(1); // Mon
    expect(tasksForDay([routine], '2026-10-06')).toHaveLength(0); // Tue
    expect(tasksForDay([routine], '2026-10-07')).toHaveLength(1); // Wed
  });

  it('shows one-off tasks only on their planned day and hides archived tasks', () => {
    const planned = makeTask({ date: '2026-10-05' });
    const archived = makeTask({ date: '2026-10-05', archived: true });
    const archivedRoutine = makeTask({ repeat: { kind: 'daily' }, archived: true });
    expect(tasksForDay([planned, archived, archivedRoutine], '2026-10-05')).toEqual([planned]);
    expect(tasksForDay([planned], '2026-10-06')).toEqual([]);
  });

  it('keeps the user order', () => {
    const a = makeTask({ date: '2026-10-05', order: 3 });
    const b = makeTask({ date: '2026-10-05', order: 1 });
    const c = makeTask({ repeat: { kind: 'daily' }, order: 2 });
    expect(tasksForDay([a, b, c], '2026-10-05').map((t) => t.id)).toEqual([b.id, c.id, a.id]);
  });
});

describe('isDoneOn', () => {
  it('checks the task and the day', () => {
    const completions = [done('a', '2026-10-05')];
    expect(isDoneOn('a', '2026-10-05', completions)).toBe(true);
    expect(isDoneOn('a', '2026-10-06', completions)).toBe(false);
    expect(isDoneOn('b', '2026-10-05', completions)).toBe(false);
  });
});

describe('repeat labels', () => {
  it('names the schedule plainly', () => {
    expect(repeatLabel({ kind: 'none' })).toBe('');
    expect(repeatLabel({ kind: 'daily' })).toBe('Daily');
    expect(repeatLabel({ kind: 'weekdays' })).toBe('Weekdays');
    expect(repeatLabel({ kind: 'days', days: [0, 6] })).toBe('Weekends');
    expect(repeatLabel({ kind: 'days', days: [5, 1, 3] })).toBe('Mon, Wed, Fri');
    expect(repeatLabel({ kind: 'days', days: [0, 1] }, 0)).toBe('Sun, Mon');
    expect(repeatLabel({ kind: 'days', days: [0, 1] }, 1)).toBe('Mon, Sun');
  });

  it('normalises chosen days', () => {
    expect(normaliseRepeat({ kind: 'days', days: [0, 1, 2, 3, 4, 5, 6] })).toEqual({
      kind: 'daily',
    });
    expect(normaliseRepeat({ kind: 'days', days: [5, 4, 3, 2, 1] })).toEqual({ kind: 'weekdays' });
    expect(normaliseRepeat({ kind: 'days', days: [3, 1, 1] })).toEqual({
      kind: 'days',
      days: [1, 3],
    });
  });
});
