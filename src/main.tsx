import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/fonts';
import './styles/tokens.css';
import './styles/globals.css';
import { App } from './app/App';
import { setUpPwa } from './app/pwa';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element in index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

setUpPwa();

// Development only: `ascentSampleData()` in the console loads a generic sample climb.
if (import.meta.env.DEV) {
  void import('./dev/sampleData').then(({ loadSampleData }) => {
    window.ascentSampleData = loadSampleData;
  });
}
