import { nowMs } from '../app/clock';
import { db } from '../db/db';
import { DEFAULT_SETTINGS } from '../db/settings';
import type { Dream, Goal, Objective, Task, TaskCompletion } from '../db/types';
import { addDays, toISODate, weekday } from '../lib/dates';

/**
 * Development only: replaces everything in the local database with a generic sample climb,
 * for previews and screenshots. Run `ascentSampleData()` in the dev server's console.
 * Sample content is generic by design — no real names, employers or personal details.
 */
export async function loadSampleData({ tourDone = true } = {}): Promise<void> {
  const today = toISODate(new Date(nowMs()));
  const at = (offset: number, hour = 9) => {
    const [y, m, d] = addDays(today, offset).split('-').map(Number);
    return new Date(y, m - 1, d, hour).getTime();
  };
  const date = (offset: number) => addDays(today, offset);
  const nextYear = Number(today.slice(0, 4)) + 1;

  const dreams: Dream[] = [
    {
      id: 'dream-studio',
      title: 'A studio by the sea',
      why: 'A quiet place to make things, with the window open.',
      vision: 'Morning light on the workbench, salt in the air, and a whole day of work I chose.',
      status: 'dreaming',
      createdAt: at(-120),
    },
    {
      id: 'dream-cello',
      title: 'Learn to play the cello',
      why: 'Music I can make with my own hands.',
      status: 'dreaming',
      createdAt: at(-90),
    },
    {
      id: 'dream-coast',
      title: 'Walk the length of a coastline',
      status: 'dreaming',
      createdAt: at(-60),
    },
    {
      id: 'dream-garden',
      title: 'A garden full of things I grew',
      vision: 'Tomatoes warm from the sun, and enough to give away.',
      status: 'dreaming',
      createdAt: at(-30),
    },
    {
      id: 'dream-lights',
      title: 'See the northern lights',
      status: 'reached',
      reachedAt: at(-70, 21),
      reflection: 'Colder than I imagined, and better.',
      createdAt: at(-150),
    },
  ];

  const goals: Goal[] = [
    {
      id: 'goal-team',
      title: 'Lead a small design team',
      why: 'I want to help others do their best work.',
      targetMonth: `${nextYear}-06`,
      dreamId: 'dream-studio',
      milestones: [
        { id: 'm-mentor', title: 'Mentor a junior designer', doneAt: at(-40) },
        { id: 'm-critique', title: 'Run the weekly critique', doneAt: at(-12) },
        { id: 'm-plan', title: 'Present the team plan' },
        { id: 'm-hire', title: 'Hire the first designer' },
      ],
      progressMode: 'auto',
      manualProgress: 0,
      status: 'active',
      createdAt: at(-100),
    },
    {
      id: 'goal-race',
      title: 'Run a half marathon',
      why: 'To feel strong and steady.',
      targetMonth: `${nextYear}-04`,
      dreamId: 'dream-coast',
      milestones: [
        { id: 'm-5k', title: 'Run 5 km', doneAt: at(-50) },
        { id: 'm-10k', title: 'Run 10 km without stopping' },
        { id: 'm-15k', title: 'Run 15 km' },
      ],
      progressMode: 'auto',
      manualProgress: 0,
      status: 'active',
      createdAt: at(-80),
    },
    {
      id: 'goal-save',
      title: 'Save for the studio',
      dreamId: 'dream-studio',
      milestones: [],
      progressMode: 'manual',
      manualProgress: 35,
      status: 'active',
      createdAt: at(-70),
    },
    {
      id: 'goal-course',
      title: 'Finish the evening course',
      milestones: [
        { id: 'm-exam', title: 'Pass the first exam', doneAt: at(-60) },
        { id: 'm-project', title: 'Hand in the final project', doneAt: at(-22) },
      ],
      progressMode: 'auto',
      manualProgress: 0,
      status: 'reached',
      reachedAt: at(-21, 19),
      reflection: 'Tired, proud, ready for the next one.',
      createdAt: at(-200),
    },
  ];

  const objectives: Objective[] = [
    {
      id: 'o-portfolio',
      title: 'Refresh portfolio',
      horizon: 'week',
      dueDate: date(3),
      goalId: 'goal-team',
      status: 'open',
      createdAt: at(-10),
    },
    {
      id: 'o-invoice',
      title: 'Send the invoice',
      horizon: 'week',
      dueDate: date(-2),
      status: 'open',
      createdAt: at(-9),
    },
    {
      id: 'o-module',
      title: 'Finish the course module',
      horizon: 'month',
      dueDate: date(16),
      status: 'open',
      createdAt: at(-8),
    },
    {
      id: 'o-race',
      title: 'Book the race',
      horizon: 'quarter',
      goalId: 'goal-race',
      status: 'open',
      createdAt: at(-7),
    },
    {
      id: 'o-trip',
      title: 'Plan a weekend by the coast',
      horizon: 'someday',
      status: 'open',
      createdAt: at(-6),
    },
    {
      id: 'o-savings',
      title: 'Set up the savings account',
      horizon: 'month',
      goalId: 'goal-save',
      status: 'done',
      doneAt: at(-5, 17),
      createdAt: at(-20),
    },
  ];

  const tasks: Task[] = [
    {
      id: 't-walk',
      title: 'Morning walk',
      date: null,
      repeat: { kind: 'daily' },
      order: 1,
      archived: false,
      createdAt: at(-30),
    },
    {
      id: 't-reply',
      title: 'Reply to the client email',
      date: today,
      repeat: { kind: 'none' },
      order: 2,
      archived: false,
      createdAt: at(0, 8),
    },
    {
      id: 't-draft',
      title: 'Draft the case study',
      date: today,
      repeat: { kind: 'none' },
      objectiveId: 'o-portfolio',
      order: 3,
      archived: false,
      createdAt: at(0, 8),
    },
    {
      id: 't-stretch',
      title: 'Stretch for ten minutes',
      date: null,
      repeat: { kind: 'weekdays' },
      order: 4,
      archived: false,
      createdAt: at(-30),
    },
    {
      id: 't-read',
      title: 'Read two chapters',
      date: today,
      repeat: { kind: 'none' },
      order: 5,
      archived: false,
      createdAt: at(0, 8),
    },
    {
      id: 't-collect',
      title: 'Collect the best projects',
      date: date(-1),
      repeat: { kind: 'none' },
      objectiveId: 'o-portfolio',
      order: 6,
      archived: false,
      createdAt: at(-1, 8),
    },
  ];

  const completions: TaskCompletion[] = [];
  const complete = (taskId: string, offset: number) =>
    completions.push({
      id: `c-${taskId}-${offset}`,
      taskId,
      date: date(offset),
      at: at(offset, 18),
    });
  for (let offset = -6; offset <= -1; offset++) {
    complete('t-walk', offset);
    const day = weekday(date(offset));
    if (day >= 1 && day <= 5) complete('t-stretch', offset);
  }
  complete('t-collect', -1);
  complete('t-walk', 0);
  complete('t-reply', 0);

  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
    await db.dreams.bulkAdd(dreams);
    await db.goals.bulkAdd(goals);
    await db.objectives.bulkAdd(objectives);
    await db.tasks.bulkAdd(tasks);
    await db.completions.bulkAdd(completions);
    await db.settings.bulkPut([
      { key: 'onboarded', value: true },
      { key: 'tourDone', value: tourDone },
      { key: 'reminders', value: DEFAULT_SETTINGS.reminders },
    ]);
  });
}

declare global {
  interface Window {
    ascentSampleData?: typeof loadSampleData;
  }
}
