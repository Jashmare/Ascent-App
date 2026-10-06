import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';
import styles from './Page.module.css';

/** The centred content column every screen sits in (max 640px, left-aligned content). */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx(styles.page, className)}>{children}</div>;
}

interface PanelProps extends HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div';
}

/** A grouped surface: 1px line border, no shadow. Lists inside get dividers, not cards. */
export function Panel({ as: Tag = 'div', className, ...rest }: PanelProps) {
  return <Tag className={cx(styles.panel, className)} {...rest} />;
}

/** Sentence-case group heading in the soft ink. Never all caps. */
export function SectionHeading({
  children,
  id,
  as: Tag = 'h2',
}: {
  children: ReactNode;
  id?: string;
  as?: 'h2' | 'h3';
}) {
  return (
    <Tag className={styles.sectionHeading} id={id}>
      {children}
    </Tag>
  );
}

/** One line of direction, with the add control placed right beneath by the caller. */
export function EmptyState({ children }: { children: ReactNode }) {
  return <p className={styles.empty}>{children}</p>;
}
