import {BundleContext} from "@pandino/pandino-api";
import {AppMeta} from "./app-meta";

export interface PlatformBundleContextType {
  bundleContext: BundleContext,
  meta: AppMeta,
}
