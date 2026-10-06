import { useSyncExternalStore } from 'react';
import { currentRoute, navigate } from '../../app/router';
import { reachDream } from '../../db/dreams';
import { reachGoal } from '../../db/goals';

/**
 * Reaching a summit or a dream (docs/PRODUCT.md §5–6, docs/DESIGN.md §6.3): ask for an
 * optional reflection, mark it reached, then play the reaching ceremony.
 *
 * Ceremony phases, about 1.6s in all:
 *   rising   the item lifts and shrinks to a point of light that rises off the screen
 *   ignite   the Sky has opened; the new gold star ignites
 *   draw     a line draws from the previous reached star to it
 *   text     "Reached. It's in your sky now." fades in
 *   settled  everything in its final state (skipped, finished, or reduced motion)
 */

export interface ReachTarget {
  kind: 'summit' | 'dream';
  id: string;
  title: string;
}

export type CeremonyPhase = 'rising' | 'ignite' | 'draw' | 'text' | 'settled';

export interface Ceremony extends ReachTarget {
  key: number;
  phase: CeremonyPhase;
}

interface ReachState {
  /** Waiting for the reflection prompt to be answered. */
  request: ReachTarget | null;
  ceremony: Ceremony | null;
}

let state: ReachState = { request: null, ceremony: null };
let key = 0;
const listeners = new Set<() => void>();

function set(next: Partial<ReachState>): void {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

export function requestReach(target: ReachTarget): void {
  set({ request: target });
}

export function cancelReach(): void {
  set({ request: null });
}

export async function confirmReach(reflection: string, reducedMotion: boolean): Promise<void> {
  const target = state.request;
  if (!target) return;
  if (target.kind === 'summit') await reachGoal(target.id, reflection);
  else await reachDream(target.id, reflection);

  // Close the sheet the reach started from (replacing its history entry, so Back never
  // reopens a reached item); the ceremony plays over the screen.
  navigate({ screen: currentRoute().screen }, { replace: true });
  set({
    request: null,
    ceremony: { ...target, key: ++key, phase: reducedMotion ? 'settled' : 'rising' },
  });
  // With reduced motion, go straight to the Sky with the star lit and the words shown.
  if (reducedMotion) openTheSky();
}

/** Arrive in the Sky. Back returns to the altitude the reach started from. */
export function openTheSky(): void {
  if (currentRoute().screen !== 'sky') navigate({ screen: 'sky' });
}

export function setCeremonyPhase(phase: CeremonyPhase): void {
  if (state.ceremony) set({ ceremony: { ...state.ceremony, phase } });
}

export function endCeremony(): void {
  set({ ceremony: null });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useReachState(): ReachState {
  return useSyncExternalStore(subscribe, () => state);
}
