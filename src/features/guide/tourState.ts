import { useSyncExternalStore } from 'react';
import { setSetting } from '../../db/settings';

/** The guided tour: which step is showing, if any. */
let step: number | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function startTour(): void {
  step = 0;
  emit();
}

export function setTourStep(next: number): void {
  step = next;
  emit();
}

export function endTour(): void {
  step = null;
  emit();
  void setSetting('tourDone', true);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTourStep(): number | null {
  return useSyncExternalStore(subscribe, () => step);
}
