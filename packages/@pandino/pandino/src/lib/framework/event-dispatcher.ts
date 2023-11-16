import type {
  BundleContext,
  BundleEvent,
  BundleListener,
  ServiceEvent,
  ServiceListener,
  Logger,
  FrameworkEvent,
  FrameworkListener,
  Bundle,
  BundleState,
} from '@pandino/pandino-api';
import { evaluateFilter } from '@pandino/filters';
import type { FilterNode } from '@pandino/filters';
import { ListenerInfo } from './util/listener-info';
import { BundleImpl } from './bundle-impl';
import { BundleEventImpl } from './bundle-event-impl';
import { FrameworkEventImpl } from './framework-event-impl';
import { ServiceEventImpl } from './service-event-impl';
import { CapabilitySet } from './capability-set/capability-set';
import type { Capability } from './resource';

export type ListenerType = 'BUNDLE' | 'FRAMEWORK' | 'SERVICE';

export class EventDispatcher {
  // @ts-ignore
  private readonly logger: Logger;
  private svcListeners: Map<BundleContext, Array<ListenerInfo>> = new Map<BundleContext, Array<ListenerInfo>>();
  private bndListeners: Map<BundleContext, Array<ListenerInfo>> = new Map<BundleContext, Array<ListenerInfo>>();
  private fwkListeners: Map<BundleContext, Array<ListenerInfo>> = new Map<BundleContext, Array<ListenerInfo>>();

  constructor(logger: Logger) {
    this.logger = logger;
  }

  fireServiceEvent(event: ServiceEvent, oldProps: Record<string, any>): void {
    const listeners: Map<BundleContext, Array<ListenerInfo>> = new Map<BundleContext, Array<ListenerInfo>>(
      this.svcListeners.entries(),
    );

    EventDispatcher.fireEventImmediately('SERVICE', listeners, event, oldProps);
  }

  fireFrameworkEvent(event: FrameworkEvent, source: BundleImpl): void {
    const listeners: Map<BundleContext, Array<ListenerInfo>> = new Map<BundleContext, Array<ListenerInfo>>(
      this.fwkListeners.entries(),
    );

    EventDispatcher.fireEventImmediately('FRAMEWORK', listeners, event, source);
  }

  fireBundleEvent(event: BundleEvent, source?: BundleImpl): void {
    const listeners: Map<BundleContext, Array<ListenerInfo>> = new Map<BundleContext, Array<ListenerInfo>>(
      this.bndListeners.entries(),
    );

    EventDispatcher.fireEventImmediately('BUNDLE', listeners, event, source);
  }

  private static fireEventImmediately(
    type: ListenerType,
    listeners: Map<BundleContext, Array<ListenerInfo>>,
    event: any,
    oldProps?: Record<string, any>,
  ): void {
    for (let [_, listenerInfo] of listeners.entries()) {
      for (let info of listenerInfo) {
        const bundle = info.getBundle();
        const listener = info.getListener();
        const filter = info.getFilter();

        switch (type) {
          case 'FRAMEWORK':
            EventDispatcher.invokeFrameworkListenerCallback(bundle, listener as FrameworkListener, event);
            break;
          case 'BUNDLE':
            EventDispatcher.invokeBundleListenerCallback(bundle, listener as BundleListener, event);
            break;
          case 'SERVICE':
            EventDispatcher.invokeServiceListenerCallback(bundle, listener as ServiceListener, event, filter, oldProps);
            break;
          default:
            throw new Error(`Unhandled event type: ${type}!`);
        }
      }
    }
  }

  private static invokeServiceListenerCallback(
    bundle: Bundle,
    listener: ServiceListener,
    event: ServiceEventImpl,
    filter?: string,
    oldProps?: Record<string, any>,
  ): void {
    const validBundleStateTypes: BundleState[] = ['STARTING', 'STOPPING', 'ACTIVE'];
    if (!validBundleStateTypes.includes(bundle.getState())) {
      return;
    }

    let matched = !filter || CapabilitySet.matches(event.getServiceReference() as unknown as Capability, filter);

    if (matched) {
      listener.serviceChanged(event);
    } else if (event.getType() == 'MODIFIED') {
      if (!!filter && evaluateFilter(oldProps, filter)) {
        let se = new ServiceEventImpl('MODIFIED_ENDMATCH', event.getServiceReference());
        if (listener.isSync) {
          listener.serviceChanged(se);
        } else {
          setTimeout(() => listener.serviceChanged(se), 0);
        }
      }
    }
  }

