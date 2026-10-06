import { nowMs } from '../app/clock';
import { db } from './db';
import { newId } from './ids';
import type { Goal, Milestone } from './types';

export interface GoalInput {
  title: string;
  why?: string;
  /** 'YYYY-MM', or '' for none */
  targetMonth?: string;
  /** '' for none */
  dreamId?: string;
}

function applyInput(goal: Goal, input: Partial<GoalInput>): Goal {
  const next = { ...goal };
  if (input.title !== undefined) next.title = input.title.trim() || goal.title;
  if (input.why !== undefined) next.why = input.why.trim();
  if (input.targetMonth !== undefined) next.targetMonth = input.targetMonth;
  if (input.dreamId !== undefined) next.dreamId = input.dreamId;
  for (const key of ['why', 'targetMonth', 'dreamId'] as const) {
    if (!next[key]) delete next[key];
  }
  return next;
}

export async function addGoal(input: GoalInput): Promise<Goal> {
  const goal = applyInput(
    {
      id: newId(),
      title: input.title.trim(),
      milestones: [],
      progressMode: 'auto',
      manualProgress: 0,
      status: 'active',
      createdAt: nowMs(),
    },
    input,
  );
  await db.goals.add(goal);
  return goal;
}

async function change(id: string, update: (goal: Goal) => Goal | void): Promise<void> {
  await db.transaction('rw', db.goals, async () => {
    const goal = await db.goals.get(id);
    if (!goal) return;
    const next = update(structuredClone(goal));
    await db.goals.put(next ?? goal);
  });
}

export function updateGoal(id: string, input: Partial<GoalInput>): Promise<void> {
  return change(id, (goal) => applyInput(goal, input));
}

export function addMilestone(goalId: string, title: string): Promise<void> {
  const milestone: Milestone = { id: newId(), title: title.trim() };
  return change(goalId, (goal) => {
    goal.milestones.push(milestone);
    return goal;
  });
}

/** Checks a milestone off (+250 m) or back on. Returns nothing; read the goal to see. */
export function setMilestoneDone(
  goalId: string,
  milestoneId: string,
  done: boolean,
): Promise<void> {
  return change(goalId, (goal) => {
    const milestone = goal.milestones.find((m) => m.id === milestoneId);
    if (!milestone) return goal;
    if (done) milestone.doneAt = nowMs();
    else delete milestone.doneAt;
    return goal;
  });
}

export function renameMilestone(goalId: string, milestoneId: string, title: string): Promise<void> {
  return change(goalId, (goal) => {
    const milestone = goal.milestones.find((m) => m.id === milestoneId);
    if (milestone && title.trim()) milestone.title = title.trim();
    return goal;
  });
}

export function removeMilestone(goalId: string, milestoneId: string): Promise<void> {
  return change(goalId, (goal) => {
    goal.milestones = goal.milestones.filter((m) => m.id !== milestoneId);
    return goal;
  });
}

export function setProgressMode(goalId: string, mode: Goal['progressMode']): Promise<void> {
  return change(goalId, (goal) => {
    goal.progressMode = mode;
    return goal;
  });
}

export function setManualProgress(goalId: string, value: number): Promise<void> {
  const stepped = Math.min(100, Math.max(0, Math.round(value / 5) * 5));
  return change(goalId, (goal) => {
    goal.manualProgress = stepped;
    return goal;
  });
}

/** Reaching a summit adds 1,000 m and puts it in the Sky as a gold star. */
export function reachGoal(goalId: string, reflection?: string): Promise<void> {
  return change(goalId, (goal) => {
    goal.status = 'reached';
    goal.reachedAt = nowMs();
    if (reflection?.trim()) goal.reflection = reflection.trim();
    else delete goal.reflection;
    return goal;
  });
}

/** Moves a reached summit back to active. Its star leaves the Sky. */
export function reopenGoal(goalId: string): Promise<void> {
  return change(goalId, (goal) => {
    goal.status = 'active';
    delete goal.reachedAt;
    return goal;
  });
}

/** Deletes a summit. Objectives linked to it stay, unlinked. */
export async function deleteGoal(id: string): Promise<void> {
  await db.transaction('rw', db.goals, db.objectives, async () => {
    await db.objectives
      .where('goalId')
      .equals(id)
      .modify((objective) => {
        delete objective.goalId;
      });
    await db.goals.delete(id);
  });
}
