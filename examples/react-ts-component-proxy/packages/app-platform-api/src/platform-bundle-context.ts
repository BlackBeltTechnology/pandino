import {BundleContext} from "@pandino/pandino-api";
import {AppMeta} from "./app-meta";

export interface PlatformBundleContextType {
  bundleContext: BundleContext,
  meta: AppMeta,
  update: () => void, // TODO: remove once we have a more reasonable example to test Context updates
}
