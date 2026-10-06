import { motion } from 'motion/react';
import { useCallback, useEffect, useRef } from 'react';
import { cx } from '../../components/cx';
import { endCeremony, openTheSky, setCeremonyPhase, useReachState, type Ceremony } from './reach';
import styles from './Sky.module.css';

/** The one big moment (docs/DESIGN.md §6.3). Tap or press Escape to skip. */
export function CeremonyOverlay() {
  const { ceremony } = useReachState();
  if (!ceremony) return null;
  return <CeremonyRun key={ceremony.key} ceremony={ceremony} />;
}

function CeremonyRun({ ceremony }: { ceremony: Ceremony }) {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startedSettled = useRef(ceremony.phase === 'settled');
  const starKey = `${ceremony.kind}:${ceremony.id}`;

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const finish = useCallback(() => {
    clearTimers();
    endCeremony();
    // Land keyboard and screen reader users on the new star.
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>(`[data-star-key="${starKey}"]`)?.focus(),
    );
  }, [clearTimers, starKey]);

  useEffect(() => {
    if (startedSettled.current) {
      timers.current = [setTimeout(finish, 4000)];
    } else {
      timers.current = [
        setTimeout(openTheSky, 450),
        setTimeout(() => setCeremonyPhase('ignite'), 800),
        setTimeout(() => setCeremonyPhase('draw'), 1000),
        setTimeout(() => setCeremonyPhase('text'), 1250),
        setTimeout(finish, 5200),
      ];
    }
    return clearTimers;
  }, [clearTimers, finish]);

  const skip = useCallback(() => {
    if (ceremony.phase === 'text' || ceremony.phase === 'settled') {
      finish();
      return;
    }
    clearTimers();
    openTheSky();
    setCeremonyPhase('settled');
    timers.current = [setTimeout(finish, 3500)];
  }, [ceremony.phase, clearTimers, finish]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') skip();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [skip]);

  const showWords = ceremony.phase === 'text' || ceremony.phase === 'settled';

  return (
    // A full-screen, transparent catcher: any tap skips ahead. Escape does the same.
    // eslint-disable-next-line jsx-a11y-x/click-events-have-key-events, jsx-a11y-x/no-static-element-interactions
    <div className={styles.ceremony} onClick={skip}>
      {ceremony.phase === 'rising' && (
        <div className={styles.ceremonyAnchor} aria-hidden="true">
          <motion.div
            className={styles.ceremonyChip}
            initial={{ opacity: 1, scale: 1, y: 0 }}
            animate={{ opacity: [1, 1, 0], scale: [1, 1.02, 0.15], y: [0, -14, -36] }}
            transition={{ duration: 0.5, times: [0, 0.3, 1], ease: 'easeOut' }}
          >
            {ceremony.title}
          </motion.div>
          <motion.div
            className={styles.ceremonyLight}
            initial={{ opacity: 0, scale: 0.4, y: '-4vh' }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.4, 1, 1, 0.7],
              y: ['-4vh', '-5vh', '-58vh', '-70vh'],
            }}
            transition={{ duration: 0.85, times: [0, 0.35, 0.85, 1], ease: 'easeIn' }}
          />
        </div>
      )}
      <p className={cx(styles.ceremonyText, showWords && styles.ceremonyTextShown)} role="status">
        {showWords ? (
          <>
            Reached.
            <br />
            It’s in your sky now.
          </>
        ) : null}
      </p>
    </div>
  );
}
