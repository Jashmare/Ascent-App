import type { Screen } from '../../app/router';

export interface TourStep {
  screen: Screen;
  /** The element to spotlight, by its data-tour name. Without one, the card is centred. */
  target?: string;
  title: string;
  body: string;
}

/** The guided tour: a short walk up the climb, from today to the sky. */
export const TOUR_STEPS: TourStep[] = [
  {
    screen: 'camp',
    title: 'Welcome to the climb',
    body: 'Ascent organises everything by altitude: today’s tasks at Camp, up through your objectives and long-term goals, to the dreams in your Sky. This tour takes about a minute.',
  },
  {
    screen: 'camp',
    target: 'glimpse',
    title: 'A glimpse of your sky',
    body: 'Each day, one dream you’re reaching for shows here, so today always connects to something bigger. Tap it to visit that dream.',
  },
  {
    screen: 'camp',
    target: 'quick-add',
    title: 'Add today’s tasks',
    body: 'Type a task and press Enter. The sliders button lets you link it to an objective or make it a routine: daily, weekdays or chosen days.',
  },
  {
    screen: 'camp',
    target: 'altimeter',
    title: 'Your altimeter',
    body: 'Every task you check off adds 10 m. Milestones add 250 m, objectives 100 m, and reaching a summit 1,000 m. Uncheck something and its metres come off.',
  },
  {
    screen: 'camp',
    target: 'climb',
    title: 'Today’s climb',
    body: 'The trail rises as you check things off. Finish everything planned for a day and your streak grows. Days with nothing planned don’t count either way.',
  },
  {
    screen: 'camp',
    target: 'nav',
    title: 'Climb higher',
    body: 'Camp is today. Above it are the Ridge for objectives, the Summit for long-term goals, and the Sky for your dreams.',
  },
  {
    screen: 'ridge',
    target: 'ridge-add',
    title: 'The ridge',
    body: 'Objectives for the next few weeks or months. Give them a horizon or a due date, link them to a summit, and check them off for 100 m.',
  },
  {
    screen: 'summit',
    target: 'summit-add',
    title: 'The summit',
    body: 'The big climbs, a year or more away. Add milestones and watch the peak fill like a snowline. At 100%, reach the summit and it becomes a gold star.',
  },
  {
    screen: 'sky',
    target: 'sky-field',
    title: 'Your sky',
    body: 'Dreams live here, with no deadlines. Pale stars are still reaching. Gold stars are reached, joined in order into your constellation. The peaks below are your summits.',
  },
  {
    screen: 'sky',
    target: 'add-dream',
    title: 'Add a dream',
    body: 'Always one tap away. Only the title is needed; why it matters, a picture of it, and a photo are up to you.',
  },
  {
    screen: 'camp',
    target: 'settings',
    title: 'Settings and reminders',
    body: 'Reminders, backups, and this tour live in Settings. The question mark beside it opens the full guide any time.',
  },
  {
    screen: 'camp',
    title: 'That’s the climb',
    body: 'Start small at Camp. Everything you do today is part of the climb. The sky is the limit.',
  },
];
