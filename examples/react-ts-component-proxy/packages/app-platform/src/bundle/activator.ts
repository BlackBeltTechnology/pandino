import {Context} from "react";
import {BundleActivator, BundleContext, SERVICE_RANKING, ServiceRegistration} from "@pandino/pandino-api";
import {ComponentProvider, PlatformBundleContextType} from "app-platform-api";
import {PlatformBundleContext} from "../PlatformBundleContext";
import {CustomDashboardPageComponent} from "./CustomDashboardPageComponent";

export class Activator implements BundleActivator {
  private platformBundleContextRegistration: ServiceRegistration<Context<PlatformBundleContextType>> | undefined;
  private customDashboardPageComponentProvider: ServiceRegistration<ComponentProvider> | undefined;

  start(context: BundleContext): Promise<void> {
    this.platformBundleContextRegistration = context.registerService<Context<PlatformBundleContextType>>('@rtscp/platform-bundle-context', PlatformBundleContext);

    window.setTimeout(() => {
      const provider: ComponentProvider = {
        getComponent: () => CustomDashboardPageComponent,
        getFilter: () => undefined,
        getIdentifier: () => '@scope/react-ts-component-proxy/pages/Dashboard',
      };
      this.customDashboardPageComponentProvider = context.registerService<ComponentProvider>(provider.getIdentifier(), provider, {
        [SERVICE_RANKING]: 90,
      });
    }, 3000);

    return Promise.resolve(undefined);
  }

  stop(context: BundleContext): Promise<void> {
    this.platformBundleContextRegistration?.unregister();
    this.customDashboardPageComponentProvider?.unregister();
    return Promise.resolve(undefined);
  }
}
