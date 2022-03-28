import {PlatformBundleContextType} from "../platform-bundle-context";

export type UseBundleContext = () => PlatformBundleContextType;

/**
 * Placeholder implementation which will always be replaced by an actual implementation returning the BundleContext for
 * the application.
 */
export const useBundleContext: UseBundleContext = () => undefined as any;
