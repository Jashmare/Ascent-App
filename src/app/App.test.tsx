import { screen, within } from '@testing-library/react';
import { renderApp as renderAt } from '../test/renderApp';

async function renderApp() {
  const { user } = await renderAt('#/camp');
  await screen.findByRole('heading', { level: 1, name: 'Camp' });
  return user;
}

describe('altitude navigation', () => {
  it('reaches all four altitudes by tap, each with its own colours', async () => {
    const user = await renderApp();
    const nav = screen.getByRole('navigation', { name: 'Altitudes' });

    expect(within(nav).getByRole('link', { name: 'Camp' })).toHaveAttribute('aria-current', 'page');

    for (const [label, altitude, title] of [
      ['Ridge', 'ridge', 'Ridge'],
      ['Summit', 'summit', 'Summit'],
      ['Sky', 'sky', 'The sky is the limit'],
      ['Camp', 'camp', 'Camp'],
    ]) {
      await user.click(within(nav).getByRole('link', { name: label }));
      expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument();
      expect(document.documentElement.dataset.altitude).toBe(altitude);
      expect(within(nav).getByRole('link', { name: label })).toHaveAttribute(
        'aria-current',
        'page',
      );
    }
  });

  it('reaches altitudes with the keyboard', async () => {
    const user = await renderApp();
    const summit = screen.getByRole('link', { name: 'Summit' });
    // Tab until the Summit stop has focus, then press Enter.
    for (let i = 0; i < 20 && document.activeElement !== summit; i++) await user.tab();
    expect(summit).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('heading', { level: 1, name: 'Summit' })).toBeInTheDocument();
    // Focus moves to the new screen's title.
    expect(screen.getByRole('heading', { level: 1, name: 'Summit' })).toHaveFocus();
  });
});
