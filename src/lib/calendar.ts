import type { ReminderSettings } from '../db/settings';
import type { ISODate, Objective, Task } from '../db/types';
import { addDays, weekday } from './dates';
import { rruleFor, triggerFromMidnight, type IcsEvent } from './ics';
import { isRoutine, repeatMatches } from './recurrence';

/**
 * Calendar events for "Add to calendar" (docs/PRODUCT.md §8): routines at the morning time,
 * objective due dates as all-day events reminding the day before and the morning of, and
 * the weekly review. The phone's own calendar then delivers the alerts, even when Ascent
 * is closed.
 */
export function calendarEvents(input: {
  tasks: Task[];
  objectives: Objective[];
  reminders: ReminderSettings;
  today: ISODate;
}): IcsEvent[] {
  const { tasks, objectives, reminders, today } = input;
  const morning = reminders.morning.time;
  const events: IcsEvent[] = [];

  for (const task of tasks) {
    if (task.archived || !isRoutine(task) || task.repeat.kind === 'none') continue;
    if (task.repeat.kind === 'days' && task.repeat.days.length === 0) continue;
    // Start on the first matching day, so calendars don't add a stray first instance.
    let start = today;
    for (let i = 0; i < 7 && !repeatMatches(task.repeat, weekday(start)); i++)
      start = addDays(start, 1);
    events.push({
      uid: `routine-${task.id}@ascent.app`,
      summary: task.title,
      description: 'A routine from Ascent.',
      date: start,
      time: morning,
      rrule: rruleFor(task.repeat),
      alarms: ['-PT0M'],
    });
  }

  for (const objective of objectives) {
    if (objective.status !== 'open' || !objective.dueDate || objective.dueDate < today) continue;
    events.push({
      uid: `objective-${objective.id}@ascent.app`,
      summary: `Due: ${objective.title}`,
      description: 'An objective on your ridge in Ascent.',
      date: objective.dueDate,
      alarms: [triggerFromMidnight(morning, -1), triggerFromMidnight(morning)],
    });
  }

  if (reminders.weeklyReview.on) {
    const { day, time } = reminders.weeklyReview;
    events.push({
      uid: 'weekly-review@ascent.app',
      summary: 'Weekly review',
      description: 'Time to look at the week from the ridge.',
      date: addDays(today, (day - weekday(today) + 7) % 7),
      time,
      durationMinutes: 30,
      rrule: rruleFor({ kind: 'days', days: [day] }),
      alarms: ['-PT0M'],
    });
  }

  return events;
}
