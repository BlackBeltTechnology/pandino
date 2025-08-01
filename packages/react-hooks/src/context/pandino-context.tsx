import type { BootstrapConfig, BundleContext, BundleModule, OSGiFramework } from '@pandino/pandino';
import { OSGiBootstrap } from '@pandino/pandino';
import { createContext, type FC, type ReactNode, useContext, useEffect, useRef, useState } from 'react';

// Define the context type
export interface PandinoContextType {
  framework: OSGiFramework | null;
  bundleContext: BundleContext | null;
  isInitialized: boolean;
  error: Error | null;
}

// Create the context with a default value
export const PandinoContext = createContext<PandinoContextType>({
  framework: null,
  bundleContext: null,
  isInitialized: false,
  error: null,
});

// Provider props
export interface PandinoProviderProps {
  children: ReactNode;
  bootstrapConfig?: BootstrapConfig;
  bundles?: Array<Promise<BundleModule>>;
}

// Provider component
export const PandinoProvider: FC<PandinoProviderProps> = ({ children, bootstrapConfig, bundles = [] }) => {
  const [framework, setFramework] = useState<OSGiFramework | null>(null);
  const [bundleContext, setBundleContext] = useState<BundleContext | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const frameworkRef = useRef<OSGiFramework | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (initializedRef.current) {
      return;
    }

    const initializePandino = async () => {
      try {
        initializedRef.current = true;

        // Initialize the framework
        const bootstrap = new OSGiBootstrap(bootstrapConfig);
        const fw = await bootstrap.start();
        setFramework(fw);
        frameworkRef.current = fw;

        // Get the bundle context directly from the framework
        const context = fw.getBundleContext();
        setBundleContext(context);

        // Install and start additional bundles
        for (const bundlePromise of bundles) {
          try {
            const bundleModule = await bundlePromise;
            const bundleConfig = bundleModule.default;

            const installedBundle = await context.installBundle(bundlePromise, bundleConfig);
            await installedBundle.start();
          } catch (error) {
            console.error('Error installing/starting bundle:', error);
          }
        }

        setIsInitialized(true);
      } catch (err) {
        initializedRef.current = false; // Reset on error so it can be retried
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    initializePandino();

    // Cleanup function to stop the framework when the component unmounts
    return () => {
      if (frameworkRef.current) {
        frameworkRef.current.stop().catch((err) => {
          console.error('Error stopping Pandino framework:', err);
        });
        initializedRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - initialize only once

  const contextValue: PandinoContextType = {
    framework,
    bundleContext,
    isInitialized,
    error,
  };

  return <PandinoContext.Provider value={contextValue}>{children}</PandinoContext.Provider>;
};

// Hook to use the Pandino context
export const usePandinoContext = (): PandinoContextType => {
  const context = useContext(PandinoContext);
  if (!context) {
    throw new Error('usePandinoContext must be used within a PandinoProvider');
  }
  return context;
};
