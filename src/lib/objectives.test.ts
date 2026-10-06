import { done, makeObjective, makeTask } from '../test/factories';
import {
  dueLabel,
  groupObjectives,
  horizonForDate,
  linkedTasksDone,
  nextOnRidge,
  objectiveGroup,
} from './objectives';

// Wednesday 7 October 2026. With weeks starting Monday, this week ends Sunday 11 October.
const today = '2026-10-07';

describe('objective groups', () => {
  it('puts objectives past their due date in Overdue', () => {
    expect(objectiveGroup(makeObjective({ dueDate: '2026-10-05' }), today, 1)).toBe('overdue');
  });

  it('lets the due date decide when there is one', () => {
    const quarterButSoon = makeObjective({ horizon: 'quarter', dueDate: '2026-10-09' });
    expect(objectiveGroup(quarterButSoon, today, 1)).toBe('week');
    expect(objectiveGroup(makeObjective({ dueDate: '2026-10-28' }), today, 1)).toBe('month');
    expect(objectiveGroup(makeObjective({ dueDate: '2026-12-01' }), today, 1)).toBe('quarter');
    expect(
      objectiveGroup(makeObjective({ horizon: 'someday', dueDate: '2027-03-01' }), today, 1),
    ).toBe('someday');
  });

  it('uses the chosen horizon without a due date', () => {
    expect(objectiveGroup(makeObjective({ horizon: 'week' }), today, 1)).toBe('week');
    expect(objectiveGroup(makeObjective({ horizon: 'someday' }), today, 1)).toBe('someday');
  });

  it('respects the week start setting', () => {
    // Sunday 11 Oct is in this week when weeks start Monday, but next week when they start Sunday.
    expect(horizonForDate('2026-10-11', today, 1)).toBe('week');
    expect(horizonForDate('2026-10-11', today, 0)).toBe('month');
  });

  it('orders groups and hides empty ones', () => {
    const groups = groupObjectives(
      [
        makeObjective({ title: 'Later', horizon: 'someday' }),
        makeObjective({ title: 'Late', dueDate: '2026-10-01' }),
        makeObjective({ title: 'Soon', dueDate: '2026-10-08' }),
        makeObjective({ title: 'Sooner', dueDate: '2026-10-07' }),
        makeObjective({ title: 'Finished', status: 'done', horizon: 'week' }),
      ],
      today,
      1,
    );
    expect(groups.map((g) => g.label)).toEqual(['Overdue', 'This week', 'Someday']);
    expect(groups[1].items.map((o) => o.title)).toEqual(['Sooner', 'Soon']);
  });
});

describe('due labels', () => {
  it('reads in plain words', () => {
    expect(dueLabel('2026-10-07', today)).toEqual({ text: 'Due today', overdue: false });
    expect(dueLabel('2026-10-08', today).text).toBe('Due tomorrow');
    expect(dueLabel('2026-10-10', today).text).toBe('3 days left');
    expect(dueLabel('2026-10-05', today)).toEqual({ text: '2 days overdue', overdue: true });
    expect(dueLabel('2026-10-06', today).text).toBe('1 day overdue');
    expect(dueLabel('2026-10-28', today).text).toBe('Oct 28');
  });
});

describe('next on the ridge', () => {
  it('picks the nearest due date, overdue first', () => {
    const a = makeObjective({ title: 'Due later', dueDate: '2026-10-20' });
    const b = makeObjective({ title: 'Overdue', dueDate: '2026-10-01' });
    const c = makeObjective({ title: 'No date', horizon: 'week' });
    expect(nextOnRidge([a, b, c])?.title).toBe('Overdue');
  });

  it('falls back to the shortest horizon, and skips finished objectives', () => {
    const month = makeObjective({ title: 'Month', horizon: 'month' });
    const week = makeObjective({ title: 'Week', horizon: 'week' });
    const finished = makeObjective({ title: 'Done', status: 'done', dueDate: '2026-10-08' });
    expect(nextOnRidge([month, week, finished])?.title).toBe('Week');
    expect(nextOnRidge([finished])).toBeUndefined();
  });
});

describe('linked tasks', () => {
  it('counts completions of tasks linked to an objective', () => {
    const linked = makeTask({ objectiveId: 'o1', repeat: { kind: 'daily' } });
    const other = makeTask();
    const completions = [
      done(linked.id, '2026-10-05'),
      done(linked.id, '2026-10-06'),
      done(other.id, '2026-10-06'),
    ];
    expect(linkedTasksDone('o1', [linked, other], completions)).toBe(2);
  });
});
