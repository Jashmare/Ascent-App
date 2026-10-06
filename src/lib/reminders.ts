import type { ReminderSettings } from '../db/settings';
import type { ISODate } from '../db/types';
import { minutesOfDay } from './dates';
import { plural } from './format';

/** Everything the reminder rules need to know about right now. Plain data, no I/O. */
export interface ReminderContext {
  today: ISODate;
  /** Minutes since local midnight. */
  minute: number;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  settings: ReminderSettings;
  /** Reminder id → the last day it fired. */
  log: Record<string, ISODate>;
  tasksToday: number;
  unfinishedToday: number;
  /** The dream in today's glimpse, if any. */
  glimpse?: string;
  /** Open objectives due today or tomorrow. */
  dueSoon: { id: string; title: string; when: 'today' | 'tomorrow' }[];
  /** A dream with a "picture it" note, for the weekly nudge. */
  nudge?: { title: string; vision: string };
  /** The weekly review was already finished today. */
  reviewedToday: boolean;
}

export interface Reminder {
  id: string;
  title: string;
  body: string;
  /** Where tapping it should take you. */
  screen: 'camp' | 'ridge' | 'review' | 'sky';
}

/** Reminders more than this late are skipped (marked done without a notification). */
export const STALE_AFTER_MINUTES = 3 * 60;

/**
 * Reads a title mid-sentence: "A studio by the sea" → "a studio by the sea". Only leading
 * articles and possessives are lowered, so names ("Paris in spring") keep their capital.
 */
export function midSentence(title: string): string {
  return /^(A|An|The|My|Our)\b/.test(title)
    ? title.charAt(0).toLowerCase() + title.slice(1)
    : title;
}

/**
 * Which reminders are due now (docs/PRODUCT.md §8). Each fires at most once a day, from
 * its time onward. Ones that are badly late are returned as `stale`, so they can be marked
 * done quietly: Camp already shows what's due, and a 7am nudge at noon helps nobody.
 */
export function dueReminders(context: ReminderContext): { due: Reminder[]; stale: string[] } {
  const { settings, minute, today, weekday, log } = context;
  const due: Reminder[] = [];
  const stale: string[] = [];

  function consider(id: string, time: string, build: () => Reminder | null) {
    if (log[id] === today) return;
    const at = minutesOfDay(time);
    if (minute < at) return;
    const reminder = build();
    if (!reminder) return;
    if (minute - at > STALE_AFTER_MINUTES) stale.push(id);
    else due.push(reminder);
  }

  if (settings.morning.on) {
    consider('morning', settings.morning.time, () => {
      const tasks =
        context.tasksToday === 0
          ? 'Nothing planned yet. Add the first thing you’ll do.'
          : `Today’s climb: ${plural(context.tasksToday, 'task')}.`;
      const dream = context.glimpse ? ` Still reaching for: ${midSentence(context.glimpse)}.` : '';
      return { id: 'morning', title: 'Good morning', body: `${tasks}${dream}`, screen: 'camp' };
    });
  }

  if (settings.evening.on) {
    consider('evening', settings.evening.time, () =>
      context.unfinishedToday > 0
        ? {
            id: 'evening',
            title: 'Evening check-in',
            body: `${plural(context.unfinishedToday, 'task')} left today. Still time.`,
            screen: 'camp',
          }
        : null,
    );
  }

  if (settings.objectiveDue.on) {
    for (const objective of context.dueSoon) {
      const id = `due:${objective.id}:${objective.when}`;
      consider(id, settings.morning.time, () => ({
        id,
        title: 'On the ridge',
        body: `${objective.title} is due ${objective.when}.`,
        screen: 'ridge',
      }));
    }
  }

  if (settings.weeklyReview.on && weekday === settings.weeklyReview.day && !context.reviewedToday) {
    consider('weekly-review', settings.weeklyReview.time, () => ({
      id: 'weekly-review',
      title: 'Weekly review',
      body: 'Time to look at the week from the ridge.',
      screen: 'review',
    }));
  }

  if (settings.dreamNudge.on && weekday === settings.dreamNudge.day && context.nudge) {
    const { title, vision } = context.nudge;
    consider('dream-nudge', settings.dreamNudge.time, () => ({
      id: 'dream-nudge',
      title,
      body: vision,
      screen: 'sky',
    }));
  }

  return { due, stale };
}
