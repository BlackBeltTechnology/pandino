import {Context, createContext} from 'react';
import {PlatformBundleContextType} from "@example/app-platform-api";

export const PlatformBundleContext: Context<PlatformBundleContextType> = createContext<PlatformBundleContextType>({
  bundleContext: undefined as any,
  meta: undefined as any,
});
