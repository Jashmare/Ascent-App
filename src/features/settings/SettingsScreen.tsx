import { AltitudeHeader } from '../../components/AltitudeHeader';
import { Page } from '../../components/Page';

export function SettingsScreen() {
  return (
    <Page>
      <AltitudeHeader title="Settings" showAltimeter={false} />
    </Page>
  );
}
