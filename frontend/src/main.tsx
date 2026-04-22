import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@/i18n';
import '@/assets/styles/variables.css';
import '@/assets/styles/global.css';

// ---- axe-core a11y audit (solo DEV) ----------------------------------------
// Fa side-effect run su ogni re-render: segnala violations WCAG nella console.
// In production non gira (zero overhead).
if (import.meta.env.DEV) {
  void import('@axe-core/react').then(({ default: axe }) => {
    axe(React, ReactDOM, 1000, {
      rules: [
        // Custom: ignoriamo le regole su contrasto AntD scure (gestite in dark mode).
      ],
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
