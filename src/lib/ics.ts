import type { ISODate } from '../db/types';
import { addDays } from './dates';

/**
 * A minimal iCalendar (RFC 5545) writer for calendar export. Times are "floating" local
 * times (no time zone), which calendars read as the device's own local time.
 */
export interface IcsEvent {
  uid: string;
  summary: string;
  description?: string;
  /** The start date. Without a time, the event is all-day. */
  date: ISODate;
  /** 'HH:mm', local time */
  time?: string;
  /** Length of a timed event. Default 15 minutes. */
  durationMinutes?: number;
  /** e.g. 'FREQ=WEEKLY;BYDAY=MO,WE' */
  rrule?: string;
  /** Alarm triggers relative to the start, e.g. '-PT0M', '-PT17H', 'PT7H'. */
  alarms?: string[];
}

const encoder = new TextEncoder();

/** Escapes TEXT values: backslash, semicolon, comma and newlines. */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Folds a content line to 75 octets, never splitting a character. */
export function foldLine(line: string): string {
  const parts: string[] = [];
  let current = '';
  let size = 0;
  let limit = 75;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    if (size + bytes > limit) {
      parts.push(current);
      current = char;
      size = bytes;
      limit = 74; // continuation lines start with a space, which counts
    } else {
      current += char;
      size += bytes;
    }
  }
  parts.push(current);
  return parts.join('\r\n ');
}

function compactDate(date: ISODate): string {
  return date.replace(/-/g, '');
}

function compactTime(time: string): string {
  return `${time.replace(':', '')}00`;
}

function addMinutes(date: ISODate, time: string, minutes: number): { date: ISODate; time: string } {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const days = Math.floor(total / 1440);
  const rest = total - days * 1440;
  const pad = (n: number) => String(n).padStart(2, '0');
  return { date: addDays(date, days), time: `${pad(Math.floor(rest / 60))}:${pad(rest % 60)}` };
}

function utcStamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

export function buildIcs(events: IcsEvent[], stamp: Date = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ascent//Ascent planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Ascent',
  ];
  for (const event of events) {
    lines.push('BEGIN:VEVENT', `UID:${event.uid}`, `DTSTAMP:${utcStamp(stamp)}`);
    if (event.time) {
      const end = addMinutes(event.date, event.time, event.durationMinutes ?? 15);
      lines.push(`DTSTART:${compactDate(event.date)}T${compactTime(event.time)}`);
      lines.push(`DTEND:${compactDate(end.date)}T${compactTime(end.time)}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${compactDate(event.date)}`);
      lines.push(`DTEND;VALUE=DATE:${compactDate(addDays(event.date, 1))}`);
    }
    lines.push(`SUMMARY:${escapeText(event.summary)}`);
    if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);
    if (event.rrule) lines.push(`RRULE:${event.rrule}`);
    for (const trigger of event.alarms ?? []) {
      lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeText(event.summary)}`,
        `TRIGGER:${trigger}`,
        'END:VALARM',
      );
    }
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}

const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/** RRULE for a repeat rule: daily, weekdays, or chosen days. */
export function rruleFor(
  repeat: { kind: 'daily' } | { kind: 'weekdays' } | { kind: 'days'; days: number[] },
): string {
  if (repeat.kind === 'daily') return 'FREQ=DAILY';
  const days =
    repeat.kind === 'weekdays' ? [1, 2, 3, 4, 5] : [...repeat.days].sort((a, b) => a - b);
  return `FREQ=WEEKLY;BYDAY=${days.map((d) => BYDAY[d]).join(',')}`;
}

/** A trigger relative to midnight at the start of an all-day event: "PT7H", "-PT17H". */
export function triggerFromMidnight(time: string, dayOffset = 0): string {
  const [h, m] = time.split(':').map(Number);
  const minutes = dayOffset * 1440 + h * 60 + m;
  const sign = minutes < 0 ? '-' : '';
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  return `${sign}PT${hours}H${mins ? `${mins}M` : ''}`;
}
