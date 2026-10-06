import { useSyncExternalStore } from 'react';

/**
 * Short confirmations ("Done. +100 m") and screen-reader-only announcements
 * ("Moved to position 2 of 5"). A tiny store, so any code can notify without a provider.
 */

export interface Toast {
  id: number;
  message: string;
  action?: { label: string; run: () => void };
}

interface State {
  toast: Toast | null;
  announcement: string;
}

let state: State = { toast: null, announcement: '' };
let nextId = 1;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function set(next: Partial<State>): void {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

export function notify(message: string, action?: Toast['action'], durationMs = 4500): void {
  clearTimeout(timer);
  set({ toast: { id: nextId++, message, action } });
  timer = setTimeout(() => set({ toast: null }), durationMs);
}

export function dismissToast(): void {
  clearTimeout(timer);
  set({ toast: null });
}

/** Read out by screen readers only. */
export function announce(message: string): void {
  // Clearing first makes repeated identical messages read again.
  set({ announcement: '' });
  setTimeout(() => set({ announcement: message }), 50);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useToastState(): State {
  return useSyncExternalStore(subscribe, () => state);
}
