import type { Route } from '../../app/router';
import { AltitudeHeader } from '../../components/AltitudeHeader';
import { EmptyState, Page } from '../../components/Page';

export function SkyScreen(_props: { route: Route }) {
  return (
    <Page>
      <AltitudeHeader title="The sky is the limit" variant="sky" showAltimeter={false} />
      <EmptyState>Your sky is open. Add a dream — no deadline needed.</EmptyState>
    </Page>
  );
}