  private static invokeBundleListenerCallback(bundle: Bundle, listener: BundleListener, event: BundleEventImpl): void {
    const validSyncEventBundleStateTypes: BundleState[] = ['STARTING', 'STOPPING', 'ACTIVE'];
    if (validSyncEventBundleStateTypes.includes(bundle.getState())) {
      if (listener.isSync) {
        listener.bundleChanged(event);
      } else {
        setTimeout(() => listener.bundleChanged(event), 0);
      }
    }
  }

  private static invokeFrameworkListenerCallback(
    bundle: Bundle,
    listener: FrameworkListener,
    event: FrameworkEventImpl,
  ): void {
    const validBundleStateTypes: BundleState[] = ['STARTING', 'ACTIVE'];
    if (validBundleStateTypes.includes(bundle.getState())) {
      if (listener.isSync) {
        listener.frameworkEvent(event);
      } else {
        setTimeout(() => listener.frameworkEvent(event), 0);
      }
    }
  }

  addListener(bc: BundleContext, type: ListenerType, listener: any, filter?: string): FilterNode | undefined {
    if (!listener) {
      throw new Error('Listener is missing');
    }

    const oldFilter = this.updateListener(bc, type, listener, filter);

    if (oldFilter) {
      return oldFilter;
    }

    try {
      bc.getBundle();
    } catch (ex) {
      // Bundle context is no longer valid, so just return.
      return undefined;
    }

    let listeners: Map<BundleContext, Array<ListenerInfo>>;

    if (type === 'FRAMEWORK') {
      listeners = this.fwkListeners;
    } else if (type === 'BUNDLE') {
      listeners = this.bndListeners;
    } else if (type === 'SERVICE') {
      listeners = this.svcListeners;
    } else {
      throw new Error('Unknown listener: ' + type);
    }

    const info: ListenerInfo = new ListenerInfo(bc.getBundle()!, bc, listener, undefined, filter);
    listeners = EventDispatcher.addListenerInfo(listeners, info);

    if (type === 'FRAMEWORK') {
      this.fwkListeners = listeners;
    } else if (type === 'BUNDLE') {
      this.bndListeners = listeners;
    } else if (type === 'SERVICE') {
      this.svcListeners = listeners;
    }

    return undefined;
  }

  removeListener(bc: BundleContext, type: ListenerType, listener: any): void {
    let listeners: Map<BundleContext, Array<ListenerInfo>>;

    if (!listener) {
      throw new Error('Listener is missing');
    }

    if (type === 'FRAMEWORK') {
      listeners = this.fwkListeners;
    } else if (type === 'BUNDLE') {
      listeners = this.bndListeners;
    } else if (type === 'SERVICE') {
      listeners = this.svcListeners;
    } else {
      throw new Error('Unknown listener: ' + type);
    }

    // Try to find the instance in our list.
    let idx: number = -1;
    for (let [bc, infos] of listeners.entries()) {
      for (let i = 0; i < infos.length; i++) {
        let info: ListenerInfo = infos[i];
        if (info.getBundleContext().equals(bc) && info.getListener() === listener) {
          idx = i;
          break;
        }
      }
    }

    if (idx >= 0) {
      listeners = EventDispatcher.removeListenerInfo(listeners, bc, idx);
    }

    if (type === 'FRAMEWORK') {
      this.fwkListeners = listeners;
    } else if (type === 'BUNDLE') {
      this.bndListeners = listeners;
    } else if (type === 'SERVICE') {
      this.svcListeners = listeners;
    }
  }

  removeListeners(bc: BundleContext): void {
    this.fwkListeners = EventDispatcher.removeListenerInfos(this.fwkListeners, bc);
    this.bndListeners = EventDispatcher.removeListenerInfos(this.bndListeners, bc);
    this.svcListeners = EventDispatcher.removeListenerInfos(this.svcListeners, bc);
  }

