import { screen, waitFor, within } from '@testing-library/react';
import { db } from '../../db/db';
import { makeGoal, makeMilestone, makeObjective, makeTask } from '../../test/factories';
import { renderApp, setToday } from '../../test/renderApp';

beforeEach(() => setToday(2026, 10, 7)); // Wednesday 7 October 2026
afterEach(() => vi.useRealTimers());

describe('Ridge', () => {
  it('adds an objective for this month by default', async () => {
    const { user } = await renderApp('#/ridge');
    expect(
      await screen.findByText(/No objectives yet. What do you want done by the end of this month/),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText('Add an objective'), 'Finish the course module{Enter}');

    const group = await screen.findByRole('region', { name: 'This month' });
    expect(within(group).getByText('Finish the course module')).toBeInTheDocument();
  });

  it('groups by due date with plain-word labels and hides empty groups', async () => {
    await db.objectives.bulkAdd([
      makeObjective({ title: 'Send the invoice', dueDate: '2026-10-05' }),
      makeObjective({ title: 'Refresh portfolio', horizon: 'quarter', dueDate: '2026-10-10' }),
      makeObjective({ title: 'Plan the trip', horizon: 'someday' }),
    ]);
    await renderApp('#/ridge');

    const overdue = await screen.findByRole('region', { name: 'Overdue' });
    expect(within(overdue).getByText('2 days overdue')).toBeInTheDocument();
    const week = screen.getByRole('region', { name: 'This week' });
    expect(within(week).getByText('3 days left')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Someday' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'This quarter' })).not.toBeInTheDocument();
  });

  it('completes an objective, adds 100 m and confirms', async () => {
    await db.objectives.add(makeObjective({ title: 'Refresh portfolio' }));
    const { user } = await renderApp('#/ridge');

    await user.click(
      await screen.findByRole('checkbox', { name: 'Mark “Refresh portfolio” as done' }),
    );
    expect(await screen.findByText('Done. +100 m')).toBeInTheDocument();
    expect(screen.getByText('+100 m today')).toBeInTheDocument();
    // It moves to the Done list, where it can be reopened.
    expect(await screen.findByText(/^Done/, { selector: 'summary' })).toBeInTheDocument();
  });

  it('shows linked task counts and adds a linked task for today from the sheet', async () => {
    const objective = makeObjective({ title: 'Refresh portfolio' });
    await db.objectives.add(objective);
    const { user } = await renderApp('#/ridge');

    await user.click(await screen.findByRole('button', { name: /Refresh portfolio/ }));
    const sheet = await screen.findByRole('dialog', { name: 'Objective' });
    await user.type(
      within(sheet).getByLabelText('Add a task for today that links here'),
      'Draft the case study',
    );
    await user.click(within(sheet).getByRole('button', { name: 'Add task' }));

    expect(await within(sheet).findByText('Draft the case study')).toBeInTheDocument();
    const [task] = await db.tasks.toArray();
    expect(task).toMatchObject({ objectiveId: objective.id, date: '2026-10-07' });
  });

  it('opens the linked objective from a task’s link tag on Camp', async () => {
    const objective = makeObjective({ title: 'Refresh portfolio' });
    await db.objectives.add(objective);
    await db.tasks.add(
      makeTask({ title: 'Draft the case study', date: '2026-10-07', objectiveId: objective.id }),
    );
    const { user } = await renderApp('#/camp');

    await user.click(
      await screen.findByRole('button', { name: 'Linked objective: Refresh portfolio' }),
    );
    expect(await screen.findByRole('heading', { level: 1, name: 'Ridge' })).toBeInTheDocument();
    const sheet = await screen.findByRole('dialog', { name: 'Objective' });
    expect(within(sheet).getByLabelText('Objective')).toHaveValue('Refresh portfolio');
  });

  it('shows the next objective on Camp', async () => {
    await db.objectives.bulkAdd([
      makeObjective({ title: 'Later one', dueDate: '2026-10-28' }),
      makeObjective({ title: 'Refresh portfolio', dueDate: '2026-10-10' }),
    ]);
    await renderApp('#/camp');
    const next = await screen.findByRole('region', { name: 'Next on the ridge' });
    expect(within(next).getByText('Refresh portfolio')).toBeInTheDocument();
    expect(within(next).getByText('3 days left')).toBeInTheDocument();
  });
});

describe('Ridge and Summit linking', () => {
  it('moves a summit’s auto progress when a linked objective is completed', async () => {
    const goal = makeGoal({ title: 'Lead a design team', milestones: [makeMilestone()] });
    await db.goals.add(goal);
    await db.objectives.add(makeObjective({ title: 'Refresh portfolio', goalId: goal.id }));

    const { user, unmount } = await renderApp('#/summit');
    expect(await screen.findByText('0%')).toBeInTheDocument();
    unmount();

    const again = await renderApp('#/ridge');
    await again.user.click(
      await screen.findByRole('checkbox', { name: 'Mark “Refresh portfolio” as done' }),
    );
    await waitFor(async () => expect((await db.objectives.toArray())[0].status).toBe('done'));

    await again.user.click(screen.getByRole('link', { name: 'Summit' }));
    expect(await screen.findByText('50%')).toBeInTheDocument();
    void user;
  });

  it('opens the linked summit from an objective’s link tag', async () => {
    const goal = makeGoal({ title: 'Lead a design team' });
    await db.goals.add(goal);
    await db.objectives.add(makeObjective({ title: 'Refresh portfolio', goalId: goal.id }));
    const { user } = await renderApp('#/ridge');

    await user.click(
      await screen.findByRole('button', { name: 'Linked summit: Lead a design team' }),
    );
    expect(await screen.findByRole('heading', { level: 1, name: 'Summit' })).toBeInTheDocument();
    expect(await screen.findByRole('dialog', { name: 'Lead a design team' })).toBeInTheDocument();
  });
});
