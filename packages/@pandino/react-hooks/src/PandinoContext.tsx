import type { BundleContext } from '@pandino/pandino-api';
import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

export interface Context {
  bundleContext: BundleContext;
}

const PandinoContext = createContext<Context>({} as unknown as Context);

export const PandinoProvider = ({ children, ctx }: { children: ReactNode; ctx: BundleContext }) => {
  const [bundleContext, _] = useState<BundleContext>(ctx);

  return <PandinoContext.Provider value={{ bundleContext }}>{children}</PandinoContext.Provider>;
};

export const useBundleContext = (): Context => {
  const { bundleContext } = useContext(PandinoContext);

  return { bundleContext };
};
