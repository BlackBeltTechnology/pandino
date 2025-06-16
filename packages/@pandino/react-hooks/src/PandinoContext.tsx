import type { BundleContext } from '@pandino/pandino-api';
import { type ReactNode, useMemo } from 'react';
import { createContext, useContext } from 'react';

export interface Context {
  bundleContext: BundleContext;
}

const PandinoContext = createContext<Context>({} as unknown as Context);

export const PandinoProvider = ({ children, ctx }: { children: ReactNode; ctx: BundleContext }) => {
  // Use useMemo instead of useState + useEffect to avoid unnecessary re-renders
  const contextValue = useMemo(() => ({ bundleContext: ctx }), [ctx]);

  return <PandinoContext.Provider value={contextValue}>{children}</PandinoContext.Provider>;
};

export const useBundleContext = (): Context => {
  const { bundleContext } = useContext(PandinoContext);

  if (!bundleContext) {
    throw new Error('BundleContext is not available! Maybe you forgot to warp your app with PandinoProvider?');
  }

  return { bundleContext };
};
