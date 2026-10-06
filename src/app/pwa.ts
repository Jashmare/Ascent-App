import { useSyncExternalStore } from 'react';
import { notify } from './toast';

/**
 * Installable and offline (docs/PRODUCT.md §9, Phase 4). The service worker precaches the
 * whole app, so after the first visit Ascent opens with no connection at all.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let installEvent: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function setUpPwa(): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Keep the browser's prompt for the Install button in Settings.
    event.preventDefault();
    installEvent = event as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    installEvent = null;
    emit();
    notify('Installed. Ascent is on your home screen.');
  });

  // The dev server has no service worker; only production builds register one.
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    void import('virtual:pwa-register').then(({ registerSW }) =>
      registerSW({
        immediate: true,
        onOfflineReady: () => notify('Ready to work offline.'),
      }),
    );
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useInstallPrompt(): { available: boolean; install: () => Promise<void> } {
  const event = useSyncExternalStore(subscribe, () => installEvent);
  return {
    available: event !== null,
    install: async () => {
      if (!installEvent) return;
      await installEvent.prompt();
      await installEvent.userChoice;
      installEvent = null;
      emit();
    },
  };
}

/** True when running as an installed app rather than in a browser tab. */
export function isInstalled(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
