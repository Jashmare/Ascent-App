import { format } from 'date-fns';
import type { ISODate, Timestamp } from '../db/types';

const MS_PER_DAY = 86_400_000;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function parts(iso: ISODate): [number, number, number] {
  return [Number(iso.slice(0, 4)), Number(iso.slice(5, 7)), Number(iso.slice(8, 10))];
}

/** The local calendar day of a Date, as 'YYYY-MM-DD'. */
export function toISODate(date: Date): ISODate {
  return format(date, 'yyyy-MM-dd');
}

/** The local calendar day a timestamp falls on. */
export function timestampToISODate(ts: Timestamp): ISODate {
  return toISODate(new Date(ts));
}

/** Local midnight at the start of an ISO day. */
export function fromISODate(iso: ISODate): Date {
  const [y, m, d] = parts(iso);
  return new Date(y, m - 1, d);
}

export function isISODate(value: unknown): value is ISODate {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = parts(value);
  const check = new Date(Date.UTC(y, m - 1, d));
  return check.getUTCFullYear() === y && check.getUTCMonth() === m - 1 && check.getUTCDate() === d;
}

/**
 * Days since 1970-01-01. Day maths runs on calendar dates in UTC, so daylight saving
 * changes in the device's time zone can never skew a count.
 */
export function dayNumber(iso: ISODate): number {
  const [y, m, d] = parts(iso);
  return Math.round(Date.UTC(y, m - 1, d) / MS_PER_DAY);
}

export function fromDayNumber(n: number): ISODate {
  const date = new Date(n * MS_PER_DAY);
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function addDays(iso: ISODate, days: number): ISODate {
  return fromDayNumber(dayNumber(iso) + days);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: ISODate, to: ISODate): number {
  return dayNumber(to) - dayNumber(from);
}

/** 0 = Sunday … 6 = Saturday */
export function weekday(iso: ISODate): number {
  const [y, m, d] = parts(iso);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function startOfWeek(iso: ISODate, weekStartsOn: 0 | 1): ISODate {
  return addDays(iso, -((weekday(iso) - weekStartsOn + 7) % 7));
}

export function endOfWeek(iso: ISODate, weekStartsOn: 0 | 1): ISODate {
  return addDays(startOfWeek(iso, weekStartsOn), 6);
}

export function endOfMonth(iso: ISODate): ISODate {
  const [y, m] = parts(iso);
  return `${y}-${pad(m)}-${pad(new Date(Date.UTC(y, m, 0)).getUTCDate())}`;
}

export function endOfQuarter(iso: ISODate): ISODate {
  const [y, m] = parts(iso);
  const lastMonth = Math.ceil(m / 3) * 3;
  return `${y}-${pad(lastMonth)}-${pad(new Date(Date.UTC(y, lastMonth, 0)).getUTCDate())}`;
}

/** "Monday, 5 October" */
export function formatLongDate(iso: ISODate): string {
  return format(fromISODate(iso), 'EEEE, d MMMM');
}

/** "Oct 28", or "Oct 28, 2027" outside the current year. */
export function formatShortDate(iso: ISODate, today: ISODate): string {
  const sameYear = iso.slice(0, 4) === today.slice(0, 4);
  return format(fromISODate(iso), sameYear ? 'MMM d' : 'MMM d, yyyy');
}

/** "12 March 2026" */
export function formatFullDate(value: ISODate | Timestamp): string {
  const date = typeof value === 'number' ? new Date(value) : fromISODate(value);
  return format(date, 'd MMMM yyyy');
}

/** 'YYYY-MM' → "March 2027" */
export function formatMonthYear(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return format(new Date(y, m - 1, 1), 'MMMM yyyy');
}

/** 'HH:mm' → minutes since midnight */
export function minutesOfDay(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** "07:00" → "7:00 am" style label for settings. */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  return format(new Date(2000, 0, 1, h, m), 'h:mm a').toLowerCase();
}

export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
