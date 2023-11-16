import { describe, beforeEach, expect, it, vi } from 'vitest';
import { ListenerInfo } from './listener-info';
import { BundleImpl } from '../bundle-impl';
import { BundleContextImpl } from '../bundle-context-impl';
import type { ServiceListener } from '@pandino/pandino-api';
import { Pandino } from '../../../pandino';
import { MuteLogger } from '../../../__mocks__/mute-logger';

describe('ListenerInfo', () => {
  let info: ListenerInfo;
  let pandino: Pandino;
  let bundle: BundleImpl;
  const logger = new MuteLogger();

  beforeEach(() => {
    pandino = {} as any;
    bundle = {} as any;
  });

  it('instantiation via info', () => {
    const sourceInfo = new ListenerInfo(null, null, null);
    info = new ListenerInfo(null, null, null, sourceInfo);

    expect(info).toBeDefined();
    expect(info.getFilter()).toEqual(undefined);
  });

  it('instantiation via attributes', () => {
    const filter = '(age>=40)';
    const serviceListener: ServiceListener = {
      serviceChanged: vi.fn(),
    };
    const bundleContext = new BundleContextImpl(logger, bundle, pandino);
    info = new ListenerInfo(bundle, bundleContext, serviceListener, null, filter);

    expect(info).toBeDefined();
    expect(info.getBundle()).toEqual(bundle);
    expect(info.getBundleContext()).toEqual(bundleContext);
    expect(info.getFilter()).toEqual('(age>=40)');
    expect(info.getListener()).toEqual(serviceListener);
    expect(info.getParsedFilter()).toEqual({ attribute: 'age', operator: 'gte', value: '40' });
  });
});
