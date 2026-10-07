import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../app/App';
import { db } from '../../db/db';
import { at, makeDream, makeGoal, makeMilestone } from '../../test/factories';
import { renderApp, setToday } from '../../test/renderApp';
import { cancelReach, endCeremony } from './reach';

beforeEach(() => setToday(2026, 10, 7));
afterEach(() => {
  // The reach flow lives outside React; never let one test's ceremony leak into the next.
  cancelReach();
  endCeremony();
  vi.useRealTimers();
});

describe('Sky', () => {
  it('starts open, and adds a dream that becomes a star', async () => {
    const { user } = await renderApp('#/sky');
    expect(
      await screen.findByText('Your sky is open. Add a dream — no deadline needed.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add a dream' }));
    const sheet = await screen.findByRole('dialog', { name: 'Add a dream' });
    await user.type(within(sheet).getByLabelText('Your dream'), 'A studio by the sea');
    await user.type(
      within(sheet).getByLabelText('Why does this matter to you?'),
      'Room to make things',
    );
    await user.click(within(sheet).getByRole('button', { name: 'Add to my sky' }));

    expect(
      await screen.findByRole('button', { name: 'Dream: A studio by the sea, still reaching' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/1 dream · 0 reached/)).toBeInTheDocument();
  });

  it('only needs a title for a dream', async () => {
    const { user } = await renderApp('#/sky?open=new-dream');
    const sheet = await screen.findByRole('dialog', { name: 'Add a dream' });
    await user.click(within(sheet).getByRole('button', { name: 'Add to my sky' }));
    expect(within(sheet).getByRole('alert')).toHaveTextContent('Give your dream a name.');
  });

  it('lets the keyboard and the list view reach every star', async () => {
    await db.dreams.bulkAdd([
      makeDream({ title: 'A studio by the sea' }),
      makeDream({ title: 'Learn the cello' }),
      makeDream({
        title: 'See the northern lights',
        status: 'reached',
        reachedAt: at('2026-03-12'),
      }),
    ]);
    await db.goals.add(
      makeGoal({ title: 'Run a half marathon', status: 'reached', reachedAt: at('2026-05-01') }),
    );
    const { user } = await renderApp('#/sky');

    const stars = await screen.findAllByRole('button', {
      name: /^(Dream|Reached (dream|summit)):/,
    });
    expect(stars).toHaveLength(4);
    // Every star is a real, focusable button.
    for (const star of stars) {
      star.focus();
      expect(star).toHaveFocus();
    }

    await user.click(screen.getByRole('button', { name: 'View as list' }));
    const reaching = await screen.findByRole('region', { name: 'Still reaching' });
    expect(within(reaching).getAllByRole('button')).toHaveLength(2);
    const reached = screen.getByRole('region', { name: 'Reached' });
    expect(within(reached).getByText('Run a half marathon')).toBeInTheDocument();
    expect(within(reached).getByText('See the northern lights')).toBeInTheDocument();
  });

  it('plays the ceremony when a summit is reached, adding a gold star joined to the last one', async () => {
    await db.dreams.add(
      makeDream({
        title: 'See the northern lights',
        status: 'reached',
        reachedAt: at('2026-03-12'),
      }),
    );
    const goal = makeGoal({
      title: 'Run a half marathon',
      milestones: [makeMilestone({ title: 'Run 10 km', doneAt: at('2026-10-01') })],
    });
    await db.goals.add(goal);
    const { user } = await renderApp('#/summit');

    await user.click(await screen.findByRole('button', { name: 'Reach the summit' }));
    const prompt = await screen.findByRole('dialog', { name: 'Reach the summit' });
    await user.type(within(prompt).getByLabelText('How does it feel to be here?'), 'Light');
    await user.click(within(prompt).getByRole('button', { name: 'Reach the summit' }));

    expect(
      await screen.findByText(/It’s in your sky now/, {}, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'The sky is the limit' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^Reached summit: Run a half marathon, reached/ }),
    ).toBeInTheDocument();
    // One line joins the earlier gold star to the new one.
    expect(document.querySelectorAll('svg line')).toHaveLength(1);

    const saved = await db.goals.get(goal.id);
    expect(saved).toMatchObject({ status: 'reached', reflection: 'Light' });
  });

  it('marks a dream as reached from its sheet and can move it back', async () => {
    const dream = makeDream({ title: 'A studio by the sea' });
    await db.dreams.add(dream);
    const { user } = await renderApp(`#/sky?open=dream:${dream.id}`);

    const sheet = await screen.findByRole('dialog', { name: 'A studio by the sea' });
    await user.click(within(sheet).getByRole('button', { name: 'Mark as reached' }));
    const prompt = await screen.findByRole('dialog', { name: 'Mark as reached' });
    await user.click(within(prompt).getByRole('button', { name: 'Mark as reached' }));

    expect(
      await screen.findByRole(
        'button',
        { name: /^Reached dream: A studio by the sea/ },
        { timeout: 4000 },
      ),
    ).toBeInTheDocument();

    // Skip the rest of the ceremony, then move it back.
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: /^Reached dream: A studio by the sea/ }));
    const reachedSheet = await screen.findByRole('dialog', { name: 'A studio by the sea' });
    await user.click(within(reachedSheet).getByRole('button', { name: 'Move back to dreaming' }));
    await waitFor(async () => expect((await db.dreams.get(dream.id))?.status).toBe('dreaming'));
  });

  it('shows one peak per active summit on the horizon, opening the summit', async () => {
    const goal = makeGoal({ title: 'Learn to sail', progressMode: 'manual', manualProgress: 40 });
    await db.goals.add(goal);
    const { user } = await renderApp('#/sky');

    await user.click(
      await screen.findByRole('button', { name: 'Summit: Learn to sail, 40% climbed' }),
    );
    expect(await screen.findByRole('heading', { level: 1, name: 'Summit' })).toBeInTheDocument();
    expect(await screen.findByRole('dialog', { name: 'Learn to sail' })).toBeInTheDocument();
  });

  it('links a summit to a dream as a path toward it', async () => {
    const dream = makeDream({ title: 'A studio by the sea' });
    await db.dreams.add(dream);
    await db.goals.add(makeGoal({ title: 'Save for the studio' }));
    const { user } = await renderApp(`#/sky?open=dream:${dream.id}`);

    const sheet = await screen.findByRole('dialog', { name: 'A studio by the sea' });
    await user.selectOptions(within(sheet).getByLabelText('Link a summit'), 'Save for the studio');
    await user.click(within(sheet).getByRole('button', { name: 'Link summit' }));
    const paths = await within(sheet).findByRole('region', { name: 'Paths toward it' });
    expect(
      await within(paths).findByRole('button', { name: /Save for the studio/ }),
    ).toBeInTheDocument();
  });
});

