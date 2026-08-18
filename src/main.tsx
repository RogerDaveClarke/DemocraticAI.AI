import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { trackWebVitals } from './utils/analytics';
import { injectGoogleAnalytics } from './utils/inject-ga';
import { validateEnvironment, logValidationResults } from './utils/envValidation';

// Validate environment variables only during development so production renders even when
// Cloud Run runtime env vars are not baked into the static Vite bundle.
if (import.meta.env.DEV) {
  const envValidation = validateEnvironment();
  logValidationResults(envValidation);
}

// Render app immediately
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Load analytics and web vitals asynchronously after initial render
setTimeout(() => {
  injectGoogleAnalytics();
  
  // Dynamically import web-vitals to avoid blocking initial load
  import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
    onCLS(trackWebVitals);
    onINP(trackWebVitals);
    onFCP(trackWebVitals);
    onLCP(trackWebVitals);
    onTTFB(trackWebVitals);
  }).catch(error => {
    console.warn('Web vitals failed to load:', error);
  });
}, 0);
