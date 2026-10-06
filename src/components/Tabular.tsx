import { cx } from './cx';

/**
 * Text with tabular numerals, so counts and altitudes don't shift as digits change.
 * Schibsted Grotesk's tabular feature also widens the comma to a full figure, which reads
 * as "4 ,320", so separators are set back to proportional width.
 */
export function Tabular({ children, className }: { children: string; className?: string }) {
  const parts = children.split(/(,)/);
  return (
    <span className={cx('tabular', className)}>
      {parts.map((part, i) =>
        part === ',' ? (
          <span key={i} className="tabular-sep">
            ,
          </span>
        ) : (
          part
        ),
      )}
    </span>
  );
}
