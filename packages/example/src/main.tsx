import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PandinoProvider } from '@pandino/react-hooks';
import App from './App.tsx';
import { FeatureToggleProvider } from './contexts/FeatureToggleContext';

const DynamicBundleLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // const { enabledFeatures } = useFeatureToggle();

  return (
    <PandinoProvider
      bundles={[
        import('./bundles/greeting-service-bundle'),
        import('./bundles/logger-bundle'),
        // Fragment bundles should not be started directly, they are attached to their host bundle
        // import('./bundles/logger-formatter-fragment'),
        import('./bundles/task-manager-bundle'),
        import('./bundles/event-publisher-bundle'),
        import('./bundles/event-handler-bundle'),
        import('./bundles/config-manager-bundle'),
        import('./bundles/config-consumer-bundle'),
        import('./bundles/declarative-components-bundle'),
      ]}
    >
      {children}
    </PandinoProvider>
  );
};

const Root: React.FC = () => {
  return (
    <FeatureToggleProvider>
      <DynamicBundleLoader>
        <App />
      </DynamicBundleLoader>
    </FeatureToggleProvider>
  );
};

const rootElement = document.getElementById('root')!;

// Check if we already have a root instance attached to this element
// @ts-ignore - Adding a custom property to track the root instance
if (!window.__PANDINO_ROOT__) {
  // @ts-ignore - First time initialization
  window.__PANDINO_ROOT__ = createRoot(rootElement);
}

// Use the existing root instance
// @ts-ignore - Access the stored root
window.__PANDINO_ROOT__.render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
