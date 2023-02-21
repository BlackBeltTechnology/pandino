import { BundleContext } from '@pandino/pandino-api';
import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

export interface PandinoBundleContext {
  bundleContext: BundleContext;
}

const PandinoContext = createContext<PandinoBundleContext>({} as unknown as PandinoBundleContext);

export const PandinoProvider = ({ children, ctx }: { children: ReactNode; ctx: BundleContext }) => {
  const [bundleContext, setBundleContext] = useState<BundleContext>(ctx);

  return <PandinoContext.Provider value={{ bundleContext }}>{children}</PandinoContext.Provider>;
};

export const useBundleContext = (): PandinoBundleContext => {
  const { bundleContext } = useContext(PandinoContext);

  return { bundleContext };
};
