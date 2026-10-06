import type { Goal, Milestone, Objective } from '../db/types';
import { percent } from './format';

export function linkedObjectives(goal: Pick<Goal, 'id'>, objectives: Objective[]): Objective[] {
  return objectives.filter((o) => o.goalId === goal.id);
}

/**
 * Manual when chosen, and also whenever there's nothing to count yet: with no milestones
 * and no linked objectives, auto progress has nothing to measure.
 */
export function usesManualProgress(goal: Goal, objectives: Objective[]): boolean {
  return (
    goal.progressMode === 'manual' ||
    goal.milestones.length + linkedObjectives(goal, objectives).length === 0
  );
}

/**
 * A summit's progress, 0–100 (docs/PRODUCT.md §5). Auto: completed milestones plus
 * completed linked objectives, divided by the total of both. Manual: the slider value.
 */
export function goalProgress(goal: Goal, objectives: Objective[]): number {
  if (usesManualProgress(goal, objectives)) return percent(goal.manualProgress);
  const linked = linkedObjectives(goal, objectives);
  const total = goal.milestones.length + linked.length;
  const done =
    goal.milestones.filter((m) => m.doneAt != null).length +
    linked.filter((o) => o.status === 'done').length;
  // Floor, so 100% (and the reach button) only appears once everything is done.
  return Math.floor((done / total) * 100);
}

export function nextMilestone(goal: Goal): Milestone | undefined {
  return goal.milestones.find((m) => m.doneAt == null);
}