  private static removeListenerInfos(
    listeners: Map<BundleContext, Array<ListenerInfo>>,
    bc: BundleContext,
  ): Map<BundleContext, Array<ListenerInfo>> {
    const copy: Map<BundleContext, Array<ListenerInfo>> = new Map<BundleContext, Array<ListenerInfo>>(
      listeners.entries(),
    );
    copy.delete(bc);
    return copy;
  }

  private static removeListenerInfo(
    listeners: Map<BundleContext, Array<ListenerInfo>>,
    bc: BundleContext,
    idx: number,
  ): Map<BundleContext, Array<ListenerInfo>> {
    const copy: Map<BundleContext, Array<ListenerInfo>> = new Map<BundleContext, Array<ListenerInfo>>(
      listeners.entries(),
    );
    const infos: Array<ListenerInfo> = [...copy.get(bc)!];
    copy.delete(bc);
    if (Array.isArray(infos)) {
      infos.splice(idx, 1);
      if (infos.length > 0) {
        copy.set(bc, infos);
      }
      return copy;
    }
    return listeners;
  }

  updateListener(bc: BundleContext, type: ListenerType, listener: any, filter?: string): FilterNode | undefined {
    if (type === 'SERVICE') {
      // Verify that the bundle context is still valid.
      try {
        bc.getBundle();
      } catch (err) {
        return undefined;
      }

      const infos: Array<ListenerInfo> | undefined = this.svcListeners.get(bc);
      for (let i = 0; Array.isArray(infos) && i < infos.length; i++) {
        const info: ListenerInfo = infos[i];
        if (info.getBundleContext().equals(bc) && info.getListener() === listener) {
          // The spec says to update the filter in this case.
          const oldFilter = info.getParsedFilter();
          const newInfo = new ListenerInfo(
            info.getBundle()!,
            info.getBundleContext(),
            info.getListener(),
            undefined,
            filter,
          );
          this.svcListeners = EventDispatcher.updateListenerInfo(this.svcListeners, i, newInfo);
          return oldFilter;
        }
      }
    }

    return undefined;
  }

  private static updateListenerInfo(
    listeners: Map<BundleContext, Array<ListenerInfo>>,
    idx: number,
    info: ListenerInfo,
  ): Map<BundleContext, Array<ListenerInfo>> {
    let copy: Map<BundleContext, Array<ListenerInfo>> = new Map<BundleContext, Array<ListenerInfo>>(listeners);
    let infos: Array<ListenerInfo> | undefined = copy.get(info.getBundleContext());
    copy.delete(info.getBundleContext());
    if (Array.isArray(infos)) {
      infos = [...(infos ?? [])];
      infos[idx] = info;
      copy.set(info.getBundleContext(), infos);
      return copy;
    }
    return listeners;
  }

  private static addListenerInfo(
    listeners: Map<BundleContext, Array<ListenerInfo>>,
    info: ListenerInfo,
  ): Map<BundleContext, Array<ListenerInfo>> {
    if (!listeners.has(info.getBundleContext())) {
      listeners.set(info.getBundleContext(), []);
    }
    const infos = listeners.get(info.getBundleContext());

    infos?.push(info);

    return listeners;
  }

  // private static updateListenerInfo(
  //   listeners: Map<BundleContext, Array<ListenerInfo>>,
  //   idx: number,
  //   info: ListenerInfo,
  // ): Map<BundleContext, Array<ListenerInfo>> {
  //   const copy: Map<BundleContext, Array<ListenerInfo>> = new Map<BundleContext, Array<ListenerInfo>>(listeners.entries());
  //   let infos: Array<ListenerInfo> = copy.get(info.getBundleContext());
  //
  //   copy.delete(info.getBundleContext());
  //
  //   if (Array.isArray(infos)) {
  //     infos = [...infos];
  //     infos[idx] = info;
  //     copy.set(info.getBundleContext(), infos);
  //
  //     return copy;
  //   }
  //
  //   return listeners;
  // }
}
