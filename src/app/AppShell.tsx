import {
  AnimatePresence,
  motion,
  useIsPresent,
  useReducedMotion,
  type Variants,
} from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CampScreen } from '../features/camp/CampScreen';
import { Tour } from '../features/guide/Tour';
import { ReminderRunner } from '../features/reminders/ReminderRunner';
import { GuideScreen } from '../features/guide/GuideScreen';
import { WeeklyReviewScreen } from '../features/reminders/WeeklyReviewScreen';
import { RidgeScreen } from '../features/ridge/RidgeScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { CeremonyOverlay } from '../features/sky/CeremonyOverlay';
import { ReachSheet } from '../features/sky/ReachSheet';
import { SkyBackdrop } from '../features/sky/SkyBackdrop';
import { SkyScreen } from '../features/sky/SkyScreen';
import { SummitScreen } from '../features/summit/SummitScreen';
import { SCREEN_META, travelDirection } from './altitudes';
import { Nav } from './Nav';
import { isAltitude, rememberAltitude, useRoute, type Route, type Screen } from './router';
import { syncThemeColor } from './theme';
import styles from './AppShell.module.css';

const SHIFT = 40;

// docs/DESIGN.md §6.1. Going up, the current screen slides down and fades while the new one
// enters from above; going down is the reverse. Reduced motion: a 120ms crossfade only.
const slide: Variants = {
  enter: (direction: number) => ({ opacity: 0, y: direction * -SHIFT }),
  center: { opacity: 1, y: 0 },
  exit: (direction: number) => ({ opacity: 0, y: direction * SHIFT }),
};

const fade: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

/** A screen on its way out can't be focused or read while it fades. */
function PresenceGuard({ children }: { children: ReactNode }) {
  const isPresent = useIsPresent();
  return <div inert={!isPresent}>{children}</div>;
}

function ScreenView({ route }: { route: Route }) {
  switch (route.screen) {
    case 'camp':
      return <CampScreen route={route} />;
    case 'ridge':
      return <RidgeScreen route={route} />;
    case 'summit':
      return <SummitScreen route={route} />;
    case 'sky':
      return <SkyScreen route={route} />;
    case 'settings':
      return <SettingsScreen />;
    case 'review':
      return <WeeklyReviewScreen />;
    case 'guide':
      return <GuideScreen />;
  }
}

export function AppShell() {
  const route = useRoute();
  const reducedMotion = useReducedMotion() ?? false;
  const altitude = SCREEN_META[route.screen].altitude;

  // Remember where we came from to know which way to slide. (Adjusting state while
  // rendering is React's recommended way to derive state from a changing prop.)
  const [view, setView] = useState<{ screen: Screen; direction: number }>({
    screen: route.screen,
    direction: 0,
  });
  if (view.screen !== route.screen) {
    setView({ screen: route.screen, direction: travelDirection(view.screen, route.screen) });
  }

  // The altitude's tokens apply to the whole document, so the background crossfades.
  useEffect(() => {
    document.documentElement.dataset.altitude = altitude;
    syncThemeColor();
  }, [altitude]);

  // Twinkling pauses while the tab is hidden (docs/DESIGN.md §6.4).
  useEffect(() => {
    const sync = () => document.documentElement.toggleAttribute('data-tab-hidden', document.hidden);
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);

  // On arrival at a new screen: start at the top and move focus to its title, so keyboard
  // and screen reader users land in the right place. Skipped on first load.
  const firstRender = useRef(true);
  useEffect(() => {
    rememberAltitude(route.screen);
    document.title = `${SCREEN_META[route.screen].title} · Ascent`;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    if (!new URLSearchParams(window.location.hash.split('?')[1] ?? '').has('open')) {
      document
        .querySelector<HTMLElement>(`[data-screen="${route.screen}"] [data-screen-title]`)
        ?.focus({ preventScroll: true });
    }
  }, [route.screen]);

  const variants = reducedMotion ? fade : slide;
  const transition = reducedMotion
    ? { duration: 0.12, ease: 'linear' as const }
    : { duration: 0.26, ease: 'easeOut' as const };

  return (
    <div className={styles.shell}>
      <SkyBackdrop visible={altitude === 'sky'} />
      <main className={styles.stage}>
        <AnimatePresence initial={false} custom={view.direction} mode="popLayout">
          <motion.div
            key={route.screen}
            className={styles.screen}
            data-altitude={altitude}
            data-screen={route.screen}
            custom={view.direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
          >
            <PresenceGuard>
              <ScreenView route={route} />
            </PresenceGuard>
          </motion.div>
        </AnimatePresence>
      </main>
      <Nav current={isAltitude(route.screen) ? route.screen : null} />
      <ReachSheet />
      <CeremonyOverlay />
      <ReminderRunner />
      <Tour />
    </div>
  );
}
