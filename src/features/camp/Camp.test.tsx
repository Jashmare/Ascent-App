import { screen, waitFor, within } from '@testing-library/react';
import { db } from '../../db/db';
import { at, done, makeTask } from '../../test/factories';
import { renderApp, setToday } from '../../test/renderApp';

beforeEach(() => setToday(2026, 10, 6)); // Tuesday 6 October 2026
afterEach(() => vi.useRealTimers());

describe('Camp', () => {
  it('adds a task with one line and Enter', async () => {
    const { user } = await renderApp();
    expect(await screen.findByText(/Nothing planned for today yet/)).toBeInTheDocument();

    const input = screen.getByLabelText('Add a task for today');
    await user.type(input, 'Draft the case study{Enter}');

    expect(
      await screen.findByRole('checkbox', { name: 'Draft the case study' }),
    ).toBeInTheDocument();
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(screen.queryByText(/Nothing planned for today yet/)).not.toBeInTheDocument();
  });

  it('makes a routine from the quick add extras', async () => {
    const { user } = await renderApp();
    await user.click(await screen.findByRole('button', { name: 'Task options' }));
    await user.click(screen.getByRole('radio', { name: 'Weekdays' }));
    await user.type(screen.getByLabelText('Add a task for today'), 'Morning walk{Enter}');

    const row = (await screen.findByRole('checkbox', { name: 'Morning walk' })).closest('li')!;
    expect(within(row).getByText('Weekdays')).toBeInTheDocument();
    const [task] = await db.tasks.toArray();
    expect(task).toMatchObject({ repeat: { kind: 'weekdays' }, date: null });
  });

  it('checks a task off, adds 10 m, and unchecking takes it back', async () => {
    await db.tasks.add(makeTask({ title: 'Reply to the email', date: '2026-10-06' }));
    const { user } = await renderApp();

    const box = await screen.findByRole('checkbox', { name: 'Reply to the email' });
    await user.click(box);
    await waitFor(() => expect(box).toBeChecked());
    expect(screen.getByText('+10 m today')).toBeInTheDocument();
    expect(screen.getByText('Today’s climb is done.')).toBeInTheDocument();

    await user.click(box);
    await waitFor(() => expect(box).not.toBeChecked());
    expect(screen.getByText('+0 m today')).toBeInTheDocument();
    expect(screen.getByText('0 of 1 done')).toBeInTheDocument();
  });

  it("offers to bring yesterday's unfinished task to today", async () => {
    await db.tasks.add(makeTask({ title: 'Send the invoice', date: '2026-10-05' }));
    const { user } = await renderApp();

    expect(
      await screen.findByText("1 task from yesterday isn't done. Bring it to today?"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Bring it to today' }));

    expect(await screen.findByRole('checkbox', { name: 'Send the invoice' })).toBeInTheDocument();
    expect(screen.queryByText(/from yesterday/)).not.toBeInTheDocument();
    expect((await db.tasks.toArray())[0].date).toBe('2026-10-06');
  });

  it('lets unfinished tasks go by archiving them, not deleting them', async () => {
    await db.tasks.bulkAdd([
      makeTask({ title: 'Old task one', date: '2026-10-05' }),
      makeTask({ title: 'Old task two', date: '2026-10-05' }),
    ]);
    const { user } = await renderApp();

    await user.click(await screen.findByRole('button', { name: 'Let them go' }));
    await waitFor(() => expect(screen.queryByText(/from yesterday/)).not.toBeInTheDocument());
    const tasks = await db.tasks.toArray();
    expect(tasks).toHaveLength(2);
    expect(tasks.every((t) => t.archived)).toBe(true);
  });

  it('keeps the streak after a reload', async () => {
    const routine = makeTask({
      title: 'Stretch',
      repeat: { kind: 'daily' },
      createdAt: at('2026-10-02'),
    });
    await db.tasks.add(routine);
    await db.completions.bulkAdd(
      ['2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05'].map((d) => done(routine.id, d)),
    );

    const first = await renderApp();
    expect(await screen.findByText('4-day streak')).toBeInTheDocument();
    first.unmount();

    await renderApp();
    expect(await screen.findByText('4-day streak')).toBeInTheDocument();
  });

  it('says "Fresh start today." when a streak has ended', async () => {
    const routine = makeTask({ repeat: { kind: 'daily' }, createdAt: at('2026-10-03') });
    await db.tasks.add(routine);
    await db.completions.bulkAdd([done(routine.id, '2026-10-03'), done(routine.id, '2026-10-04')]);
    await renderApp();
    expect(await screen.findByText('Fresh start today.')).toBeInTheDocument();
    expect(screen.getByText('Longest 2 days')).toBeInTheDocument();
    expect(screen.queryByText(/broke/i)).not.toBeInTheDocument();
  });

  it('reorders with the keyboard', async () => {
    await db.tasks.bulkAdd([
      makeTask({ title: 'First', date: '2026-10-06', order: 1 }),
      makeTask({ title: 'Second', date: '2026-10-06', order: 2 }),
    ]);
    const { user } = await renderApp();

    const handle = await screen.findByRole('button', { name: 'Reorder “First”' });
    handle.focus();
    await user.keyboard('{ArrowDown}');

    await waitFor(() => {
      const titles = screen
        .getAllByRole('checkbox')
        .map((box) => box.closest('label')!.textContent);
      expect(titles).toEqual(['Second', 'First']);
    });
    expect(screen.getByRole('button', { name: 'Reorder “First”' })).toHaveFocus();
  });

  it('edits a task in its sheet', async () => {
    await db.tasks.add(makeTask({ title: 'Read', date: '2026-10-06' }));
    const { user } = await renderApp();

    await user.click(await screen.findByRole('button', { name: 'Edit “Read”' }));
    const sheet = await screen.findByRole('dialog', { name: 'Edit task' });
    const title = within(sheet).getByLabelText('Task');
    await user.clear(title);
    await user.type(title, 'Read two chapters');
    await user.click(within(sheet).getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('checkbox', { name: 'Read two chapters' })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
