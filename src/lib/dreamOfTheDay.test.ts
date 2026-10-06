import type { Dream, Goal } from '../db/types';
import { at, makeDream, makeGoal } from '../test/factories';
import { addDays } from './dates';
import { dreamOfTheDay } from './dreamOfTheDay';

const days = (count: number) => Array.from({ length: count }, (_, i) => addDays('2026-10-01', i));

describe('dreamOfTheDay', () => {
  it('is empty with no dreams still being dreamed', () => {
    expect(dreamOfTheDay([], [], '2026-10-05')).toBeUndefined();
    expect(dreamOfTheDay([makeDream({ status: 'reached' })], [], '2026-10-05')).toBeUndefined();
  });

  it('is deterministic for a date', () => {
    const dreams = [makeDream(), makeDream(), makeDream()];
    expect(dreamOfTheDay(dreams, [], '2026-10-05')).toBe(dreamOfTheDay(dreams, [], '2026-10-05'));
    // Same answer regardless of the order the dreams arrive in.
    expect(dreamOfTheDay([...dreams].reverse(), [], '2026-10-05')?.id).toBe(
      dreamOfTheDay(dreams, [], '2026-10-05')?.id,
    );
  });

  it('never repeats on consecutive days when there are two or more', () => {
    const scenarios: { dreams: Dream[]; goals: Goal[] }[] = [
      { dreams: [makeDream(), makeDream()], goals: [] },
      { dreams: [makeDream(), makeDream(), makeDream(), makeDream()], goals: [] },
    ];
    const pathed = [makeDream(), makeDream(), makeDream()];
    scenarios.push({ dreams: pathed, goals: [makeGoal({ dreamId: pathed[0].id })] });
    scenarios.push({
      dreams: pathed,
      goals: [makeGoal({ dreamId: pathed[0].id }), makeGoal({ dreamId: pathed[1].id })],
    });
    for (const { dreams, goals } of scenarios) {
      const picks = days(400).map((d) => dreamOfTheDay(dreams, goals, d)?.id);
      for (let i = 1; i < picks.length; i++) expect(picks[i]).not.toBe(picks[i - 1]);
    }
  });

  it('changes daily', () => {
    const dreams = [makeDream(), makeDream(), makeDream()];
    expect(dreamOfTheDay(dreams, [], '2026-10-05')?.id).not.toBe(
      dreamOfTheDay(dreams, [], '2026-10-06')?.id,
    );
  });

  it('prefers dreams linked to an active summit, without hiding the others for good', () => {
    const linked = makeDream({ createdAt: at('2026-01-01') });
    const others = [
      makeDream({ createdAt: at('2026-01-02') }),
      makeDream({ createdAt: at('2026-01-03') }),
    ];
    const goals = [makeGoal({ dreamId: linked.id, status: 'active' })];
    const picks = days(60).map((d) => dreamOfTheDay([linked, ...others], goals, d)?.id);
    const linkedShare = picks.filter((id) => id === linked.id).length / picks.length;
    expect(linkedShare).toBe(0.5);
    for (const other of others) expect(picks).toContain(other.id);
  });

  it('ignores summits that are reached', () => {
    const a = makeDream({ createdAt: at('2026-01-01') });
    const b = makeDream({ createdAt: at('2026-01-02') });
    const goals = [makeGoal({ dreamId: a.id, status: 'reached' })];
    const picks = days(4).map((d) => dreamOfTheDay([a, b], goals, d)?.id);
    expect(new Set(picks).size).toBe(2);
  });
});
