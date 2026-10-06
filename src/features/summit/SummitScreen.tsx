import type { Route } from '../../app/router';
import { AltitudeHeader } from '../../components/AltitudeHeader';
import { EmptyState, Page } from '../../components/Page';

export function SummitScreen(_props: { route: Route }) {
  return (
    <Page>
      <AltitudeHeader title="Summit" />
      <EmptyState>No summits yet. Pick something worth a year or more of climbing.</EmptyState>
    </Page>
  );
}
