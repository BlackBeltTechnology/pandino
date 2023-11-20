import { describe, beforeEach, expect, it, vi } from 'vitest';
import { BundleCapabilityImpl } from './bundle-capability-impl';
import type { BundleRevision } from '../bundle-revision';
import { BundleRevisionImpl } from '../bundle-revision-impl';
import { BundleImpl } from '../bundle-impl';
import { MuteLogger } from '../../../__mocks__/mute-logger';
import { Pandino } from '../../../pandino';
import {
  BUNDLE_ACTIVATOR,
  BUNDLE_DESCRIPTION,
  BUNDLE_NAME,
  BUNDLE_SYMBOLICNAME,
  BUNDLE_VERSION,
  DEPLOYMENT_ROOT_PROP,
  LOG_LEVEL_PROP,
  LogLevel,
  MANDATORY_DIRECTIVE,
  PANDINO_BUNDLE_IMPORTER_PROP,
  PANDINO_MANIFEST_FETCHER_PROP,
  USES_DIRECTIVE,
} from '@pandino/pandino-api';
import type { BundleActivator, BundleImporter, BundleManifestHeaders, FrameworkConfigMap, Logger } from '@pandino/pandino-api';

describe('BundleCapabilityImpl', () => {
  const dummyActivator: BundleActivator = {
    start: vi.fn(),
    stop: vi.fn(),
  };
  const importer: BundleImporter = {
    import: (activator: string, manifest: string) =>
      Promise.resolve({
        default: dummyActivator,
      }),
  };
  const bundle1Headers: BundleManifestHeaders = {
    [BUNDLE_SYMBOLICNAME]: '@scope/bundle',
    [BUNDLE_VERSION]: '1.2.3',
    [BUNDLE_ACTIVATOR]: 'https://some.url/does-not-exist.js',
    [BUNDLE_NAME]: 'My Bundle',
    [BUNDLE_DESCRIPTION]: 'Test!',
  };
  let params: FrameworkConfigMap;
  let logger: Logger;
  let pandino: Pandino;
  let bundle: BundleImpl;
  let revision: BundleRevision;
  let capability: BundleCapabilityImpl;
  let dirs: Record<string, string> = {
    directive1: 'content1',
    [MANDATORY_DIRECTIVE]: 'attr2,attr3',
    [USES_DIRECTIVE]: 'uses',
  };
  let attrs: Record<string, any> = {
    attr1: 111,
    attr2: 'yayy',
    attr3: true,
  };

  beforeEach(async () => {
    logger = new MuteLogger();
    params = {
      [DEPLOYMENT_ROOT_PROP]: '',
      [PANDINO_MANIFEST_FETCHER_PROP]: vi.fn() as any,
      [PANDINO_BUNDLE_IMPORTER_PROP]: importer,
      [LOG_LEVEL_PROP]: LogLevel.WARN,
    };
    pandino = new Pandino(params);

    await pandino.init();
    await pandino.start();
    await pandino.getBundleContext().installBundle(bundle1Headers);

    bundle = pandino.getBundleContext().getBundles()[0] as BundleImpl;
    revision = new BundleRevisionImpl(bundle, '1', {
      [BUNDLE_SYMBOLICNAME]: '@test/test',
    });
    capability = new BundleCapabilityImpl(revision, 'test.namespace', dirs, attrs);
  });

  it('stock Capability', () => {
    expect(capability).toBeDefined();
    expect(capability.getNamespace()).toEqual('test.namespace');
    expect(capability.getAttributes()).toEqual({
      attr1: 111,
      attr2: 'yayy',
      attr3: true,
    });
    expect(capability.getDirectives()).toEqual({
      directive1: 'content1',
      [MANDATORY_DIRECTIVE]: 'attr2,attr3',
      [USES_DIRECTIVE]: 'uses',
    });
    expect(capability.getResource()).toEqual(revision);
    expect(capability.getRevision()).toEqual(revision);
    expect(capability.isAttributeMandatory('attr1')).toEqual(false);
    expect(capability.isAttributeMandatory('attr2')).toEqual(true);
    expect(capability.getUses()).toEqual(['uses']);
    expect(capability.toString()).toEqual('[@scope/bundle: 1.2.3 (R 1)] test.namespace; attr1=111; attr2=yayy; attr3=true');
  });

  it('equals', () => {
    const capability2 = new BundleCapabilityImpl(revision, 'test.namespace.other');
    const capability3 = new BundleCapabilityImpl(revision, 'test.namespace');

    expect(capability).toBeDefined();
    expect(capability.equals(null)).toEqual(false);
    expect(capability.equals(undefined)).toEqual(false);
    expect(capability.equals({})).toEqual(false);
    expect(capability.equals(capability2)).toEqual(false);
    expect(capability.equals(capability3)).toEqual(true);
  });
});
