import { CalendarCheck, Flag } from 'lucide-react';
import { navigate, openSheet } from '../../app/router';
import { useAppSettings } from '../../app/settingsContext';
import { Button } from '../../components/Button';
import { setSetting } from '../../db/settings';
import type { ISODate, Objective } from '../../db/types';
import { weekday } from '../../lib/dates';
import styles from './CampReminders.module.css';

/**
 * In-app reminders on Camp (docs/PRODUCT.md §8): anything due today, and the weekly review
 * banner on review day.
 */
export function CampReminders({ dueToday, today }: { dueToday: Objective[]; today: ISODate }) {
  const settings = useAppSettings();
  const review = settings.reminders.weeklyReview;
  const showReview =
    review.on &&
    weekday(today) === review.day &&
    settings.lastReviewDate !== today &&
    settings.reviewDismissedOn !== today;

  if (!showReview && dueToday.length === 0) return null;

  return (
    <div className={styles.reminders}>
      {showReview && (
        <section className={styles.review} aria-labelledby="review-banner">
          <CalendarCheck className={styles.icon} aria-hidden="true" />
          <div className={styles.reviewText}>
            <p id="review-banner" className={styles.reviewTitle}>
              Time to look at the week from the ridge.
            </p>
            <div className={styles.actions}>
              <Button variant="primary" onClick={() => navigate({ screen: 'review' })}>
                Start the review
              </Button>
              <Button variant="ghost" onClick={() => void setSetting('reviewDismissedOn', today)}>
                Not now
              </Button>
            </div>
          </div>
        </section>
      )}
      {dueToday.length > 0 && (
        <section className={styles.due} aria-labelledby="due-today">
          <h2 id="due-today" className={styles.dueHeading}>
            Due today
          </h2>
          <ul>
            {dueToday.map((objective) => (
              <li key={objective.id}>
                <button
                  type="button"
                  className={styles.dueItem}
                  onClick={() => openSheet('ridge', `objective:${objective.id}`)}
                >
                  <Flag aria-hidden="true" />
                  {objective.title}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
