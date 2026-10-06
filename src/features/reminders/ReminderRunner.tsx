import { useEffect, useRef } from 'react';
import { navigate } from '../../app/router';
import { useAppSettings } from '../../app/settingsContext';
import { notify } from '../../app/toast';
import { useNowMinute, useToday } from '../../app/useToday';
import { useCompletions, useDreams, useGoals, useObjectives, useTasks } from '../../db/hooks';
import { setSetting } from '../../db/settings';
import { addDays, weekday } from '../../lib/dates';
import { dreamOfTheDay } from '../../lib/dreamOfTheDay';
import { completionKey, completionKeys, tasksForDay } from '../../lib/recurrence';
import { dueReminders } from '../../lib/reminders';
import { showNotification } from './notifications';

/**
 * In-app reminders (docs/PRODUCT.md §8): checks once a minute while Ascent is open or in
 * the background. Each reminder fires once a day, as a system notification when allowed,
 * or as a message in the app otherwise.
 */
export function ReminderRunner() {
  const settings = useAppSettings();
  const today = useToday();
  const now = useNowMinute();
  const tasks = useTasks();
  const completions = useCompletions();
  const objectives = useObjectives();
  const dreams = useDreams();
  const goals = useGoals();
  const busy = useRef(false);

  useEffect(() => {
    if (!tasks || !completions || !objectives || !dreams || !goals || busy.current) return;

    const todays = tasksForDay(tasks, today);
    const done = completionKeys(completions);
    const tomorrow = addDays(today, 1);
    const nudgeDream = dreams.find((d) => d.status === 'dreaming' && d.vision);
    const date = new Date(now);

    const { due, stale } = dueReminders({
      today,
      minute: date.getHours() * 60 + date.getMinutes(),
      weekday: weekday(today),
      settings: settings.reminders,
      log: settings.reminderLog,
      tasksToday: todays.length,
      unfinishedToday: todays.filter((t) => !done.has(completionKey(t.id, today))).length,
      glimpse: dreamOfTheDay(dreams, goals, today)?.title,
      dueSoon: objectives
        .filter((o) => o.status === 'open' && (o.dueDate === today || o.dueDate === tomorrow))
        .map((o) => ({
          id: o.id,
          title: o.title,
          when: o.dueDate === today ? ('today' as const) : ('tomorrow' as const),
        })),
      nudge: nudgeDream ? { title: nudgeDream.title, vision: nudgeDream.vision! } : undefined,
      reviewedToday: settings.lastReviewDate === today,
    });
    if (due.length === 0 && stale.length === 0) return;

    busy.current = true;
    void (async () => {
      const log: Record<string, string> = {};
      // Keep only today's entries, so the log never grows.
      for (const [id, day] of Object.entries(settings.reminderLog))
        if (day === today) log[id] = day;
      for (const id of stale) log[id] = today;
      const inApp: typeof due = [];
      for (const reminder of due) {
        const shown = await showNotification(
          reminder.title,
          reminder.body,
          reminder.id,
          `#/${reminder.screen}`,
        );
        if (!shown) inApp.push(reminder);
        log[reminder.id] = today;
      }
      await setSetting('reminderLog', log);
      if (inApp.length > 0) {
        const first = inApp[0];
        notify(
          inApp.map((r) => r.body).join(' '),
          { label: 'Open', run: () => navigate({ screen: first.screen }) },
          9000,
        );
      }
      busy.current = false;
    })();
  }, [now, today, settings, tasks, completions, objectives, dreams, goals]);

  return null;
}
