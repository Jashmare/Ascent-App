import { Star } from 'lucide-react';
import { openSheet } from '../../app/router';
import { cx } from '../../components/cx';
import { Page, SectionHeading } from '../../components/Page';
import { PeakGlyph } from '../../components/PeakGlyph';
import { formatFullDate } from '../../lib/dates';
import { constellationOrder, type SkyStar } from '../../lib/sky';
import type { HorizonSummit } from './Horizon';
import styles from './Sky.module.css';

interface SkyListProps {
  stars: SkyStar[];
  summits: HorizonSummit[];
  /** Short "why" lines for dreams, by id. */
  whyById: Map<string, string | undefined>;
}

/** The sky as two lists, "Still reaching" and "Reached", plus the summits on the horizon. */
export function SkyList({ stars, summits, whyById }: SkyListProps) {
  const reaching = stars.filter((s) => !s.reached);
  const reached = constellationOrder(stars).reverse();

  return (
    <Page className={styles.listPage}>
      <section aria-labelledby="sky-reaching">
        <SectionHeading id="sky-reaching">Still reaching</SectionHeading>
        {reaching.length === 0 ? (
          <p className={styles.listEmpty}>No dreams waiting. Add one whenever it comes to you.</p>
        ) : (
          <ul className={styles.list}>
            {reaching.map((star) => (
              <li key={star.key}>
                <button
                  type="button"
                  className={styles.listItem}
                  onClick={() => openSheet('sky', star.key)}
                  aria-label={star.ariaLabel}
                >
                  <Star className={cx(styles.listIcon, styles.listIconPale)} aria-hidden="true" />
                  <span className={styles.listText}>
                    <span className={styles.listDream}>{star.title}</span>
                    {whyById.get(star.id) && (
                      <span className={styles.listWhy}>{whyById.get(star.id)}</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="sky-reached">
        <SectionHeading id="sky-reached">Reached</SectionHeading>
        {reached.length === 0 ? (
          <p className={styles.listEmpty}>Summits and dreams you reach become gold stars here.</p>
        ) : (
          <ul className={styles.list}>
            {reached.map((star) => (
              <li key={star.key}>
                <button
                  type="button"
                  className={styles.listItem}
                  onClick={() => openSheet('sky', star.key)}
                  aria-label={star.ariaLabel}
                >
                  <Star className={cx(styles.listIcon, styles.listIconGold)} aria-hidden="true" />
                  <span className={styles.listText}>
                    <span className={star.kind === 'dream' ? styles.listDream : styles.listSummit}>
                      {star.title}
                    </span>
                    <span className={styles.listWhy}>
                      {star.kind === 'dream' ? 'Dream' : 'Summit'} · reached{' '}
                      {formatFullDate(star.reachedAt ?? star.createdAt)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {summits.length > 0 && (
        <section aria-labelledby="sky-horizon">
          <SectionHeading id="sky-horizon">On the horizon</SectionHeading>
          <ul className={styles.list}>
            {summits.map((summit) => (
              <li key={summit.id}>
                <button
                  type="button"
                  className={styles.listItem}
                  onClick={() => openSheet('summit', `summit:${summit.id}`)}
                  aria-label={`Summit: ${summit.title}, ${summit.progress}% climbed`}
                >
                  <PeakGlyph progress={summit.progress} size={24} className={styles.listPeak} />
                  <span className={styles.listText}>
                    <span className={styles.listSummit}>{summit.title}</span>
                    <span className={cx(styles.listWhy, 'tabular')}>
                      {summit.progress}% climbed
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Page>
  );
}
