/** "1 task", "3 tasks" */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** A warm greeting for the time of day. */
export function greeting(hour: number, name?: string): string {
  const part =
    hour >= 5 && hour < 12 ? 'morning' : hour >= 12 && hour < 18 ? 'afternoon' : 'evening';
  const trimmed = name?.trim();
  return trimmed ? `Good ${part}, ${trimmed}` : `Good ${part}`;
}

/** Clamp to 0–100 and round. */
export function percent(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)));
}
