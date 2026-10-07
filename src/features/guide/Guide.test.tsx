import { render, screen, waitFor } from '@testing-library/react';
import { ErrorBoundary } from '../../app/ErrorBoundary';
import { getSettings, setSetting } from '../../db/settings';
import { renderApp, setToday } from '../../test/renderApp';
import { endTour } from './tourState';
import { TOUR_STEPS } from './tourSteps';

beforeEach(() => setToday(2026, 10, 7));
afterEach(() => {
  // The tour's step lives outside React; never let one test's tour leak into the next.
  endTour();
  vi.useRealTimers();
});

describe('Guide', () => {
  it('explains every part of the app', async () => {
    await renderApp('#/guide');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'How Ascent works' }),
    ).toBeInTheDocument();
    for (const title of [
      'The climb',
      'Camp: today',
      'Ridge: objectives',
      'Summit: long-term goals',
      'Sky: dreams',
      'The altimeter',
      'Reminders',
      'Your data',
      'Keyboard',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument();
    }
  });

  // Each step waits for the altitude transition before it spotlights, so this takes a while.
  it('starts the tour, which walks up the altitudes', { timeout: 30_000 }, async () => {
    const { user } = await renderApp('#/guide');
    await user.click((await screen.findAllByRole('button', { name: 'Take the tour' }))[0]);

    expect(await screen.findByRole('dialog', { name: 'Welcome to the climb' })).toBeInTheDocument();
    expect(screen.getByText(`1 of ${TOUR_STEPS.length}`)).toBeInTheDocument();
    // The first step goes to Camp.
    expect(await screen.findByRole('heading', { level: 1, name: 'Camp' })).toBeInTheDocument();

    // Walk up to the Ridge step, one step at a time.
    for (let i = 1; i <= 6; i++) {
      await user.click(await screen.findByRole('button', { name: 'Next' }, { timeout: 3000 }));
      expect(
        await screen.findByRole('dialog', { name: TOUR_STEPS[i].title }, { timeout: 3000 }),
      ).toBeInTheDocument();
    }
    expect(TOUR_STEPS[6].title).toBe('The ridge');
    expect(await screen.findByRole('heading', { level: 1, name: 'Ridge' })).toBeInTheDocument();

    // The card shows once its target has been found and measured.
    await user.click(await screen.findByRole('button', { name: 'Back' }, { timeout: 3000 }));
    expect(
      await screen.findByRole('dialog', { name: 'Climb higher' }, { timeout: 3000 }),
    ).toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'Skip tour' }, { timeout: 3000 }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect((await getSettings()).tourDone).toBe(true);
  });

  it('ends the tour with Escape', async () => {
    const { user } = await renderApp('#/guide');
    await user.click((await screen.findAllByRole('button', { name: 'Take the tour' }))[0]);
    await screen.findByRole('dialog', { name: 'Welcome to the climb' });
    const dialog = screen.getByRole('dialog');
    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('is offered once on Camp after the first run', async () => {
    const { user } = await renderApp('#/camp');
    await setSetting('tourDone', false);
    expect(
      await screen.findByText('New here? Take a one-minute tour of the climb.'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'No thanks' }));
    await waitFor(() =>
      expect(
        screen.queryByText('New here? Take a one-minute tour of the climb.'),
      ).not.toBeInTheDocument(),
    );
    expect((await getSettings()).tourDone).toBe(true);
  });
});

describe('ErrorBoundary', () => {
  it('offers a way back instead of a blank page', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    function Broken(): never {
      throw new Error('Broken screen');
    }
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    );
    expect(
      screen.getByRole('heading', { name: 'Ascent couldn’t show this screen.' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Your data is safe on this device/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload Ascent' })).toBeInTheDocument();
  });
});
