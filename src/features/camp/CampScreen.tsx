import type { Route } from '../../app/router';
import { useToday } from '../../app/useToday';
import { AltitudeHeader } from '../../components/AltitudeHeader';
import { EmptyState, Page } from '../../components/Page';
import { formatLongDate } from '../../lib/dates';

export function CampScreen(_props: { route: Route }) {
  const today = useToday();
  return (
    <Page>
      <AltitudeHeader title="Camp">
        <p>{formatLongDate(today)}</p>
      </AltitudeHeader>
      <EmptyState>Nothing planned for today yet. Add the first thing you&rsquo;ll do.</EmptyState>
    </Page>
  );
}
