import {ReactBundleContextType} from "./react-bundle-context-type";

export type UseReactBundleContextType = () => ReactBundleContextType;

/**
 * Placeholder implementation which will always be replaced by an actual implementation returning the BundleContext for
 * the application.
 */
export const useReactBundleContext: UseReactBundleContextType = () => undefined as any;
