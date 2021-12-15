import {
  Bundle,
  BundleContext,
  BundleListener,
  ServiceListener,
  FilterApi,
  FrameworkListener,
} from '@pandino/pandino-api';

export class ListenerInfo {
  private readonly bundle: Bundle;
  private readonly context: BundleContext;
  private readonly listener: ServiceListener | BundleListener | FrameworkListener;
  private readonly filter: FilterApi;

  constructor(
    info?: ListenerInfo,
    bundle?: Bundle,
    context?: BundleContext,
    listener?: ServiceListener | BundleListener | FrameworkListener,
    filter?: FilterApi,
  ) {
    if (info) {
      this.bundle = info.bundle;
      this.context = info.context;
      this.listener = info.listener;
      this.filter = info.filter;
    } else {
      this.bundle = bundle;
      this.context = context;
      this.listener = listener;
      this.filter = filter;
    }
  }

  public getBundle(): Bundle {
    return this.bundle;
  }

  public getBundleContext(): BundleContext {
    return this.context;
  }

  public getListener(): ServiceListener | BundleListener | FrameworkListener {
    return this.listener;
  }

  public getParsedFilter(): FilterApi {
    return this.filter;
  }

  public getFilter?(): string {
    if (!!this.filter) {
      return this.filter.toString();
    }
    return null;
  }
}
