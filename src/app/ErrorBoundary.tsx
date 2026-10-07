import { Component, type ErrorInfo, type ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

interface State {
  error: Error | null;
}

/**
 * If a screen fails to render, show a plain way back instead of a blank page.
 * Data lives in IndexedDB, so a reload loses nothing.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Ascent could not render a screen.', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className={styles.recovery}>
        <h1 className={styles.title}>Ascent couldn’t show this screen.</h1>
        <p className={styles.text}>
          Your data is safe on this device. Reload to carry on from where you were.
        </p>
        <button type="button" className={styles.button} onClick={() => window.location.reload()}>
          Reload Ascent
        </button>
      </main>
    );
  }
}
