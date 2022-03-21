import {Context, useState, Component} from "react";
import jsxRuntime from 'react/jsx-runtime'
import {BundleActivator, BundleContext, ServiceRegistration} from "@pandino/pandino-api";
import {ComponentProvider, PlatformBundleContextType} from "@example/app-platform-api";
import {PlatformBundleContext} from "../PlatformBundleContext";

const jxsr = jsxRuntime as any;

export class Activator implements BundleActivator {
  private platformBundleContextRegistration: ServiceRegistration<Context<PlatformBundleContextType>> | undefined;
  private useStateRegistration: ServiceRegistration<any> | undefined;
  private componentRegistration: ServiceRegistration<any> | undefined;
  private jsxsRegistration: ServiceRegistration<any> | undefined;
  private fragmentRegistration: ServiceRegistration<any> | undefined;
  private jsxRegistration: ServiceRegistration<any> | undefined;
  private customDashboardPageComponentProvider: ServiceRegistration<ComponentProvider> | undefined;

  start(context: BundleContext): Promise<void> {
    this.useStateRegistration = context.registerService<any>('@pandino/react-provider/react/useState', useState);
    this.componentRegistration = context.registerService<any>('@pandino/react-provider/react/Component', Component);
    this.jsxsRegistration = context.registerService<any>('@pandino/react-provider/react/jsx-runtime/jsxs', jxsr.jsxs);
    this.fragmentRegistration = context.registerService<any>('@pandino/react-provider/react/jsx-runtime/Fragment', jxsr.Fragment);
    this.jsxRegistration = context.registerService<any>('@pandino/react-provider/react/jsx-runtime/jsx', jxsr.jsx);
    this.platformBundleContextRegistration = context.registerService<Context<PlatformBundleContextType>>('@rtscp/platform-bundle-context', PlatformBundleContext);

    return Promise.resolve(undefined);
  }

  stop(context: BundleContext): Promise<void> {
    this.platformBundleContextRegistration?.unregister();
    this.customDashboardPageComponentProvider?.unregister();
    this.useStateRegistration?.unregister();
    this.componentRegistration?.unregister();
    this.jsxsRegistration?.unregister();
    this.fragmentRegistration?.unregister();
    this.jsxRegistration?.unregister();
    return Promise.resolve(undefined);
  }
}
