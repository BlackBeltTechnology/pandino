import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Pandino from '@pandino/pandino';
import {
  BUNDLE_ACTIVATOR,
  BUNDLE_SYMBOLICNAME,
  BUNDLE_VERSION,
  LOG_LEVEL_PROP,
  LogLevel,
  PANDINO_BUNDLE_IMPORTER_PROP,
  PANDINO_MANIFEST_FETCHER_PROP,
  PROVIDE_CAPABILITY,
  REQUIRE_CAPABILITY,
} from '@pandino/pandino-api';
import type { Bundle, BundleContext, BundleImporter, BundleManifestHeaders, FrameworkConfigMap } from '@pandino/pandino-api';
import PMActivator from '@pandino/persistence-manager-memory';
import CMActivator from '@pandino/configuration-management';
import type { ServiceComponentRuntime } from './ServiceComponentRuntime';
import { Activator as SCRActivator } from './Activator';
import { SCR_INTERFACE_KEY } from './constants';

describe('SCR', () => {
  let params: FrameworkConfigMap;
  let pandino: Pandino;
  let pandinoContext: BundleContext;
  let scr: ServiceComponentRuntime;
  const pmHeaders: BundleManifestHeaders = {
    [BUNDLE_SYMBOLICNAME]: '@pandino/persistence-manager-memory',
    [BUNDLE_VERSION]: '0.0.0',
    [BUNDLE_ACTIVATOR]: new PMActivator(),
    [PROVIDE_CAPABILITY]: '@pandino/persistence-manager;type="in-memory";objectClass="@pandino/persistence-manager/PersistenceManager"',
  };
  const cmHeaders: BundleManifestHeaders = {
    [BUNDLE_SYMBOLICNAME]: '@pandino/configuration-management',
    [BUNDLE_VERSION]: '0.0.0',
    [BUNDLE_ACTIVATOR]: new CMActivator(),
    [REQUIRE_CAPABILITY]: '@pandino/persistence-manager;filter:=(objectClass=@pandino/persistence-manager/PersistenceManager)',
    [PROVIDE_CAPABILITY]:
      '@pandino/configuration-management;objectClass:Array="@pandino/configuration-management/ConfigurationAdmin,@pandino/configuration-management/ManagedService,@pandino/configuration-management/ConfigurationListener"',
  };
  const scrHeaders: BundleManifestHeaders = {
    [BUNDLE_SYMBOLICNAME]: '@pandino/scr',
    [BUNDLE_VERSION]: '0.0.0',
    [BUNDLE_ACTIVATOR]: new SCRActivator(),
    [REQUIRE_CAPABILITY]:
      '@pandino/configuration-management;objectClass:Array="@pandino/configuration-management/ConfigurationAdmin,@pandino/configuration-management/ConfigurationListener""',
    [PROVIDE_CAPABILITY]: '@pandino/extender;pandino.extender="pandino.component"',
  };
  const importer: BundleImporter = {
    import: (activatorLocation: string, manifestLocation: string, deploymentRoot?: string) => {
      // this won't be called if the activator is an instance and not a string
      return Promise.resolve({
        default: null as unknown as any,
      });
    },
  };

  beforeEach(async () => {
    params = {
      [PANDINO_MANIFEST_FETCHER_PROP]: vi.fn() as any,
      [PANDINO_BUNDLE_IMPORTER_PROP]: importer,
      [LOG_LEVEL_PROP]: LogLevel.WARN,
    };
    pandino = new Pandino(params);

    await pandino.init();
    await pandino.start();

    pandinoContext = pandino.getBundleContext();
  });

  afterEach(() => {
    pandino = undefined;
  });

  it('SCR is only available if ConfigAdmin is present', async () => {
    await pandinoContext.installBundle(scrHeaders);

    expect(pandinoContext.getServiceReference(SCR_INTERFACE_KEY)).toBeUndefined();

    const [_, configAdminBundle] = await installDepBundles();

    expect(pandinoContext.getServiceReference(SCR_INTERFACE_KEY)).toBeDefined();

    await pandino.uninstallBundle(configAdminBundle as any);

    expect(pandinoContext.getServiceReference(SCR_INTERFACE_KEY)).toBeUndefined();
  });

  async function installDepBundles(): Promise<Bundle[]> {
    const pmb = await pandinoContext.installBundle(pmHeaders);
    const cmb = await pandinoContext.installBundle(cmHeaders);
    return [pmb, cmb];
  }

  async function prepareAndGetSCR(): Promise<ServiceComponentRuntime> {
    await installDepBundles();
    const ref = pandinoContext.getServiceReference<ServiceComponentRuntime>(SCR_INTERFACE_KEY);
    return pandinoContext.getService(ref);
  }
});
