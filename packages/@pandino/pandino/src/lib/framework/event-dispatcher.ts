import {
  BundleContext,
  BundleEvent,
  BundleListener,
  ServiceEvent,
  ServiceListener,
  ServiceReference,
  Logger,
  FilterApi,
  FrameworkEvent,
  FrameworkListener,
  Bundle,
  BundleState,
} from '@pandino/pandino-api';
import { ListenerInfo } from './util/listener-info';
import { BundleImpl } from './bundle-impl';
import { BundleEventImpl } from './bundle-event-impl';
import { FrameworkEventImpl } from './framework-event-impl';
import { ServiceEventImpl } from './service-event-impl';

export type ListenerType = 'BUNDLE' | 'FRAMEWORK' | 'SERVICE';

export class EventDispatcher {
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
    for (let [ctx, lstnrs] of listeners.entries()) {
      for (let info of lstnrs) {
        const bundle = info.getBundle();
        const listener = info.getListener();
        const filter: FilterApi = info.getParsedFilter();

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
    filter?: FilterApi,
    oldProps?: Record<string, any>,
  ): void {
    const validBundleStateTypes: BundleState[] = ['STARTING', 'STOPPING', 'ACTIVE'];
    if (validBundleStateTypes.includes(bundle.getState())) {
      return;
    }
    const ref: ServiceReference<any> = event.getServiceReference();

    let matched = filter == null || filter.match(event.getServiceReference());

    if (matched) {
      listener.serviceChanged(event);
    } else if (event.getType() == 'MODIFIED') {
      if (!!filter && filter.match(oldProps)) {
        let se = new ServiceEventImpl('MODIFIED_ENDMATCH', event.getServiceReference());
        listener.serviceChanged(se);
      }
    }
  }

  private static invokeBundleListenerCallback(bundle: Bundle, listener: BundleListener, event: BundleEventImpl): void {
    const validSyncEventBundleStateTypes: BundleState[] = ['STARTING', 'STOPPING', 'ACTIVE'];
    if (validSyncEventBundleStateTypes.includes(bundle.getState())) {
      listener.bundleChanged(event);
    }
  }

  private static invokeFrameworkListenerCallback(
    bundle: Bundle,
    listener: FrameworkListener,
    event: FrameworkEventImpl,
  ): void {
    const validBundleStateTypes: BundleState[] = ['STARTING', 'ACTIVE'];
    if (validBundleStateTypes.includes(bundle.getState())) {
      listener.frameworkEvent(event);
    }
  }

  addListener?(bc: BundleContext, type: ListenerType, listener: any, filter?: FilterApi): FilterApi {
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
      return null;
    }

    let listeners: Map<BundleContext, Array<ListenerInfo>> = null;

    if (type === 'FRAMEWORK') {
      listeners = this.fwkListeners;
    } else if (type === 'BUNDLE') {
      listeners = this.bndListeners;
    } else {
      throw new Error('Unknown listener: ' + type);
    }

    const info: ListenerInfo = new ListenerInfo(null, bc.getBundle(), bc, listener, filter);
    listeners = EventDispatcher.addListenerInfo(listeners, info);

    if (type === 'FRAMEWORK') {
      this.fwkListeners = listeners;
    } else if (type === 'BUNDLE') {
      this.bndListeners = listeners;
    }

    return null;
  }

  removeListener(bc: BundleContext, type: ListenerType, listener: any): void {
    let listeners: Map<BundleContext, Array<ListenerInfo>> = null;

    if (!listener) {
      throw new Error('Listener is missing');
    }

    if (type === 'FRAMEWORK') {
      listeners = this.fwkListeners;
    } else if (type === 'BUNDLE') {
      listeners = this.bndListeners;
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
    }
  }

  removeListeners(bc: BundleContext): void {
    this.fwkListeners = EventDispatcher.removeListenerInfos(this.fwkListeners, bc);
    this.bndListeners = EventDispatcher.removeListenerInfos(this.bndListeners, bc);
    // this.svcListeners = EventDispatcher.removeListenerInfos(this.svcListeners, bc);
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
    const infos: Array<ListenerInfo> = [...copy.get(bc)];
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

  updateListener(bc: BundleContext, type: ListenerType, listener: any, filter?: FilterApi): FilterApi {
    if (type === 'SERVICE') {
      // TODO: later...
    }

    return null;
  }

  private static addListenerInfo(
    listeners: Map<BundleContext, Array<ListenerInfo>>,
    info: ListenerInfo,
  ): Map<BundleContext, Array<ListenerInfo>> {
    const copy: Map<BundleContext, Array<ListenerInfo>> = new Map<BundleContext, Array<ListenerInfo>>(
      listeners.entries(),
    );
    let infos: Array<ListenerInfo> = copy.get(info.getBundleContext());

    copy.delete(info.getBundleContext());

    if (!Array.isArray(infos)) {
      infos = [];
    } else {
      infos = [...infos];
    }

    infos.push(info);
    copy.set(info.getBundleContext(), infos);

    return copy;
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
