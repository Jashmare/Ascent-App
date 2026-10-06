import { at, done, makeTask } from '../test/factories';
import { addDays } from './dates';
import { streak } from './streak';

function daysFrom(start: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

describe('streak', () => {
  it('is zero with no tasks', () => {
    expect(streak([], [], '2026-10-05')).toEqual({ current: 0, longest: 0 });
  });

  it('counts consecutive complete days and lets an unfinished today stay in progress', () => {
    const routine = makeTask({ repeat: { kind: 'daily' }, createdAt: at('2026-10-01') });
    const completions = daysFrom('2026-10-02', 3).map((d) => done(routine.id, d)); // 2–4 Oct
    // Today (5 Oct) isn't done yet, but the day isn't over, so the streak holds.
    expect(streak([routine], completions, '2026-10-05')).toEqual({ current: 3, longest: 3 });
    // Finishing today extends it.
    expect(
      streak([routine], [...completions, done(routine.id, '2026-10-05')], '2026-10-05'),
    ).toEqual({ current: 4, longest: 4 });
  });

  it('ends when a past day was left unfinished, but remembers the longest', () => {
    const routine = makeTask({ repeat: { kind: 'daily' }, createdAt: at('2026-10-01') });
    const completions = daysFrom('2026-10-01', 3).map((d) => done(routine.id, d)); // 1–3 Oct
    // 4 Oct missed. Today is 5 Oct and not done yet.
    expect(streak([routine], completions, '2026-10-05')).toEqual({ current: 0, longest: 3 });
  });

  it('skips days with no tasks: they neither add to nor break the streak', () => {
    const routine = makeTask({ repeat: { kind: 'weekdays' }, createdAt: at('2026-09-28') });
    // Thu 1, Fri 2, (weekend: nothing planned), Mon 5 Oct.
    const completions = ['2026-10-01', '2026-10-02', '2026-10-05'].map((d) => done(routine.id, d));
    expect(streak([routine], completions, '2026-10-05').current).toBe(3);
    // Mon 28 Sep – Wed 30 Sep were missed, so the run starts on Thursday.
    expect(streak([routine], completions, '2026-10-05').longest).toBe(3);
  });

  it('runs across a month boundary', () => {
    const routine = makeTask({ repeat: { kind: 'daily' }, createdAt: at('2026-01-30') });
    const completions = daysFrom('2026-01-30', 4).map((d) => done(routine.id, d)); // 30 Jan – 2 Feb
    expect(streak([routine], completions, '2026-02-02')).toEqual({ current: 4, longest: 4 });
  });

  it('runs across a year boundary and a leap day', () => {
    const routine = makeTask({ repeat: { kind: 'daily' }, createdAt: at('2027-12-30') });
    const yearEnd = daysFrom('2027-12-30', 4).map((d) => done(routine.id, d));
    expect(streak([routine], yearEnd, '2028-01-02').current).toBe(4);

    const leap = makeTask({ repeat: { kind: 'daily' }, createdAt: at('2028-02-28') });
    const leapDays = ['2028-02-28', '2028-02-29', '2028-03-01'].map((d) => done(leap.id, d));
    expect(streak([leap], leapDays, '2028-03-01').current).toBe(3);
  });

  it('needs every task planned that day, one-off tasks included', () => {
    const routine = makeTask({ repeat: { kind: 'daily' }, createdAt: at('2026-10-03') });
    const oneOff = makeTask({ date: '2026-10-04' });
    const completions = [done(routine.id, '2026-10-03'), done(routine.id, '2026-10-04')];
    // 4 Oct had an unfinished one-off task, so it breaks.
    expect(streak([routine, oneOff], completions, '2026-10-05')).toEqual({
      current: 0,
      longest: 1,
    });
    // Once it's done, the run is unbroken.
    expect(
      streak([routine, oneOff], [...completions, done(oneOff.id, '2026-10-04')], '2026-10-05'),
    ).toEqual({ current: 2, longest: 2 });
  });

  it('ignores archived tasks and tasks planned for later', () => {
    const routine = makeTask({ repeat: { kind: 'daily' }, createdAt: at('2026-10-03') });
    const archived = makeTask({ date: '2026-10-04', archived: true });
    const later = makeTask({ date: '2026-10-09' });
    const completions = ['2026-10-03', '2026-10-04'].map((d) => done(routine.id, d));
    expect(streak([routine, archived, later], completions, '2026-10-05').current).toBe(2);
  });
});
