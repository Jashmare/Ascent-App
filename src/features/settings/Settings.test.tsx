import { screen, waitFor, within } from '@testing-library/react';
import { createBackup } from '../../db/backup';
import { db } from '../../db/db';
import { getSettings } from '../../db/settings';
import { makeDream, makeTask } from '../../test/factories';
import { renderApp, setToday } from '../../test/renderApp';

beforeEach(() => {
  setToday(2026, 10, 7);
  // jsdom has no object URLs; downloads are captured instead of saved.
  URL.createObjectURL = vi.fn(() => 'blob:ascent-test');
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => vi.useRealTimers());

describe('Settings', () => {
  it('saves preferences and applies the theme', async () => {
    const { user } = await renderApp('#/settings');

    await user.click(await screen.findByRole('radio', { name: 'Dark' }));
    await waitFor(() => expect(document.documentElement.dataset.theme).toBe('dark'));
    await user.click(screen.getByRole('radio', { name: 'Feet' }));
    await user.click(screen.getByRole('radio', { name: 'Sunday' }));
    await user.type(screen.getByLabelText('Your name'), 'Sam');

    await waitFor(async () => {
      const settings = await getSettings();
      expect(settings).toMatchObject({ theme: 'dark', units: 'ft', weekStartsOn: 0, name: 'Sam' });
    });

    // The greeting on Camp uses the name.
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByText(/^Good (morning|afternoon|evening), Sam$/)).toBeInTheDocument();
  });

  it('switches reminders on and off and sets their times', async () => {
    const { user } = await renderApp('#/settings');

    const evening = await screen.findByRole('switch', { name: /Evening check-in/ });
    expect(evening).not.toBeChecked();
    await user.click(evening);
    const time = await screen.findByLabelText('Evening check-in time');
    expect(time).toHaveValue('20:00');

    await user.click(screen.getByRole('switch', { name: /Morning/ }));
    await waitFor(async () => {
      const { reminders } = await getSettings();
      expect(reminders.evening.on).toBe(true);
      expect(reminders.morning.on).toBe(false);
    });
    expect(screen.queryByLabelText('Morning time')).not.toBeInTheDocument();
    // Weekly reminders choose a day as well.
    expect(screen.getByLabelText('Weekly review day')).toHaveValue('0');
  });

  it('says plainly when the browser can’t show notifications', async () => {
    await renderApp('#/settings');
    expect(await screen.findByText(/This browser can’t show notifications/)).toBeInTheDocument();
  });

  it('exports reminders as a calendar file', async () => {
    await db.tasks.add(makeTask({ title: 'Morning walk', repeat: { kind: 'daily' } }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const { user } = await renderApp('#/settings');

    await user.click(await screen.findByRole('button', { name: 'Add to calendar' }));
    await waitFor(() => expect(click).toHaveBeenCalled());
    const link = click.mock.contexts[0] as HTMLAnchorElement;
    expect(link.download).toBe('ascent-reminders.ics');
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    const ics = await blob.text();
    expect(ics).toContain('SUMMARY:Morning walk');
    expect(ics).toContain('RRULE:FREQ=DAILY');
  });

  it('backs up everything to a file', async () => {
    await db.dreams.add(makeDream({ title: 'A studio by the sea' }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const { user } = await renderApp('#/settings');

    await user.click(await screen.findByRole('button', { name: 'Back up data' }));
    expect(await screen.findByText('Backed up')).toBeInTheDocument();
    const link = click.mock.contexts[0] as HTMLAnchorElement;
    expect(link.download).toBe('ascent-backup-2026-10-07.json');
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    const backup = JSON.parse(await blob.text());
    expect(backup.app).toBe('ascent');
    expect(backup.data.dreams[0].title).toBe('A studio by the sea');
  });

  it('restores a backup after showing what’s in it', async () => {
    await db.dreams.add(makeDream({ title: 'A studio by the sea' }));
    await db.tasks.add(makeTask({ title: 'Morning walk', repeat: { kind: 'daily' } }));
    const file = new File([JSON.stringify(await createBackup())], 'ascent-backup.json', {
      type: 'application/json',
    });
    await Promise.all(db.tables.map((table) => table.clear()));
    const { user } = await renderApp('#/settings');

    await user.upload(await screen.findByLabelText('Restore a backup'), file);
    const sheet = await screen.findByRole('dialog', { name: 'Restore a backup' });
    expect(within(sheet).getByText('1 task')).toBeInTheDocument();
    expect(within(sheet).getByText('1 dream')).toBeInTheDocument();
    await user.click(within(sheet).getByRole('radio', { name: 'Merge' }));
    await user.click(within(sheet).getByRole('button', { name: 'Restore' }));

    expect(await screen.findByText('Restored')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: 'Camp' })).toBeInTheDocument();
    expect(await db.dreams.count()).toBe(1);
    expect(await screen.findByRole('checkbox', { name: 'Morning walk' })).toBeInTheDocument();
  });

  it('explains when a file isn’t a backup', async () => {
    const { user } = await renderApp('#/settings');
    const file = new File(['not a backup'], 'notes.json', { type: 'application/json' });
    await user.upload(await screen.findByLabelText('Restore a backup'), file);
    expect(await screen.findByRole('alert')).toHaveTextContent('This file isn’t an Ascent backup.');
  });

  it('resets everything only after typing “reset”', async () => {
    await db.dreams.add(makeDream({ title: 'A studio by the sea' }));
    const { user } = await renderApp('#/settings');

    await user.click(await screen.findByRole('button', { name: 'Reset everything' }));
    const sheet = await screen.findByRole('dialog', { name: 'Reset everything' });
    const confirm = within(sheet).getByRole('button', { name: 'Delete everything' });
    expect(confirm).toBeDisabled();
    await user.type(within(sheet).getByLabelText('Type “reset” to confirm'), 'reset');
    expect(confirm).toBeEnabled();
    await user.click(confirm);

    // Everything is gone, so the first-run welcome returns.
    expect(await screen.findByRole('heading', { name: 'Start with the sky.' })).toBeInTheDocument();
    expect(await db.dreams.count()).toBe(0);
  });
});
