import { AltitudeHeader } from '../../components/AltitudeHeader';
import { Page } from '../../components/Page';

export function GuideScreen() {
  return (
    <Page>
      <AltitudeHeader title="How Ascent works" showAltimeter={false} />
    </Page>
  );
}
