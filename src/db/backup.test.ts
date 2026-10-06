// @vitest-environment node
// Node's Blob can be stored in (fake) IndexedDB, like a browser's — so photos are tested for real.
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import {
  at,
  done,
  makeDream,
  makeGoal,
  makeMilestone,
  makeObjective,
  makeTask,
} from '../test/factories';
import { createBackup, readBackup, resetEverything, restoreBackup } from './backup';
import { db } from './db';

afterEach(() => resetEverything());

const photoBytes = new Uint8Array(5000).map((_, i) => (i * 7) % 256);

async function seed() {
  const task = makeTask({ title: 'Morning walk', repeat: { kind: 'daily' } });
  const objective = makeObjective({ title: 'Refresh portfolio', dueDate: '2026-10-10' });
  const goal = makeGoal({
    title: 'Run a half marathon',
    milestones: [makeMilestone({ title: 'Run 5 km', doneAt: at('2026-10-01') })],
  });
  const dream = makeDream({
    title: 'A studio by the sea',
    why: 'Room to make things',
    photo: new Blob([photoBytes], { type: 'image/jpeg' }),
  });
  const reached = makeDream({
    title: 'See the northern lights',
    status: 'reached',
    reachedAt: at('2026-03-12'),
  });
  await db.tasks.add(task);
  await db.completions.add(done(task.id, '2026-10-06'));
  await db.objectives.add(objective);
  await db.goals.add(goal);
  await db.dreams.bulkAdd([dream, reached]);
  await db.settings.bulkPut([
    { key: 'name', value: 'Sam' },
    { key: 'units', value: 'ft' },
    { key: 'reminderLog', value: { morning: '2026-10-06' } },
  ]);
}

async function snapshot() {
  const dreams = await db.dreams.toArray();
  return {
    tasks: await db.tasks.toArray(),
    completions: await db.completions.toArray(),
    objectives: await db.objectives.toArray(),
    goals: await db.goals.toArray(),
    dreams: await Promise.all(
      dreams.map(async ({ photo, ...rest }) => ({
        ...rest,
        photo: photo
          ? { type: photo.type, bytes: [...new Uint8Array(await photo.arrayBuffer())] }
          : undefined,
      })),
    ),
  };
}

describe('backup and restore', () => {
  it('reproduces everything in a fresh install, photos included', async () => {
    await seed();
    const before = await snapshot();

    const file = JSON.stringify(await createBackup(new Date('2026-10-07T10:00:00Z')));
    await resetEverything();
    expect(await db.dreams.count()).toBe(0);

    const read = readBackup(file);
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.summary).toMatchObject({
      tasks: 1,
      objectives: 1,
      summits: 1,
      dreams: 2,
      photos: 1,
      reached: 1,
    });

    await restoreBackup(read.backup, 'replace');
    const after = await snapshot();
    expect(after).toEqual(before);
    expect(after.dreams.find((d) => d.photo)?.photo?.bytes).toEqual([...photoBytes]);

    // Settings travel too, but device bookkeeping doesn't, and the welcome is skipped.
    expect((await db.settings.get('units'))?.value).toBe('ft');
    expect(await db.settings.get('reminderLog')).toBeUndefined();
    expect((await db.settings.get('onboarded'))?.value).toBe(true);
  });

  it('merges into existing data and keeps this device’s settings', async () => {
    await seed();
    const backup = await createBackup();
    await resetEverything();
    await db.tasks.add(makeTask({ title: 'Only on this device' }));
    await db.settings.put({ key: 'units', value: 'm' });

    await restoreBackup(backup, 'merge');
    expect((await db.tasks.toArray()).map((t) => t.title).sort()).toEqual([
      'Morning walk',
      'Only on this device',
    ]);
    expect((await db.settings.get('units'))?.value).toBe('m');
  });

  it('explains what’s wrong with a file that isn’t a backup', () => {
    expect(readBackup('not json')).toEqual({
      ok: false,
      error: 'This file isn’t an Ascent backup. Choose the .json file made with “Back up data”.',
    });
    expect(readBackup(JSON.stringify({ app: 'other' })).ok).toBe(false);
    const newer = {
      app: 'ascent',
      format: 99,
      data: { tasks: [], completions: [], objectives: [], goals: [], dreams: [], settings: [] },
    };
    expect(readBackup(JSON.stringify(newer))).toMatchObject({
      ok: false,
      error: expect.stringMatching(/newer version/),
    });
  });

  it('resets everything', async () => {
    await seed();
    await resetEverything();
    for (const table of db.tables) expect(await table.count()).toBe(0);
  });
});
