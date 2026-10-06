import { at, done, makeGoal, makeMilestone, makeObjective } from '../test/factories';
import { altimeter, altitudeRecords, formatAltitude, formatGain } from './altimeter';

describe('altimeter', () => {
  it('adds 10 m per task, 250 m per milestone, 100 m per objective, 1,000 m per summit', () => {
    const records = altitudeRecords(
      [done('a', '2026-10-05'), done('b', '2026-10-05')],
      [makeObjective({ status: 'done', doneAt: at('2026-10-05') })],
      [
        makeGoal({
          milestones: [makeMilestone({ doneAt: at('2026-10-05') }), makeMilestone()],
          status: 'reached',
          reachedAt: at('2026-10-05'),
        }),
      ],
    );
    expect(altimeter(records, '2026-10-05')).toEqual({ today: 1370, total: 1370 });
  });

  it("splits today's climb from the lifetime total", () => {
    const records = altitudeRecords(
      [done('a', '2026-10-04'), done('a', '2026-10-05')],
      [makeObjective({ status: 'done', doneAt: at('2026-10-01') })],
      [],
    );
    expect(altimeter(records, '2026-10-05')).toEqual({ today: 10, total: 120 });
  });

  it('respects month boundaries', () => {
    const records = altitudeRecords([done('a', '2026-10-31')], [], []);
    expect(altimeter(records, '2026-11-01')).toEqual({ today: 0, total: 10 });
  });

  it('reverses when something is unchecked, because it is derived from records', () => {
    const completions = [done('a', '2026-10-05'), done('b', '2026-10-05')];
    const before = altimeter(altitudeRecords(completions, [], []), '2026-10-05');
    const after = altimeter(altitudeRecords(completions.slice(1), [], []), '2026-10-05');
    expect(before.today - after.today).toBe(10);
  });

  it('ignores open objectives, unfinished milestones and active summits', () => {
    const records = altitudeRecords(
      [],
      [makeObjective({ status: 'open' })],
      [makeGoal({ milestones: [makeMilestone()], status: 'active' })],
    );
    expect(altimeter(records, '2026-10-05')).toEqual({ today: 0, total: 0 });
  });

  it('formats metres and feet', () => {
    expect(formatAltitude(4320, 'm')).toBe('4,320 m');
    expect(formatGain(60, 'm')).toBe('+60 m');
    expect(formatAltitude(10, 'ft')).toBe('33 ft');
    expect(formatAltitude(1000, 'ft')).toBe('3,281 ft');
  });
});