describe('Dream glimpse on Camp', () => {
  it('shows a dream and changes daily', async () => {
    await db.dreams.bulkAdd([
      makeDream({ title: 'A studio by the sea', createdAt: at('2026-01-01') }),
      makeDream({ title: 'Learn the cello', createdAt: at('2026-01-02') }),
    ]);
    const first = await renderApp('#/camp');
    await screen.findByText('Still reaching for');
    const today = screen.getByRole('button', { name: /^Still reaching for/ }).textContent;
    first.unmount();

    setToday(2026, 10, 8);
    await renderApp('#/camp');
    await screen.findByText('Still reaching for');
    const tomorrow = screen.getByRole('button', { name: /^Still reaching for/ }).textContent;
    expect(tomorrow).not.toBe(today);
  });

  it('opens the dream in the Sky', async () => {
    await db.dreams.add(makeDream({ title: 'A studio by the sea' }));
    const { user } = await renderApp('#/camp');
    await user.click(await screen.findByRole('button', { name: /Still reaching for/ }));
    expect(await screen.findByRole('dialog', { name: 'A studio by the sea' })).toBeInTheDocument();
  });
});

describe('First run', () => {
  it('starts with the sky, then one thing for today, and lands on Camp', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Start with the sky.' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('What’s one thing you dream of?'), 'A studio by the sea');
    await user.click(screen.getByRole('button', { name: 'Add to my sky' }));

    expect(
      await screen.findByRole('heading', { name: 'And one thing to do today.' }),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText('What’s one thing you’ll do today?'), 'Morning walk');
    await user.click(screen.getByRole('button', { name: 'Add task' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Camp' })).toBeInTheDocument();
    expect(await screen.findByText('A studio by the sea')).toBeInTheDocument();
    expect(await screen.findByRole('checkbox', { name: 'Morning walk' })).toBeInTheDocument();
  });

  it('can skip both steps', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Skip for now' }));
    await user.click(await screen.findByRole('button', { name: 'Skip for now' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Camp' })).toBeInTheDocument();
    expect(await screen.findByText('Your sky is open')).toBeInTheDocument();
  });
});
