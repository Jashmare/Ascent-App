import { DEFAULT_SETTINGS } from '../db/settings';
import { makeObjective, makeTask } from '../test/factories';
import { calendarEvents } from './calendar';
import { buildIcs, escapeText, foldLine, rruleFor, triggerFromMidnight } from './ics';

const stamp = new Date(Date.UTC(2026, 9, 7, 12, 0, 0));

describe('buildIcs', () => {
  it('writes a valid calendar with CRLF line endings', () => {
    const ics = buildIcs([], stamp);
    expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('PRODID:-//Ascent//Ascent planner//EN');
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/\n/);
  });

  it('writes a repeating timed event with an alarm', () => {
    const ics = buildIcs(
      [
        {
          uid: 'routine-1@ascent.app',
          summary: 'Morning walk',
          date: '2026-10-07',
          time: '07:00',
          rrule: 'FREQ=DAILY',
          alarms: ['-PT0M'],
        },
      ],
      stamp,
    );
    const lines = ics.split('\r\n');
    expect(lines).toContain('UID:routine-1@ascent.app');
    expect(lines).toContain('DTSTAMP:20261007T120000Z');
    expect(lines).toContain('DTSTART:20261007T070000');
    expect(lines).toContain('DTEND:20261007T071500');
    expect(lines).toContain('RRULE:FREQ=DAILY');
    expect(lines).toContain('TRIGGER:-PT0M');
    // Every BEGIN has its END.
    for (const block of ['VCALENDAR', 'VEVENT', 'VALARM']) {
      expect(lines.filter((l) => l === `BEGIN:${block}`).length).toBe(
        lines.filter((l) => l === `END:${block}`).length,
      );
    }
  });

  it('writes all-day events that end the next day, across a month end', () => {
    const ics = buildIcs(
      [{ uid: 'o@ascent.app', summary: 'Due: Report', date: '2026-10-31' }],
      stamp,
    );
    expect(ics).toContain('DTSTART;VALUE=DATE:20261031\r\nDTEND;VALUE=DATE:20261101');
  });

  it('runs a late timed event into the next day', () => {
    const ics = buildIcs(
      [
        {
          uid: 'r@ascent.app',
          summary: 'Review',
          date: '2026-10-11',
          time: '23:50',
          durationMinutes: 30,
        },
      ],
      stamp,
    );
    expect(ics).toContain('DTEND:20261012T002000');
  });

  it('escapes text and folds long lines at 75 octets', () => {
    expect(escapeText('Plan, pack; go\\now\nthen rest')).toBe(
      'Plan\\, pack\\; go\\\\now\\nthen rest',
    );
    const long = `SUMMARY:${'é'.repeat(60)}`;
    const folded = foldLine(long);
    for (const line of folded.split('\r\n')) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(folded.replace(/\r\n /g, '')).toBe(long);
  });
});

describe('calendarEvents', () => {
  // Wednesday 7 October 2026
  const today = '2026-10-07';

  it('exports routines, upcoming due dates and the weekly review', () => {
    const events = calendarEvents({
      today,
      reminders: DEFAULT_SETTINGS.reminders,
      tasks: [
        makeTask({ id: 'walk', title: 'Morning walk', repeat: { kind: 'daily' } }),
        makeTask({ id: 'swim', title: 'Swim', repeat: { kind: 'days', days: [6] } }),
        makeTask({ id: 'once', title: 'One-off', date: today }),
        makeTask({ id: 'old', title: 'Stopped', repeat: { kind: 'daily' }, archived: true }),
      ],
      objectives: [
        makeObjective({ id: 'soon', title: 'Refresh portfolio', dueDate: '2026-10-10' }),
        makeObjective({ id: 'past', title: 'Late', dueDate: '2026-10-01' }),
        makeObjective({ id: 'done', title: 'Done', dueDate: '2026-10-20', status: 'done' }),
      ],
    });
    expect(events.map((e) => e.uid)).toEqual([
      'routine-walk@ascent.app',
      'routine-swim@ascent.app',
      'objective-soon@ascent.app',
      'weekly-review@ascent.app',
    ]);
    // A Saturday routine starts on the coming Saturday, not today.
    expect(events[1]).toMatchObject({ date: '2026-10-10', rrule: 'FREQ=WEEKLY;BYDAY=SA' });
    // Due dates remind the day before and the morning of, at the morning time.
    expect(events[2]).toMatchObject({
      summary: 'Due: Refresh portfolio',
      alarms: ['-PT17H', 'PT7H'],
    });
    // The review is on the coming Sunday at 18:00, every week.
    expect(events[3]).toMatchObject({
      date: '2026-10-11',
      time: '18:00',
      rrule: 'FREQ=WEEKLY;BYDAY=SU',
    });
  });
});

describe('ics helpers', () => {
  it('writes repeat rules', () => {
    expect(rruleFor({ kind: 'daily' })).toBe('FREQ=DAILY');
    expect(rruleFor({ kind: 'weekdays' })).toBe('FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR');
    expect(rruleFor({ kind: 'days', days: [5, 1] })).toBe('FREQ=WEEKLY;BYDAY=MO,FR');
  });

  it('writes alarm triggers from midnight', () => {
    expect(triggerFromMidnight('07:00')).toBe('PT7H');
    expect(triggerFromMidnight('07:00', -1)).toBe('-PT17H');
    expect(triggerFromMidnight('07:30', -1)).toBe('-PT16H30M');
  });
});
