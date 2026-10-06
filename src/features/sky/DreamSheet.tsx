import { Link as LinkIcon, Star } from 'lucide-react';
import { useId, useState } from 'react';
import { openSheet } from '../../app/router';
import { notify } from '../../app/toast';
import { BlobImage } from '../../components/BlobImage';
import { Button } from '../../components/Button';
import { cx } from '../../components/cx';
import { SelectField } from '../../components/Field';
import { Menu } from '../../components/Menu';
import { PeakGlyph } from '../../components/PeakGlyph';
import { Sheet } from '../../components/Sheet';
import { deleteDream, linkSummitToDream, moveDreamBack } from '../../db/dreams';
import type { Dream, Goal, Objective } from '../../db/types';
import { formatFullDate } from '../../lib/dates';
import { goalProgress } from '../../lib/progress';
import { requestReach } from './reach';
import styles from './Sky.module.css';

interface DreamSheetProps {
  dream: Dream;
  goals: Goal[];
  objectives: Objective[];
  onClose: () => void;
}

/** A dream: why it matters, what it looks like, and the summits that lead toward it. */
export function DreamSheet({ dream, goals, objectives, onClose }: DreamSheetProps) {
  const ids = useId();
  const [linkId, setLinkId] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const reached = dream.status === 'reached';
  const paths = goals.filter((g) => g.dreamId === dream.id);
  const linkable = goals.filter((g) => g.status === 'active' && g.dreamId !== dream.id);

  const edit = () => openSheet('sky', `edit-dream:${dream.id}`);
  const footer = confirmingDelete ? (
    <div className={styles.confirmRow}>
      <p className={styles.confirmText}>
        Delete this dream? Summits that lead toward it stay, unlinked.
      </p>
      <Button
        variant="destructive"
        onClick={async () => {
          await deleteDream(dream.id);
          onClose();
          notify('Deleted');
        }}
      >
        Delete dream
      </Button>
      <Button onClick={() => setConfirmingDelete(false)}>Keep it</Button>
    </div>
  ) : (
    <>
      {reached ? (
        <Button
          onClick={async () => {
            await moveDreamBack(dream.id);
            notify('Moved back to dreaming');
          }}
        >
          Move back to dreaming
        </Button>
      ) : (
        <Button
          variant="primary"
          icon={<Star />}
          onClick={() => requestReach({ kind: 'dream', id: dream.id, title: dream.title })}
        >
          Mark as reached
        </Button>
      )}
      <Button onClick={edit}>Edit</Button>
      <span className={styles.footerSpacer} />
      <Menu
        label="More dream actions"
        items={[
          { label: 'Edit dream', onSelect: edit },
          { label: 'Delete dream', destructive: true, onSelect: () => setConfirmingDelete(true) },
        ]}
      />
    </>
  );

  return (
    <Sheet title={dream.title} serifTitle onClose={onClose} footer={footer}>
      {dream.photo && (
        <BlobImage blob={dream.photo} alt={`Photo for “${dream.title}”`} className={styles.photo} />
      )}

      {reached && (
        <p className={styles.reachedLine}>
          <Star aria-hidden="true" /> Reached {formatFullDate(dream.reachedAt ?? dream.createdAt)}
        </p>
      )}
      {dream.reflection && (
        <blockquote className={styles.reflection}>{dream.reflection}</blockquote>
      )}

      {dream.why && (
        <section className={styles.dreamSection} aria-labelledby={`${ids}-why`}>
          <h3 id={`${ids}-why`} className={styles.dreamHeading}>
            Why it matters
          </h3>
          <p className={styles.hopeful}>{dream.why}</p>
        </section>
      )}
      {dream.vision && (
        <section className={styles.dreamSection} aria-labelledby={`${ids}-vision`}>
          <h3 id={`${ids}-vision`} className={styles.dreamHeading}>
            Picture it
          </h3>
          <p className={cx(styles.hopeful, styles.vision)}>{dream.vision}</p>
        </section>
      )}

      <section className={styles.dreamSection} aria-labelledby={`${ids}-paths`}>
        <h3 id={`${ids}-paths`} className={styles.dreamHeading}>
          Paths toward it
        </h3>
        {paths.length === 0 ? (
          <p className={styles.mutedText}>
            No summits lead here yet. Link one to give this dream a path.
          </p>
        ) : (
          <ul className={styles.paths}>
            {paths.map((goal) => {
              const progress = goalProgress(goal, objectives);
              const done = goal.status === 'reached';
              return (
                <li key={goal.id}>
                  <button
                    type="button"
                    className={styles.path}
                    onClick={() =>
                      done
                        ? openSheet('sky', `summit:${goal.id}`)
                        : openSheet('summit', `summit:${goal.id}`)
                    }
                  >
                    {done ? (
                      <Star className={styles.pathStar} aria-hidden="true" />
                    ) : (
                      <PeakGlyph progress={progress} size={28} />
                    )}
                    <span className={styles.pathTitle}>{goal.title}</span>
                    <span className={cx(styles.pathProgress, 'tabular')}>
                      {done ? 'Reached' : `${progress}%`}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {linkable.length > 0 && (
          <div className={styles.linkRow}>
            <SelectField
              label="Link a summit"
              value={linkId}
              onChange={(event) => setLinkId(event.target.value)}
            >
              <option value="">Choose a summit</option>
              {linkable.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </SelectField>
            <Button
              icon={<LinkIcon />}
              disabled={!linkId}
              onClick={async () => {
                await linkSummitToDream(linkId, dream.id);
                setLinkId('');
                notify('Linked');
              }}
            >
              Link summit
            </Button>
          </div>
        )}
      </section>

      <p className={styles.added}>Added {formatFullDate(dream.createdAt)}</p>
    </Sheet>
  );
}
