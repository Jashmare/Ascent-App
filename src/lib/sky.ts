import type { Dream, Goal } from '../db/types';
import { formatFullDate } from './dates';

export interface SkyStar {
  /** 'dream:<id>' or 'summit:<id>' */
  key: string;
  kind: 'dream' | 'summit';
  id: string;
  title: string;
  reached: boolean;
  reachedAt?: number;
  createdAt: number;
  /** What a screen reader announces for the star button. */
  ariaLabel: string;
}

/**
 * Every star in the sky: each dream (pale while still reaching, gold once reached) and
 * every reached summit (gold). Active summits live on the horizon instead.
 */
export function skyStars(dreams: Dream[], goals: Goal[]): SkyStar[] {
  const stars: SkyStar[] = dreams.map((dream) => {
    const reached = dream.status === 'reached';
    return {
      key: `dream:${dream.id}`,
      kind: 'dream',
      id: dream.id,
      title: dream.title,
      reached,
      reachedAt: reached ? dream.reachedAt : undefined,
      createdAt: dream.createdAt,
      ariaLabel: reached
        ? `Reached dream: ${dream.title}, reached ${formatFullDate(dream.reachedAt ?? dream.createdAt)}`
        : `Dream: ${dream.title}, still reaching`,
    };
  });
  for (const goal of goals) {
    if (goal.status !== 'reached') continue;
    stars.push({
      key: `summit:${goal.id}`,
      kind: 'summit',
      id: goal.id,
      title: goal.title,
      reached: true,
      reachedAt: goal.reachedAt,
      createdAt: goal.createdAt,
      ariaLabel: `Reached summit: ${goal.title}, reached ${formatFullDate(goal.reachedAt ?? goal.createdAt)}`,
    });
  }
  return stars.sort((a, b) => a.createdAt - b.createdAt || (a.key < b.key ? -1 : 1));
}

/** Reached stars in the order they were reached: the constellation. */
export function constellationOrder(stars: SkyStar[]): SkyStar[] {
  return stars
    .filter((star) => star.reached)
    .sort((a, b) => (a.reachedAt ?? 0) - (b.reachedAt ?? 0) || (a.key < b.key ? -1 : 1));
}
