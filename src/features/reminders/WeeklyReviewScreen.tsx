import { AltitudeHeader } from '../../components/AltitudeHeader';
import { Page } from '../../components/Page';

export function WeeklyReviewScreen() {
  return (
    <Page>
      <AltitudeHeader title="Weekly review" showAltimeter={false} />
    </Page>
  );
}
