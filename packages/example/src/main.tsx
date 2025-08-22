import { type FC, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PandinoProvider } from '@pandino/react-hooks';
import App from './App.tsx';

const Root: FC = () => {
  return (
    <PandinoProvider bundles={[import('pandino:bundle:alpha'), import('pandino:bundle:beta')]}>
      <App />
    </PandinoProvider>
  );
};

const rootElement = document.getElementById('root')!;

createRoot(rootElement).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
