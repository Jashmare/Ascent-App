import { at, makeGoal, makeMilestone, makeObjective } from '../test/factories';
import { goalProgress, nextMilestone, usesManualProgress } from './progress';

describe('goalProgress', () => {
  it('counts milestones and linked objectives together in auto mode', () => {
    const goal = makeGoal({
      milestones: [makeMilestone({ doneAt: at('2026-10-01') }), makeMilestone(), makeMilestone()],
    });
    const objectives = [
      makeObjective({ goalId: goal.id, status: 'done', doneAt: at('2026-10-02') }),
      makeObjective({ goalId: 'another-summit', status: 'done' }),
    ];
    // 1 milestone + 1 objective done, out of 3 + 1.
    expect(goalProgress(goal, objectives)).toBe(50);
  });

  it('moves when a linked objective is completed', () => {
    const goal = makeGoal({ milestones: [makeMilestone()] });
    const objective = makeObjective({ goalId: goal.id });
    expect(goalProgress(goal, [objective])).toBe(0);
    expect(goalProgress(goal, [{ ...objective, status: 'done' }])).toBe(50);
  });

  it('only reaches 100% once everything is done', () => {
    const milestones = Array.from({ length: 200 }, (_, i) =>
      makeMilestone({ doneAt: i < 199 ? at('2026-10-01') : undefined }),
    );
    expect(goalProgress(makeGoal({ milestones }), [])).toBe(99);
  });

  it('uses the slider in manual mode', () => {
    const goal = makeGoal({
      progressMode: 'manual',
      manualProgress: 35,
      milestones: [makeMilestone({ doneAt: at('2026-10-01') })],
    });
    expect(goalProgress(goal, [])).toBe(35);
  });

  it('falls back to manual when there is nothing to count', () => {
    const goal = makeGoal({ progressMode: 'auto', manualProgress: 20 });
    expect(usesManualProgress(goal, [])).toBe(true);
    expect(goalProgress(goal, [])).toBe(20);
  });
});

describe('nextMilestone', () => {
  it('finds the first unfinished milestone', () => {
    const goal = makeGoal({
      milestones: [
        makeMilestone({ title: 'First', doneAt: at('2026-10-01') }),
        makeMilestone({ title: 'Second' }),
        makeMilestone({ title: 'Third' }),
      ],
    });
    expect(nextMilestone(goal)?.title).toBe('Second');
    expect(nextMilestone(makeGoal())).toBeUndefined();
  });
});
