import { at, makeDream, makeGoal } from '../test/factories';
import { fitWithin } from './image';
import { constellationOrder, skyStars } from './sky';

describe('skyStars', () => {
  it('turns dreams and reached summits into stars with spoken labels', () => {
    const stars = skyStars(
      [
        makeDream({ title: 'A studio by the sea', createdAt: at('2026-01-01') }),
        makeDream({
          title: 'See the northern lights',
          status: 'reached',
          reachedAt: at('2026-03-12'),
          createdAt: at('2026-01-02'),
        }),
      ],
      [
        makeGoal({ title: 'Run a half marathon', status: 'reached', reachedAt: at('2026-03-12') }),
        makeGoal({ title: 'Still climbing', status: 'active' }),
      ],
    );
    expect(stars.map((s) => s.ariaLabel)).toEqual([
      'Dream: A studio by the sea, still reaching',
      'Reached summit: Run a half marathon, reached 12 March 2026',
      'Reached dream: See the northern lights, reached 12 March 2026',
    ]);
  });

  it('joins reached stars in the order they were reached', () => {
    const stars = skyStars(
      [makeDream({ id: 'late', status: 'reached', reachedAt: at('2026-05-01') })],
      [makeGoal({ id: 'early', status: 'reached', reachedAt: at('2026-02-01') })],
    );
    expect(constellationOrder(stars).map((s) => s.id)).toEqual(['early', 'late']);
  });
});

describe('fitWithin', () => {
  it('scales the long side down to 1600px and never up', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(1000, 3200)).toEqual({ width: 500, height: 1600 });
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });
});
