import type { Route } from '../../app/router';
import { AltitudeHeader } from '../../components/AltitudeHeader';
import { EmptyState, Page } from '../../components/Page';

export function RidgeScreen(_props: { route: Route }) {
  return (
    <Page>
      <AltitudeHeader title="Ridge" />
      <EmptyState>No objectives yet. What do you want done by the end of this month?</EmptyState>
    </Page>
  );
}
