/** Scales a size down (never up) so its long side is at most `max`. */
export function fitWithin(
  width: number,
  height: number,
  max = 1600,
): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
