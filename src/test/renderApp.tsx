import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../app/App';
import { setSetting } from '../db/settings';

/**
 * Renders the whole app at a route, past onboarding and the tour, and waits for the
 * screen title. Pin "today" first with vi.useFakeTimers({ toFake: ['Date'] }).
 */
export async function renderApp(hash = '#/camp') {
  await setSetting('onboarded', true);
  await setSetting('tourDone', true);
  window.history.replaceState(null, '', `/${hash}`);
  const user = userEvent.setup();
  const utils = render(<App />);
  await screen.findByRole('heading', { level: 1 });
  return { user, ...utils };
}

/** Freezes the clock (Date only, so IndexedDB's timers keep running). */
export function setToday(year: number, month: number, day: number, hour = 9) {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(year, month - 1, day, hour) });
}
