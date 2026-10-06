import { screen, waitFor, within } from '@testing-library/react';
import { db } from '../../db/db';
import { at, makeGoal, makeMilestone } from '../../test/factories';
import { renderApp, setToday } from '../../test/renderApp';

beforeEach(() => setToday(2026, 10, 7));
afterEach(() => vi.useRealTimers());

describe('Summit', () => {
  it('adds a summit and opens its sheet to fill in the rest', async () => {
    const { user } = await renderApp('#/summit');
    expect(await screen.findByText(/No summits yet/)).toBeInTheDocument();

    await user.type(screen.getByLabelText('Add a summit'), 'Run a half marathon{Enter}');
    const sheet = await screen.findByRole('dialog', { name: 'Run a half marathon' });
    // Nothing to count yet, so progress is set by hand.
    expect(within(sheet).getByText(/set it by hand/)).toBeInTheDocument();
    expect(within(sheet).getByRole('slider')).toBeInTheDocument();
  });

  it('counts milestones toward auto progress and adds 250 m for each', async () => {
    const goal = makeGoal({ title: 'Run a half marathon' });
    await db.goals.add(goal);
    const { user } = await renderApp('#/summit');

    await user.click(await screen.findByRole('button', { name: /Run a half marathon/ }));
    const sheet = await screen.findByRole('dialog', { name: 'Run a half marathon' });
    for (const title of ['Run 5 km', 'Run 10 km without stopping']) {
      await user.type(within(sheet).getByLabelText('Add a milestone'), title);
      await user.click(within(sheet).getByRole('button', { name: 'Add milestone' }));
      await within(sheet).findByRole('checkbox', { name: title });
    }

    await user.click(within(sheet).getByRole('checkbox', { name: 'Run 5 km' }));
    expect(await within(sheet).findByText('50%')).toBeInTheDocument();
    expect(await screen.findByText('Milestone done. +250 m')).toBeInTheDocument();
    expect(screen.getByText('+250 m today')).toBeInTheDocument();
  });

  it('shows the next milestone and offers to reach the summit at 100%', async () => {
    await db.goals.bulkAdd([
      makeGoal({
        title: 'Lead a design team',
        milestones: [
          makeMilestone({ title: 'Mentor a junior designer', doneAt: at('2026-10-01') }),
          makeMilestone({ title: 'Run the planning meeting' }),
        ],
      }),
      makeGoal({
        title: 'Learn to sail',
        milestones: [makeMilestone({ title: 'Take a course', doneAt: at('2026-10-01') })],
      }),
    ]);
    await renderApp('#/summit');

    expect(await screen.findByText('Next: Run the planning meeting')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Reach the summit' })).toHaveLength(1);
  });

  it('saves edits as you go', async () => {
    const goal = makeGoal({ title: 'Learn to sail' });
    await db.goals.add(goal);
    const { user } = await renderApp(`#/summit?open=summit:${goal.id}`);

    const sheet = await screen.findByRole('dialog', { name: 'Learn to sail' });
    await user.type(within(sheet).getByLabelText('Why it matters'), 'Freedom on the water');
    await user.selectOptions(within(sheet).getByLabelText('Target month'), '06');
    await user.click(within(sheet).getByRole('button', { name: 'Done' }));

    await waitFor(async () => {
      const saved = await db.goals.get(goal.id);
      expect(saved?.why).toBe('Freedom on the water');
      expect(saved?.targetMonth).toBe('2027-06');
    });
  });

  it('switches to manual progress with a slider in steps of 5', async () => {
    const goal = makeGoal({ title: 'Write a book', milestones: [makeMilestone()] });
    await db.goals.add(goal);
    const { user } = await renderApp(`#/summit?open=summit:${goal.id}`);

    const sheet = await screen.findByRole('dialog', { name: 'Write a book' });
    await user.click(within(sheet).getByRole('radio', { name: 'Manual' }));
    const slider = await within(sheet).findByRole('slider');
    expect(slider).toHaveAttribute('step', '5');
  });
});
