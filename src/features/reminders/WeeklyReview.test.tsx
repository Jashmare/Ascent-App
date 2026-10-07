import { screen, waitFor, within } from '@testing-library/react';
import { db } from '../../db/db';
import { getSettings, setSetting } from '../../db/settings';
import {
  at,
  done,
  makeDream,
  makeGoal,
  makeMilestone,
  makeObjective,
  makeTask,
} from '../../test/factories';
import { renderApp, setToday } from '../../test/renderApp';

afterEach(() => vi.useRealTimers());

describe('Weekly review', () => {
  it('is offered on Camp on review day and walks through all four steps', async () => {
    setToday(2026, 10, 11, 18); // Sunday evening, the default review time
    const walk = makeTask({
      title: 'Morning walk',
      repeat: { kind: 'daily' },
      createdAt: at('2026-10-01'),
    });
    await db.tasks.add(walk);
    await db.completions.bulkAdd([done(walk.id, '2026-10-06'), done(walk.id, '2026-10-07')]);
    await db.objectives.bulkAdd([
      makeObjective({ title: 'Send the invoice', status: 'done', doneAt: at('2026-10-08') }),
      makeObjective({ title: 'Refresh portfolio', dueDate: '2026-10-11' }),
    ]);
    await db.goals.add(
      makeGoal({
        title: 'Run a half marathon',
        milestones: [makeMilestone({ title: 'Run 5 km' })],
      }),
    );
    await db.dreams.add(makeDream({ title: 'A studio by the sea', vision: 'Morning light.' }));
    const { user } = await renderApp('#/camp');

    expect(await screen.findByText('Time to look at the week from the ridge.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Start the review' }));

    // Step 1: the week on the ridge.
    expect(
      await screen.findByRole('heading', { name: 'What got done on the ridge' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/2 tasks/)).toBeInTheDocument();
    expect(screen.getByText('Send the invoice')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: /Refresh portfolio/ }));
    await waitFor(async () =>
      expect((await db.objectives.toArray()).every((o) => o.status === 'done')).toBe(true),
    );

    // Step 2: summit progress.
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByRole('heading', { name: 'Update summit progress' })).toHaveFocus();
    await user.click(screen.getByRole('checkbox', { name: 'Run 5 km' }));
    await waitFor(async () =>
      expect((await db.goals.toArray())[0].milestones[0].doneAt).toBeDefined(),
    );

    // Step 3: one dream.
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('A studio by the sea')).toBeInTheDocument();
    expect(screen.getByText('Morning light.')).toBeInTheDocument();

    // Step 4: next week's objectives.
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.type(
      await screen.findByLabelText('Add an objective for next week'),
      'Book the race{Enter}',
    );
    expect(await screen.findByText('Book the race')).toBeInTheDocument();
    expect((await db.objectives.toArray()).find((o) => o.title === 'Book the race')?.horizon).toBe(
      'week',
    );

    await user.click(screen.getByRole('button', { name: 'Finish the review' }));
    expect(await screen.findByText('Review done. Have a good week.')).toBeInTheDocument();
    expect((await getSettings()).lastReviewDate).toBe('2026-10-11');
    expect(await screen.findByRole('heading', { level: 1, name: 'Camp' })).toBeInTheDocument();
    expect(screen.queryByText('Time to look at the week from the ridge.')).not.toBeInTheDocument();
  });

  it('can be put off until next week with “Not now”', async () => {
    setToday(2026, 10, 11);
    const { user } = await renderApp('#/camp');
    await user.click(await screen.findByRole('button', { name: 'Not now' }));
    await waitFor(() =>
      expect(
        screen.queryByText('Time to look at the week from the ridge.'),
      ).not.toBeInTheDocument(),
    );
    expect((await getSettings()).reviewDismissedOn).toBe('2026-10-11');
  });

  it('isn’t offered on other days, or when switched off', async () => {
    setToday(2026, 10, 12); // Monday
    const first = await renderApp('#/camp');
    await screen.findByRole('heading', { level: 1, name: 'Camp' });
    expect(screen.queryByText('Time to look at the week from the ridge.')).not.toBeInTheDocument();
    first.unmount();

    setToday(2026, 10, 11);
    const { reminders } = await getSettings();
    await setSetting('reminders', {
      ...reminders,
      weeklyReview: { ...reminders.weeklyReview, on: false },
    });
    await renderApp('#/camp');
    await screen.findByText(/Nothing planned for today yet/);
    expect(screen.queryByText('Time to look at the week from the ridge.')).not.toBeInTheDocument();
  });
});

describe('Due today on Camp', () => {
  it('lists objectives due today and opens them', async () => {
    setToday(2026, 10, 7);
    await db.objectives.bulkAdd([
      makeObjective({ title: 'Send the invoice', dueDate: '2026-10-07' }),
      makeObjective({ title: 'Refresh portfolio', dueDate: '2026-10-10' }),
    ]);
    const { user } = await renderApp('#/camp');

    const due = await screen.findByRole('region', { name: 'Due today' });
    expect(within(due).getByText('Send the invoice')).toBeInTheDocument();
    // "Next on the ridge" looks past what's already listed.
    const next = screen.getByRole('region', { name: 'Next on the ridge' });
    expect(within(next).getByText('Refresh portfolio')).toBeInTheDocument();

    await user.click(within(due).getByRole('button', { name: 'Send the invoice' }));
    expect(await screen.findByRole('dialog', { name: 'Objective' })).toBeInTheDocument();
  });
});
