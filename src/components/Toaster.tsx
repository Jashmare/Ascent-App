import { X } from 'lucide-react';
import { dismissToast, useToastState } from '../app/toast';
import styles from './Toaster.module.css';

/** Renders the current confirmation and the screen-reader announcement region. */
export function Toaster() {
  const { toast, announcement } = useToastState();
  return (
    <>
      <div className={styles.region} role="status" aria-live="polite">
        {toast && (
          <div className={styles.toast} key={toast.id}>
            <p className={styles.message}>{toast.message}</p>
            {toast.action && (
              <button
                type="button"
                className={styles.action}
                onClick={() => {
                  toast.action?.run();
                  dismissToast();
                }}
              >
                {toast.action.label}
              </button>
            )}
            <button
              type="button"
              className={styles.close}
              aria-label="Dismiss"
              onClick={dismissToast}
            >
              <X aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      <div className="visually-hidden" aria-live="polite">
        {announcement}
      </div>
    </>
  );
}
