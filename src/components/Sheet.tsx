import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconButton } from './Button';
import { cx } from './cx';
import styles from './Sheet.module.css';

interface SheetProps {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Actions pinned to the bottom of the sheet. */
  footer?: ReactNode;
  /** Set the title in the serif, for hopeful things (dreams, reflections). */
  serifTitle?: boolean;
  /** Accessible label for the close button. */
  closeLabel?: string;
}

/**
 * Slides up from the bottom on mobile; a centred dialog on desktop. Built on a modal
 * <dialog>, so focus is trapped while it's open and the page behind is inert. Escape or a
 * tap on the backdrop closes it, and focus returns to whatever opened it.
 *
 * Render it only while it should be open: mounting opens it, unmounting closes it. Add
 * `data-autofocus` to the element that should take focus first.
 */
export function Sheet({
  title,
  onClose,
  children,
  footer,
  serifTitle,
  closeLabel = 'Close',
}: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();

    const onCancel = (event: Event) => {
      event.preventDefault();
      onCloseRef.current();
    };
    dialog.addEventListener('cancel', onCancel);
    return () => {
      dialog.removeEventListener('cancel', onCancel);
      if (dialog.open) dialog.close();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
      else
        document.querySelector<HTMLElement>('[data-screen-title]')?.focus({ preventScroll: true });
    };
  }, []);

  return (
    // The backdrop is part of the dialog element, so a click whose target is the dialog
    // itself landed outside the panel. Escape is the keyboard equivalent.
    // eslint-disable-next-line jsx-a11y-x/click-events-have-key-events, jsx-a11y-x/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      className={cx(styles.sheet, serifTitle && styles.serif)}
      aria-labelledby={titleId}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <IconButton label={closeLabel} icon={<X />} onClick={onClose} />
      </div>
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </dialog>
  );
}
