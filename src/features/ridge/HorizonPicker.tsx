import { ChoiceChips } from '../../components/Chips';
import type { Horizon } from '../../db/types';
import { HORIZON_LABELS } from '../../lib/objectives';

const OPTIONS = (Object.keys(HORIZON_LABELS) as Horizon[]).map((value) => ({
  value,
  label: HORIZON_LABELS[value],
}));

export function HorizonPicker({
  value,
  onChange,
}: {
  value: Horizon;
  onChange: (horizon: Horizon) => void;
}) {
  return <ChoiceChips legend="Horizon" value={value} options={OPTIONS} onChange={onChange} />;
}
