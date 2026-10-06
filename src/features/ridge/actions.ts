import { notify } from '../../app/toast';
import type { Units } from '../../db/settings';
import { setObjectiveDone } from '../../db/objectives';
import { ALTITUDE_GAIN, formatGain } from '../../lib/altimeter';

/** Completes or reopens an objective. Completing confirms with the altitude gained. */
export async function markObjective(id: string, done: boolean, units: Units): Promise<void> {
  await setObjectiveDone(id, done);
  if (done) {
    notify(`Done. ${formatGain(ALTITUDE_GAIN.objective, units)}`, {
      label: 'Undo',
      run: () => void setObjectiveDone(id, false),
    });
  }
}
