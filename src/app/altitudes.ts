import { Flag, MoonStar, MountainSnow, Tent, type LucideIcon } from 'lucide-react';
import type { Altitude, Screen } from './router';

export const ALTITUDE_META: Record<Altitude, { label: string; icon: LucideIcon; level: number }> = {
  camp: { label: 'Camp', icon: Tent, level: 0 },
  ridge: { label: 'Ridge', icon: Flag, level: 1 },
  summit: { label: 'Summit', icon: MountainSnow, level: 2 },
  sky: { label: 'Sky', icon: MoonStar, level: 3 },
};

/** Which altitude's colours each screen uses, and its title for the document. */
export const SCREEN_META: Record<Screen, { altitude: Altitude; title: string }> = {
  camp: { altitude: 'camp', title: 'Camp' },
  ridge: { altitude: 'ridge', title: 'Ridge' },
  summit: { altitude: 'summit', title: 'Summit' },
  sky: { altitude: 'sky', title: 'Sky' },
  settings: { altitude: 'camp', title: 'Settings' },
  review: { altitude: 'ridge', title: 'Weekly review' },
  guide: { altitude: 'camp', title: 'How Ascent works' },
};

/**
 * Direction of travel between two screens: 1 going up, -1 going down, 0 for screens that
 * sit outside the climb (settings, review, guide), which simply fade.
 */
export function travelDirection(from: Screen, to: Screen): number {
  const a = from in ALTITUDE_META ? ALTITUDE_META[from as Altitude].level : null;
  const b = to in ALTITUDE_META ? ALTITUDE_META[to as Altitude].level : null;
  if (a == null || b == null) return 0;
  return Math.sign(b - a);
}
