import { Context, createContext } from 'react';
import { ReactBundleContextType } from '@pandino/pandino-react-dom-api';

export const ReactBundleContext: Context<ReactBundleContextType> = createContext<ReactBundleContextType>({
  bundleContext: undefined as any,
});
