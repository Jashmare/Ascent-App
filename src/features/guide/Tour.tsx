import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { currentRoute, navigate } from '../../app/router';
import { Button } from '../../components/Button';
import { endTour, setTourStep, useTourStep } from './tourState';
import { TOUR_STEPS } from './tourSteps';
import styles from './Tour.module.css';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;

/**
 * The guided tour. It walks up the altitudes, spotlighting the real controls one at a time.
 * A modal dialog: Next, Back and Skip are keyboard reachable, and Escape ends it.
 */
export function Tour() {
  const step = useTourStep();
  if (step === null) return null;
  return <TourStepView key={step} index={step} />;
}

function TourStepView({ index }: { index: number }) {
  const step = TOUR_STEPS[index];
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const [searching, setSearching] = useState(Boolean(step.target));
  const last = index === TOUR_STEPS.length - 1;

  // Open as a modal, so focus stays in the card; Escape ends the tour.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector<HTMLElement>('[data-tour-primary]')?.focus();
    const onCancel = (event: Event) => {
      event.preventDefault();
      endTour();
    };
    dialog.addEventListener('cancel', onCancel);
    return () => {
      dialog.removeEventListener('cancel', onCancel);
      if (dialog.open) dialog.close();
    };
  }, []);

  // Go to the step's altitude, then find and measure the element it points at.
  useLayoutEffect(() => {
    if (currentRoute().screen !== step.screen || currentRoute().open) {
      navigate({ screen: step.screen });
    }
    if (!step.target) return;
    // Timers rather than animation frames: frames pause while a window is in the
    // background, and the card must never wait on them to appear.
    const timers: number[] = [];
    let tries = 0;
    let element: HTMLElement | null = null;
    const measure = () => {
      if (!element?.isConnected) return;
      const box = element.getBoundingClientRect();
      setRect({ top: box.top, left: box.left, width: box.width, height: box.height });
    };
    const find = () => {
      // Skip copies on their way out during an altitude transition.
      element =
        Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${step.target}"]`)).find(
          (el) => !el.closest('[inert]'),
        ) ?? null;
      if (element) {
        // Scrolling into view is instant, so the element can be measured straight away.
        element.scrollIntoView({ block: 'center', inline: 'nearest' });
        measure();
        setSearching(false);
        // Measure once more after any late layout (fonts, the transition's last frames).
        timers.push(window.setTimeout(measure, 300));
      } else if (tries++ < 20) {
        timers.push(window.setTimeout(find, 75));
      } else {
        // Nothing to point at (say, no tasks yet today): show the card on its own.
        setSearching(false);
      }
    };
    // Altitude changes animate for 260ms; look once the new screen has arrived.
    timers.push(window.setTimeout(find, 320));
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step.screen, step.target]);

  const spot: CSSProperties | undefined = rect
    ? {
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : undefined;

  // Place the card by its real height: below the spotlight if it fits, else above it, else
  // (for something as tall as the starfield) docked at the bottom of the screen.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card || !rect || searching) return;
    const height = card.offsetHeight;
    const gap = PAD * 2;
    const below = window.innerHeight - (rect.top + rect.height) - gap;
    const above = rect.top - gap;
    let top: number;
    if (below >= height + PAD) top = rect.top + rect.height + gap;
    else if (above >= height + PAD) top = rect.top - gap - height;
    else top = window.innerHeight - height - gap;
    card.style.top = `${Math.max(PAD, top)}px`;
  }, [rect, searching]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.tour}
      aria-labelledby="tour-title"
      aria-describedby="tour-body"
    >
      <div className={rect ? styles.clear : styles.scrim} aria-hidden="true" />
      {rect && <div className={styles.spot} style={spot} aria-hidden="true" />}
      <div
        ref={cardRef}
        className={rect ? styles.card : `${styles.card} ${styles.centred}`}
        hidden={searching}
      >
        <p className={styles.count}>
          {index + 1} of {TOUR_STEPS.length}
        </p>
        <h2 id="tour-title" className={styles.title}>
          {step.title}
        </h2>
        <p id="tour-body" className={styles.body}>
          {step.body}
        </p>
        <div className={styles.actions}>
          {index > 0 && (
            <Button icon={<ArrowLeft />} onClick={() => setTourStep(index - 1)}>
              Back
            </Button>
          )}
          {last ? (
            <Button variant="primary" icon={<Check />} onClick={endTour} data-tour-primary>
              Start climbing
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setTourStep(index + 1)} data-tour-primary>
              Next
              <ArrowRight aria-hidden="true" />
            </Button>
          )}
          {!last && (
            <Button variant="ghost" className={styles.skip} onClick={endTour}>
              Skip tour
            </Button>
          )}
        </div>
      </div>
    </dialog>
  );
}
