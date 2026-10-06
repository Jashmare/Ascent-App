import { useMemo, useSyncExternalStore } from 'react';

/**
 * A tiny hash router. Hash URLs need no server rewrites, which keeps the installed app
 * working offline from any path.
 *
 *   #/camp                       a screen
 *   #/ridge?open=objective:abc   a screen with a sheet open on top of it
 *
 * Sheets live in the URL so the back button (and Android's back gesture) closes them, and
 * so a link tag on one altitude can open an item on another.
 */

export const ALTITUDES = ['camp', 'ridge', 'summit', 'sky'] as const;
export type Altitude = (typeof ALTITUDES)[number];

export const SCREENS = [...ALTITUDES, 'settings', 'review', 'guide'] as const;
export type Screen = (typeof SCREENS)[number];

export interface Route {
  screen: Screen;
  /** The open sheet, as 'kind:id' (or just 'kind' for "new" sheets). */
  open?: string;
}

interface HistoryState {
  ascent: true;
  /** True when this history entry was pushed to open a sheet, so closing can go back. */
  sheet: boolean;
}

export function isAltitude(screen: Screen): screen is Altitude {
  return (ALTITUDES as readonly string[]).includes(screen);
}

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '');
  const queryAt = raw.indexOf('?');
  const path = queryAt === -1 ? raw : raw.slice(0, queryAt);
  const query = queryAt === -1 ? '' : raw.slice(queryAt + 1);
  const screen = (SCREENS as readonly string[]).includes(path) ? (path as Screen) : 'camp';
  const open = new URLSearchParams(query).get('open') || undefined;
  return open ? { screen, open } : { screen };
}

export function routeToHash(route: Route): string {
  const query = route.open ? `?${new URLSearchParams({ open: route.open })}` : '';
  return `#/${route.screen}${query}`;
}

const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener('hashchange', onChange);
  window.addEventListener('popstate', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('hashchange', onChange);
    window.removeEventListener('popstate', onChange);
  };
}

function getHash(): string {
  return window.location.hash;
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getHash);
  return useMemo(() => parseHash(hash), [hash]);
}

export function currentRoute(): Route {
  return parseHash(window.location.hash);
}

export function navigate(route: Route, options: { replace?: boolean; sheet?: boolean } = {}): void {
  const url = routeToHash(route);
  const state: HistoryState = { ascent: true, sheet: Boolean(options.sheet) };
  if (options.replace) {
    window.history.replaceState(state, '', url);
  } else {
    if (url === window.location.hash) return;
    window.history.pushState(state, '', url);
  }
  emit();
}

export function go(screen: Screen): void {
  navigate({ screen });
}

/** Opens a sheet, switching altitude first if needed so closing it lands on that altitude. */
export function openSheet(screen: Screen, open: string): void {
  if (currentRoute().screen !== screen) navigate({ screen });
  navigate({ screen, open }, { sheet: true });
}

export function closeSheet(): void {
  const route = currentRoute();
  if (!route.open) return;
  const state = window.history.state as Partial<HistoryState> | null;
  if (state?.sheet) window.history.back();
  else navigate({ screen: route.screen }, { replace: true });
}

/** Splits 'objective:abc' into its kind and id. */
export function parseOpen(open: string | undefined): { kind: string; id?: string } | null {
  if (!open) return null;
  const at = open.indexOf(':');
  return at === -1 ? { kind: open } : { kind: open.slice(0, at), id: open.slice(at + 1) };
}
