import { done, makeTask } from '../test/factories';
import { carryOverCopy, unfinishedEarlier } from './carryOver';

describe('carry-over', () => {
  it("finds yesterday's unfinished one-off tasks", () => {
    const unfinished = makeTask({ date: '2026-10-04' });
    const finished = makeTask({ date: '2026-10-04' });
    const today = makeTask({ date: '2026-10-05' });
    const routine = makeTask({ repeat: { kind: 'daily' } });
    const letGo = makeTask({ date: '2026-10-03', archived: true });
    const result = unfinishedEarlier(
      [unfinished, finished, today, routine, letGo],
      [done(finished.id, '2026-10-04')],
      '2026-10-05',
    );
    expect(result).toEqual([unfinished]);
  });

  it('writes the prompt for one task from yesterday', () => {
    expect(carryOverCopy([makeTask({ date: '2026-10-04' })], '2026-10-05')).toEqual({
      message: "1 task from yesterday isn't done. Bring it to today?",
      bring: 'Bring it to today',
      letGo: 'Let it go',
    });
  });

  it('writes the prompt for several tasks', () => {
    const fromYesterday = [makeTask({ date: '2026-10-04' }), makeTask({ date: '2026-10-04' })];
    expect(carryOverCopy(fromYesterday, '2026-10-05').message).toBe(
      "2 tasks from yesterday aren't done. Bring them to today?",
    );
    const older = [makeTask({ date: '2026-10-01' }), makeTask({ date: '2026-10-04' })];
    expect(carryOverCopy(older, '2026-10-05').message).toBe(
      "2 earlier tasks aren't done. Bring them to today?",
    );
  });
});
