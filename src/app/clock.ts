/**
 * The app's single source of "now".
 *
 * In development you can shift the clock to test day changes, carry-over and streaks:
 * open the app with `?now=2026-10-12T07:00` (local time) and the shift is remembered until
 * you open it with `?now=` (empty). Production builds always use the real time.
 */
const OFFSET_KEY = 'ascent:dev-clock-offset';

function readDevOffset(): number {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has('now')) {
      const raw = params.get('now') ?? '';
      if (!raw) {
        localStorage.removeItem(OFFSET_KEY);
        return 0;
      }
      // A date-only string would be parsed as UTC midnight, so give it a local morning time.
      const target = new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T09:00` : raw).getTime();
      if (!Number.isNaN(target)) {
        const offset = target - Date.now();
        localStorage.setItem(OFFSET_KEY, String(offset));
        return offset;
      }
    }
    return Number(localStorage.getItem(OFFSET_KEY)) || 0;
  } catch {
    return 0;
  }
}

const offsetMs = import.meta.env.DEV && typeof window !== 'undefined' ? readDevOffset() : 0;

export function nowMs(): number {
  return Date.now() + offsetMs;
}

export function now(): Date {
  return new Date(nowMs());
}

export function isClockShifted(): boolean {
  return offsetMs !== 0;
}
