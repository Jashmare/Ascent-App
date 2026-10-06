import { useSyncExternalStore } from 'react';
import { navigate } from '../../app/router';
import { reachDream } from '../../db/dreams';
import { reachGoal } from '../../db/goals';

/**
 * Reaching a summit or a dream (docs/PRODUCT.md §5–6): ask for an optional reflection,
 * mark it reached, then play the reaching ceremony in the Sky.
 */

export interface ReachTarget {
  kind: 'summit' | 'dream';
  id: string;
  title: string;
}

interface ReachState {
  /** Waiting for the reflection prompt to be answered. */
  request: ReachTarget | null;
  /** The ceremony in progress. */
  ceremony: (ReachTarget & { key: number }) | null;
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

export async function confirmReach(reflection: string): Promise<void> {
  const target = state.request;
  if (!target) return;
  if (target.kind === 'summit') await reachGoal(target.id, reflection);
  else await reachDream(target.id, reflection);
  set({ request: null, ceremony: { ...target, key: ++key } });
  // Replace the sheet's history entry, so Back from the Sky doesn't reopen a reached item.
  navigate({ screen: 'sky' }, { replace: true });
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
