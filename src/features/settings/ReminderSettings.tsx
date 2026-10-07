import { Bell, CalendarPlus } from 'lucide-react';
import { useState } from 'react';
import { now } from '../../app/clock';
import { notify } from '../../app/toast';
import { Button } from '../../components/Button';
import { SelectField, TextField } from '../../components/Field';
import { Panel, SectionHeading } from '../../components/Page';
import { Switch } from '../../components/Switch';
import { db } from '../../db/db';
import {
  setSetting,
  type DailyReminder,
  type ReminderSettings as Reminders,
} from '../../db/settings';
import { calendarEvents } from '../../lib/calendar';
import { toISODate, WEEKDAY_NAMES } from '../../lib/dates';
import { buildIcs } from '../../lib/ics';
import {
  notificationState,
  requestNotifications,
  showNotification,
  type NotificationState,
} from '../reminders/notifications';
import { downloadFile } from './download';
import styles from './Settings.module.css';

/** Reminders (docs/PRODUCT.md §8): what gets reminded, when, and how it reaches you. */
export function ReminderSettings({ reminders }: { reminders: Reminders }) {
  const save = (next: Reminders) => void setSetting('reminders', next);

  return (
    <section aria-labelledby="settings-reminders">
      <SectionHeading id="settings-reminders">Reminders</SectionHeading>
      <Panel className={styles.panel}>
        <NotificationStatus />
        <div className={styles.reminderList}>
          <ReminderRow
            label="Morning"
            description="Today’s climb, and a dream you’re reaching for."
            value={reminders.morning}
            onChange={(morning) => save({ ...reminders, morning })}
          />
          <ReminderRow
            label="Evening check-in"
            description="Only when tasks are left unfinished."
            value={reminders.evening}
            onChange={(evening) => save({ ...reminders, evening })}
          />
          <div className={styles.reminder}>
            <Switch
              checked={reminders.objectiveDue.on}
              onChange={(on) => save({ ...reminders, objectiveDue: { on } })}
              description="The day before and the morning of, at your morning time."
            >
              Objectives due
            </Switch>
          </div>
          <ReminderRow
            label="Weekly review"
            description="A guided look at the week from the ridge."
            value={reminders.weeklyReview}
            onChange={(weeklyReview) => save({ ...reminders, weeklyReview })}
            weekly
          />
          <ReminderRow
            label="Dream nudge"
            description="One dream’s “picture it” note, once a week."
            value={reminders.dreamNudge}
            onChange={(dreamNudge) => save({ ...reminders, dreamNudge })}
            weekly
          />
        </div>
        <CalendarExport reminders={reminders} />
      </Panel>
    </section>
  );
}

function ReminderRow<T extends DailyReminder & { day?: number }>({
  label,
  description,
  value,
  onChange,
  weekly,
}: {
  label: string;
  description: string;
  value: T;
  onChange: (value: T) => void;
  weekly?: boolean;
}) {
  return (
    <div className={styles.reminder}>
      <Switch
        checked={value.on}
        onChange={(on) => onChange({ ...value, on })}
        description={description}
      >
        {label}
      </Switch>
      {value.on && (
        <div className={styles.reminderFields}>
          {weekly && (
            <SelectField
              label={`${label} day`}
              value={String(value.day ?? 0)}
              onChange={(event) => onChange({ ...value, day: Number(event.target.value) })}
            >
              {WEEKDAY_NAMES.map((name, day) => (
                <option key={name} value={day}>
                  {name}
                </option>
              ))}
            </SelectField>
          )}
          <TextField
            label={`${label} time`}
            type="time"
            value={value.time}
            onChange={(event) => {
              if (event.target.value) onChange({ ...value, time: event.target.value });
            }}
          />
        </div>
      )}
    </div>
  );
}

function NotificationStatus() {
  const [state, setState] = useState<NotificationState>(notificationState);

  if (state === 'unsupported') {
    return (
      <p className={styles.note}>
        This browser can’t show notifications. Reminders appear inside Ascent, and “Add to calendar”
        below still works.
      </p>
    );
  }
  if (state === 'denied') {
    return (
      <p className={styles.note}>
        Notifications are blocked for Ascent. To allow them, open this site’s settings in your
        browser. Until then, reminders appear inside Ascent.
      </p>
    );
  }
  if (state === 'granted') {
    return (
      <div className={styles.notifications}>
        <p className={styles.note}>
          Notifications are on. They arrive while Ascent is open or in the background.
        </p>
        <Button
          icon={<Bell />}
          onClick={async () => {
            const shown = await showNotification(
              'Ascent',
              'Notifications are working. The sky is the limit.',
              'test',
              '#/camp',
            );
            if (!shown) notify('That notification couldn’t be shown. Check your browser settings.');
          }}
        >
          Send a test
        </Button>
      </div>
    );
  }
  return (
    <div className={styles.notifications}>
      <p className={styles.note}>
        Reminders can show as notifications while Ascent is open or in the background. Otherwise
        they appear inside the app.
      </p>
      <Button
        variant="primary"
        icon={<Bell />}
        onClick={async () => setState(await requestNotifications())}
      >
        Turn on notifications
      </Button>
    </div>
  );
}

function CalendarExport({ reminders }: { reminders: Reminders }) {
  async function exportCalendar() {
    const [tasks, objectives] = await Promise.all([db.tasks.toArray(), db.objectives.toArray()]);
    const today = toISODate(now());
    const events = calendarEvents({ tasks, objectives, reminders, today });
    downloadFile('ascent-reminders.ics', buildIcs(events), 'text/calendar');
    notify('Calendar file saved. Open it to add the reminders to your calendar.');
  }

  return (
    <div className={styles.calendar}>
      <Button icon={<CalendarPlus />} onClick={exportCalendar}>
        Add to calendar
      </Button>
      <p className={styles.note}>
        Saves a calendar file with your routines, due dates and the weekly review. Open it on your
        phone, and your calendar will remind you even when Ascent is closed.
      </p>
    </div>
  );
}
