import { useMemo } from 'react';
import { openSheet } from '../../app/router';
import { horizonShape } from '../../lib/horizon';
import styles from './Sky.module.css';

export interface HorizonSummit {
  id: string;
  title: string;
  progress: number;
}

/**
 * The bottom of the Sky: a mountain silhouette where each active summit is a peak and its
 * height reflects its progress. Tapping a peak opens that summit.
 */
export function Horizon({
  summits,
  width,
  height,
}: {
  summits: HorizonSummit[];
  width: number;
  height: number;
}) {
  const { path, peaks } = useMemo(
    () =>
      horizonShape(
        summits.map((s) => s.progress),
        width,
        height,
      ),
    [summits, width, height],
  );

  return (
    <div className={styles.horizon} style={{ height }} data-tour="horizon">
      <svg
        className={styles.horizonSvg}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
      >
        <path d={path} className={styles.mountain} />
        {peaks.map((peak, i) => (
          <circle key={summits[i].id} cx={peak.x} cy={peak.y} r={2.5} className={styles.beacon} />
        ))}
      </svg>
      {peaks.map((peak, i) => {
        const summit = summits[i];
        return (
          <button
            key={summit.id}
            type="button"
            className={styles.peak}
            style={{ left: peak.x, top: peak.y }}
            aria-label={`Summit: ${summit.title}, ${summit.progress}% climbed`}
            onClick={() => openSheet('summit', `summit:${summit.id}`)}
          >
            <span className={styles.peakLabel} aria-hidden="true">
              {summit.title} · {summit.progress}%
            </span>
          </button>
        );
      })}
    </div>
  );
}
