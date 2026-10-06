import { CornerRightUp } from 'lucide-react';
import styles from './LinkTag.module.css';

interface LinkTagProps {
  /** What kind of item it points to, for assistive tech: "objective", "summit", "dream". */
  kind: string;
  title: string;
  onOpen: () => void;
}

/** A small pill under a title — "⤴ Refresh portfolio". Tapping it opens the linked item. */
export function LinkTag({ kind, title, onOpen }: LinkTagProps) {
  return (
    <button type="button" className={styles.tag} onClick={onOpen}>
      <CornerRightUp className={styles.icon} aria-hidden="true" />
      <span className="visually-hidden">Linked {kind}: </span>
      <span className={styles.text}>{title}</span>
    </button>
  );
}
