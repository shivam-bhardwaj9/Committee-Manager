import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';

import App from './App';

import './index.css';

// In Replit's dev/preview environment the API is same-origin (proxied under
// the artifact's base path), so no base URL is needed. When deploying the
// frontend and backend separately (e.g. Firebase + Render), set
// VITE_API_URL to the backend's public URL at build time.
if (import.meta.env.VITE_API_URL) {
  setBaseUrl(import.meta.env.VITE_API_URL);
}

createRoot(document.getElementById('root')!).render(<App />);

// Register the offline-caching service worker in production builds only —
// in dev it would fight with Vite's own module reloading and serve stale
// content.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
      })
      .catch((error) => {
        console.error('Service worker registration failed', error);
      });
  });
}
