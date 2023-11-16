import type { Bundle, BundleContext, BundleListener, ServiceListener, FrameworkListener } from '@pandino/pandino-api';
import type { FilterNode } from '@pandino/filters';
import { parseFilter, serializeFilter } from '@pandino/filters';

export class ListenerInfo {
  private readonly bundle: Bundle;
  private readonly context: BundleContext;
  private readonly listener: ServiceListener | BundleListener | FrameworkListener;
  private readonly filter?: FilterNode;

  constructor(
    bundle: Bundle,
    context: BundleContext,
    listener: ServiceListener | BundleListener | FrameworkListener,
    info?: ListenerInfo,
    filter?: string,
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
      if (filter) {
        this.filter = parseFilter(filter);
      }
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

  public getParsedFilter(): FilterNode | undefined {
    return this.filter;
  }

  public getFilter(): string | undefined {
    if (!!this.filter) {
      return serializeFilter(this.filter);
    }
    return undefined;
  }
}
