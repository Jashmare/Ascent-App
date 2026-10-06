import {
  addDays,
  dayNumber,
  daysBetween,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  formatLongDate,
  formatShortDate,
  fromDayNumber,
  isISODate,
  startOfWeek,
  timestampToISODate,
  toISODate,
  weekday,
} from './dates';

describe('dates', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(toISODate(new Date(2026, 9, 5, 23, 59))).toBe('2026-10-05');
    expect(timestampToISODate(new Date(2026, 0, 1, 0, 0).getTime())).toBe('2026-01-01');
  });

  it('adds days across month, year and leap-day boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('counts days between dates', () => {
    expect(daysBetween('2026-10-05', '2026-10-08')).toBe(3);
    expect(daysBetween('2026-10-08', '2026-10-05')).toBe(-3);
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
  });

  it('round-trips day numbers', () => {
    expect(fromDayNumber(dayNumber('2026-10-05'))).toBe('2026-10-05');
    expect(dayNumber('1970-01-02')).toBe(1);
  });

  it('knows the weekday', () => {
    expect(weekday('2026-10-05')).toBe(1); // Monday
    expect(weekday('2026-10-11')).toBe(0); // Sunday
  });

  it('finds week, month and quarter ends', () => {
    // Monday-start week containing Wed 7 Oct 2026 runs Mon 5 – Sun 11.
    expect(startOfWeek('2026-10-07', 1)).toBe('2026-10-05');
    expect(endOfWeek('2026-10-07', 1)).toBe('2026-10-11');
    // Sunday-start week runs Sun 4 – Sat 10.
    expect(startOfWeek('2026-10-07', 0)).toBe('2026-10-04');
    expect(endOfWeek('2026-10-07', 0)).toBe('2026-10-10');
    expect(endOfMonth('2028-02-10')).toBe('2028-02-29');
    expect(endOfMonth('2026-04-30')).toBe('2026-04-30');
    expect(endOfQuarter('2026-10-07')).toBe('2026-12-31');
    expect(endOfQuarter('2026-05-01')).toBe('2026-06-30');
  });

  it('validates ISO dates', () => {
    expect(isISODate('2026-02-28')).toBe(true);
    expect(isISODate('2026-02-30')).toBe(false);
    expect(isISODate('2026-2-3')).toBe(false);
    expect(isISODate(null)).toBe(false);
  });

  it('formats dates for people', () => {
    expect(formatLongDate('2026-10-05')).toBe('Monday, 5 October');
    expect(formatShortDate('2026-10-28', '2026-10-05')).toBe('Oct 28');
    expect(formatShortDate('2027-01-04', '2026-10-05')).toBe('Jan 4, 2027');
  });
});
