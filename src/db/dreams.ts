import { nowMs } from '../app/clock';
import { db } from './db';
import { newId } from './ids';
import type { Dream } from './types';

export interface DreamInput {
  title: string;
  why?: string;
  vision?: string;
  /** A resized image, or null to remove the photo. */
  photo?: Blob | null;
}

function applyInput(dream: Dream, input: Partial<DreamInput>): Dream {
  const next = { ...dream };
  if (input.title !== undefined) next.title = input.title.trim() || dream.title;
  if (input.why !== undefined) next.why = input.why.trim();
  if (input.vision !== undefined) next.vision = input.vision.trim();
  if (input.photo !== undefined) next.photo = input.photo ?? undefined;
  for (const key of ['why', 'vision', 'photo'] as const) {
    if (!next[key]) delete next[key];
  }
  return next;
}

export async function addDream(input: DreamInput): Promise<Dream> {
  const dream = applyInput(
    { id: newId(), title: input.title.trim(), status: 'dreaming', createdAt: nowMs() },
    input,
  );
  await db.dreams.add(dream);
  return dream;
}

export async function updateDream(id: string, input: Partial<DreamInput>): Promise<void> {
  await db.transaction('rw', db.dreams, async () => {
    const dream = await db.dreams.get(id);
    if (dream) await db.dreams.put(applyInput(dream, input));
  });
}

/** A dream that comes true becomes a gold star. */
export async function reachDream(id: string, reflection?: string): Promise<void> {
  await db.transaction('rw', db.dreams, async () => {
    const dream = await db.dreams.get(id);
    if (!dream) return;
    const next: Dream = { ...dream, status: 'reached', reachedAt: nowMs() };
    if (reflection?.trim()) next.reflection = reflection.trim();
    else delete next.reflection;
    await db.dreams.put(next);
  });
}

/** Back to still reaching. */
export async function moveDreamBack(id: string): Promise<void> {
  await db.transaction('rw', db.dreams, async () => {
    const dream = await db.dreams.get(id);
    if (!dream) return;
    const next: Dream = { ...dream, status: 'dreaming' };
    delete next.reachedAt;
    await db.dreams.put(next);
  });
}

/** Deletes a dream. Summits that led toward it stay, unlinked. */
export async function deleteDream(id: string): Promise<void> {
  await db.transaction('rw', db.dreams, db.goals, async () => {
    await db.goals
      .where('dreamId')
      .equals(id)
      .modify((goal) => {
        delete goal.dreamId;
      });
    await db.dreams.delete(id);
  });
}

/** Links a summit to a dream (or unlinks it with ''). */
export async function linkSummitToDream(goalId: string, dreamId: string): Promise<void> {
  await db.transaction('rw', db.goals, async () => {
    const goal = await db.goals.get(goalId);
    if (!goal) return;
    const next = { ...goal };
    if (dreamId) next.dreamId = dreamId;
    else delete next.dreamId;
    await db.goals.put(next);
  });
}
