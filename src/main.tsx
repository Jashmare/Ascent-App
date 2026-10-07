import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/fonts';
import './styles/tokens.css';
import './styles/globals.css';
import { App } from './app/App';
import { ErrorBoundary } from './app/ErrorBoundary';
import { setUpPwa } from './app/pwa';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element in index.html');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

setUpPwa();

// Development only: `ascentSampleData()` in the console loads a generic sample climb.
if (import.meta.env.DEV) {
  void import('./dev/sampleData').then(({ loadSampleData }) => {
    window.ascentSampleData = loadSampleData;
  });
}
