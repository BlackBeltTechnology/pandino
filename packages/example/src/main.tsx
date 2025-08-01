import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PandinoProvider } from '@pandino/react-hooks';
import App from './App.tsx';
import './index.css';

// Render the React app with Pandino context - the provider handles framework initialization
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PandinoProvider bundles={[import('./bundles/greeting-service-bundle.ts')]}>
      <App />
    </PandinoProvider>
  </StrictMode>,
);
