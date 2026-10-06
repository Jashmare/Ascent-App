import { Plus } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { openSheet } from '../../app/router';
import { useElementSize } from '../../app/useElementSize';
import { Button } from '../../components/Button';
import { cx } from '../../components/cx';
import { constellationOrder, type SkyStar } from '../../lib/sky';
import { layoutStars, restingLabels } from '../../lib/stars';
import { Horizon, type HorizonSummit } from './Horizon';
import type { Ceremony } from './reach';
import { StarButton } from './StarButton';
import styles from './Sky.module.css';

interface StarfieldProps {
  stars: SkyStar[];
  summits: HorizonSummit[];
  /** Dreams to label at rest, most meaningful first (dream of the day, then newest). */
  labelCandidates: string[];
  ceremony: Ceremony | null;
  empty: boolean;
}

export function Starfield({ stars, summits, labelCandidates, ceremony, empty }: StarfieldProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const measured = useElementSize(fieldRef);
  // Before the first measurement (and in tests), assume a phone-sized field.
  const width = measured.width || 360;
  const height = measured.height || 520;
  const horizonHeight = width < 600 ? 150 : 180;

  const positions = useMemo(
    () =>
      layoutStars(
        stars.map((s) => s.key),
        { width, height, top: 8, bottom: horizonHeight + 12, side: 28 },
      ),
    [stars, width, height, horizonHeight],
  );

  const labels = useMemo(() => {
    const byKey = new Map(stars.map((s) => [s.key, s]));
    const chosen = restingLabels(
      labelCandidates
        .map((key) => byKey.get(key))
        .filter((s): s is SkyStar => Boolean(s))
        .map((s) => ({ id: s.key, text: s.title })),
      positions,
      width,
    );
    return new Map(chosen.map((l) => [l.id, l.side]));
  }, [labelCandidates, stars, positions, width]);

  const reached = constellationOrder(stars);
  const ceremonyKey = ceremony ? `${ceremony.kind}:${ceremony.id}` : null;
  // While the ceremony runs, its star and line wait, then ignite and draw.
  const phase = ceremony && ceremony.phase !== 'settled' ? ceremony.phase : null;

  // Reading order for the keyboard: top to bottom, then left to right.
  const ordered = [...stars].sort((a, b) => {
    const pa = positions.get(a.key)!;
    const pb = positions.get(b.key)!;
    return pa.y - pb.y || pa.x - pb.x;
  });

  function starCeremony(star: SkyStar): 'pending' | 'igniting' | undefined {
    if (!phase || star.key !== ceremonyKey) return undefined;
    return phase === 'rising' ? 'pending' : 'igniting';
  }

  return (
    <div ref={fieldRef} className={styles.field} data-tour="sky-field">
      <svg
        className={styles.constellation}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
      >
        {reached.slice(1).map((star, i) => {
          const from = positions.get(reached[i].key);
          const to = positions.get(star.key);
          if (!from || !to) return null;
          const isNew = phase !== null && star.key === ceremonyKey;
          const waiting = isNew && (phase === 'rising' || phase === 'ignite');
          return (
            <line
              key={`${reached[i].key}>${star.key}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              pathLength={1}
              className={cx(
                styles.line,
                waiting && styles.linePending,
                isNew && !waiting && styles.lineDrawing,
              )}
            />
          );
        })}
      </svg>

      {ordered.map((star) => {
        const point = positions.get(star.key)!;
        return (
          <StarButton
            key={star.key}
            star={star}
            x={point.x}
            y={point.y}
            labelSide={labels.get(star.key) ?? (point.x > width / 2 ? 'left' : 'right')}
            // Resting labels step aside while the ceremony's words are on screen.
            labelResting={!ceremony && labels.has(star.key)}
            ceremony={starCeremony(star)}
            onOpen={() => openSheet('sky', star.key)}
          />
        );
      })}

      {empty && (
        <p className={styles.emptySky}>Your sky is open. Add a dream — no deadline needed.</p>
      )}

      <Horizon summits={summits} width={width} height={horizonHeight} />

      <div className={styles.addDream}>
        <Button
          icon={<Plus />}
          className={styles.addDreamButton}
          onClick={() => openSheet('sky', 'new-dream')}
          data-tour="add-dream"
        >
          Add a dream
        </Button>
      </div>
    </div>
  );
}
