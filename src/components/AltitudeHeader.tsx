import { ArrowLeft, CircleHelp, Settings } from 'lucide-react';
import type { ReactNode } from 'react';
import { goBack } from '../app/router';
import { useAppSettings } from '../app/settingsContext';
import { useToday } from '../app/useToday';
import { useAltimeter } from '../db/hooks';
import { formatAltitude, formatGain } from '../lib/altimeter';
import { cx } from './cx';
import { Tabular } from './Tabular';
import styles from './AltitudeHeader.module.css';

interface AltitudeHeaderProps {
  title: ReactNode;
  /** Lines under the title (Camp shows the date and a greeting). */
  children?: ReactNode;
  /** Extra controls placed before the guide and settings buttons. */
  actions?: ReactNode;
  showAltimeter?: boolean;
  /** Larger serif title, used by the Sky. */
  variant?: 'altitude' | 'sky';
  /** A back button to the last altitude, for screens outside the climb. */
  back?: boolean;
  /** Hide the guide and settings links (on their own screens). */
  hideLinks?: boolean;
}

export function AltitudeHeader({
  title,
  children,
  actions,
  showAltimeter = true,
  variant = 'altitude',
  back,
  hideLinks,
}: AltitudeHeaderProps) {
  return (
    <header className={cx(styles.header, variant === 'sky' && styles.sky)}>
      {back && (
        <button type="button" className={styles.back} onClick={goBack}>
          <ArrowLeft aria-hidden="true" />
          Back
        </button>
      )}
      <div className={styles.top}>
        <h1 className={styles.title} tabIndex={-1} data-screen-title>
          {title}
        </h1>
        {showAltimeter && <AltimeterReadout />}
        {(actions || !hideLinks) && (
          <div className={styles.tools}>
            {actions}
            {!hideLinks && <HeaderLinks />}
          </div>
        )}
      </div>
      {children && <div className={styles.sub}>{children}</div>}
    </header>
  );
}

/** "+60 m today" over "4,320 m climbed". */
export function AltimeterReadout() {
  const today = useToday();
  const { units } = useAppSettings();
  const climbed = useAltimeter(today);
  const todayLabel = `${formatGain(climbed?.today ?? 0, units)} today`;
  const totalLabel = `${formatAltitude(climbed?.total ?? 0, units)} climbed`;
  return (
    <p className={styles.altimeter} data-tour="altimeter">
      <Tabular className={styles.altToday}>{todayLabel}</Tabular>
      <Tabular className={styles.altTotal}>{totalLabel}</Tabular>
    </p>
  );
}

function HeaderLinks() {
  return (
    <>
      <a href="#/guide" className={styles.tool} aria-label="Guide" title="Guide" data-tour="guide">
        <CircleHelp aria-hidden="true" />
      </a>
      <a
        href="#/settings"
        className={styles.tool}
        aria-label="Settings"
        title="Settings"
        data-tour="settings"
      >
        <Settings aria-hidden="true" />
      </a>
    </>
  );
}
