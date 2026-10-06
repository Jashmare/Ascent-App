import { navigate, parseHash } from '../../app/router';

export type NotificationState = 'unsupported' | 'default' | 'granted' | 'denied';

export function notificationState(): NotificationState {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
}

/** Must be called from a tap or click: browsers only ask in response to one. */
export async function requestNotifications(): Promise<NotificationState> {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.requestPermission();
}

/**
 * Shows a system notification while Ascent is open or in the background. Uses the service
 * worker when there is one (Android needs that), otherwise a page notification. Returns
 * false when notifications aren't allowed, so the caller can show it in the app instead.
 */
export async function showNotification(
  title: string,
  body: string,
  tag: string,
  hash: string,
): Promise<boolean> {
  if (notificationState() !== 'granted') return false;
  const options: NotificationOptions = {
    body,
    tag,
    icon: '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    data: { url: `/${hash}` },
  };
  try {
    const registration =
      'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (registration) {
      await registration.showNotification(title, options);
      return true;
    }
    const notification = new Notification(title, options);
    notification.onclick = () => {
      window.focus();
      navigate(parseHash(hash));
      notification.close();
    };
    return true;
  } catch {
    return false;
  }
}
