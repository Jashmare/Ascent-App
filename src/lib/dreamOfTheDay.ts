import type { Dream, Goal, ISODate } from '../db/types';
import { dayNumber } from './dates';

/**
 * The dream shown in Camp's glimpse today (docs/PRODUCT.md §10).
 *
 * - Deterministic for a given date, and only dreams still being dreamed.
 * - Prefers dreams an active summit leads toward: they fill every slot of a rotation except
 *   one, which cycles through the other dreams so those still surface now and then.
 * - Never repeats on consecutive days when there are two or more dreams.
 */
export function dreamOfTheDay(dreams: Dream[], goals: Goal[], date: ISODate): Dream | undefined {
  const dreaming = dreams
    .filter((d) => d.status === 'dreaming')
    .sort((a, b) => a.createdAt - b.createdAt || (a.id < b.id ? -1 : 1));
  if (dreaming.length === 0) return undefined;

  const pathed = new Set(
    goals.filter((g) => g.status === 'active' && g.dreamId).map((g) => g.dreamId),
  );
  const preferred = dreaming.filter((d) => pathed.has(d.id));
  const others = dreaming.filter((d) => !pathed.has(d.id));
  const day = dayNumber(date);

  if (preferred.length === 0) return others[day % others.length];
  if (others.length === 0) return preferred[day % preferred.length];

  // A cycle of every preferred dream, then one of the others (a different one each cycle).
  const cycle = preferred.length + 1;
  const slot = day % cycle;
  if (slot < preferred.length) return preferred[slot];
  return others[Math.floor(day / cycle) % others.length];
}
