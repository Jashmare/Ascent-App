import { Compass } from 'lucide-react';
import { useAppSettings } from '../../app/settingsContext';
import { Button } from '../../components/Button';
import { setSetting } from '../../db/settings';
import { startTour, useTourStep } from './tourState';
import styles from './TourPrompt.module.css';

/** After the first run, Camp offers the tour once. */
export function TourPrompt() {
  const { tourDone } = useAppSettings();
  const step = useTourStep();
  if (tourDone || step !== null) return null;
  return (
    <section className={styles.prompt} aria-labelledby="tour-prompt">
      <Compass className={styles.icon} aria-hidden="true" />
      <div className={styles.text}>
        <p id="tour-prompt" className={styles.title}>
          New here? Take a one-minute tour of the climb.
        </p>
        <div className={styles.actions}>
          <Button variant="primary" onClick={startTour}>
            Take the tour
          </Button>
          <Button variant="ghost" onClick={() => void setSetting('tourDone', true)}>
            No thanks
          </Button>
        </div>
      </div>
    </section>
  );
}
