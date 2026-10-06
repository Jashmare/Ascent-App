import { useSyncExternalStore } from 'react';
import type { ISODate } from '../db/types';
import { toISODate } from '../lib/dates';
import { now, nowMs } from './clock';

// Re-check every 30 seconds and whenever the app comes back into view, so "today" rolls
// over at local midnight even if the app stays open (or the device slept).
function subscribe(onChange: () => void): () => void {
  const timer = window.setInterval(onChange, 30_000);
  document.addEventListener('visibilitychange', onChange);
  window.addEventListener('focus', onChange);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', onChange);
    window.removeEventListener('focus', onChange);
  };
}

function todaySnapshot(): ISODate {
  return toISODate(now());
}

function minuteSnapshot(): number {
  return Math.floor(nowMs() / 60_000);
}

/** Today's date in the device's local time zone. Updates at midnight. */
export function useToday(): ISODate {
  return useSyncExternalStore(subscribe, todaySnapshot);
}

/** The current time, floored to the minute (as a timestamp). */
export function useNowMinute(): number {
  return useSyncExternalStore(subscribe, minuteSnapshot) * 60_000;
}
