import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Pandino from '@pandino/pandino';
import {
  BUNDLE_ACTIVATOR,
  BUNDLE_SYMBOLICNAME,
  BUNDLE_VERSION,
  LOG_LEVEL_PROP,
  LogLevel,
  OBJECTCLASS,
  PANDINO_BUNDLE_IMPORTER_PROP,
  PANDINO_MANIFEST_FETCHER_PROP,
  PROVIDE_CAPABILITY,
  REQUIRE_CAPABILITY,
  SERVICE_PID,
  ServiceProperties,
} from '@pandino/pandino-api';
import type { Bundle, BundleContext, BundleImporter, BundleManifestHeaders, FrameworkConfigMap } from '@pandino/pandino-api';
import PMActivator from '@pandino/persistence-manager-memory';
import CMActivator from '@pandino/configuration-management';
import { ComponentContext, Deactivate } from '@pandino/scr-api';
import { Activate, Component } from '@pandino/scr-api';
import type { ConfigurationAdmin } from '@pandino/configuration-management-api';
import { CONFIG_ADMIN_INTERFACE_KEY } from '@pandino/configuration-management-api';
import { Activator as SCRActivator } from './Activator';
import { SCR_INTERFACE_KEY } from './constants';

const CMP_ONE_KEY = '@test/cmp-one';
interface CmpOne {
  hello(inp: string): string;
}

const CMP_TWO_KEY = '@test/cmp-two';
interface CmpTwo {
  bello(inp: string): number;
}

describe('SCR', () => {
  let params: FrameworkConfigMap;
  let pandino: Pandino;
  let pandinoContext: BundleContext;
  const pmHeaders: () => BundleManifestHeaders = () => ({
    [BUNDLE_SYMBOLICNAME]: '@pandino/persistence-manager-memory',
    [BUNDLE_VERSION]: '0.0.0',
    [BUNDLE_ACTIVATOR]: new PMActivator(),
    [PROVIDE_CAPABILITY]: '@pandino/persistence-manager;type="in-memory";objectClass="@pandino/persistence-manager/PersistenceManager"',
  });
  const cmHeaders: () => BundleManifestHeaders = () => ({
    [BUNDLE_SYMBOLICNAME]: '@pandino/configuration-management',
    [BUNDLE_VERSION]: '0.0.0',
    [BUNDLE_ACTIVATOR]: new CMActivator(),
    [REQUIRE_CAPABILITY]: '@pandino/persistence-manager;filter:=(objectClass=@pandino/persistence-manager/PersistenceManager)',
    [PROVIDE_CAPABILITY]:
      '@pandino/configuration-management;objectClass:Array="@pandino/configuration-management/ConfigurationAdmin,@pandino/configuration-management/ManagedService,@pandino/configuration-management/ConfigurationListener"',
  });
  const scrHeaders: () => BundleManifestHeaders = () => ({
    [BUNDLE_SYMBOLICNAME]: '@pandino/scr',
    [BUNDLE_VERSION]: '0.0.0',
    [BUNDLE_ACTIVATOR]: new SCRActivator(),
    [REQUIRE_CAPABILITY]:
      '@pandino/configuration-management;objectClass:Array="@pandino/configuration-management/ConfigurationAdmin,@pandino/configuration-management/ConfigurationListener""',
    [PROVIDE_CAPABILITY]: '@pandino/extender;pandino.extender="pandino.component"',
  });
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
    pandino.stop();
    pandino = undefined;
    pandinoContext = undefined;
  });

  it('SCR is only available if ConfigAdmin is present', async () => {
    await pandinoContext.installBundle(scrHeaders());

    expect(pandinoContext.getServiceReference(SCR_INTERFACE_KEY)).toBeUndefined();

    const [_, configAdminBundle] = await installDepBundles(pandinoContext);

    expect(pandinoContext.getServiceReference(SCR_INTERFACE_KEY)).toBeDefined();

    await pandino.uninstallBundle(configAdminBundle as any);

    expect(pandinoContext.getServiceReference(SCR_INTERFACE_KEY)).toBeUndefined();
  });

  it('@Component is registering', async () => {
    await prepareSCR(pandinoContext);

    expect(pandinoContext.getServiceReference(CMP_ONE_KEY)).toBeUndefined();

    @Component({ name: 'test-comp-one-impl', service: CMP_ONE_KEY })
    class OneImpl implements CmpOne {
      hello(inp: string): string {
        return inp.toUpperCase();
      }
    }

    const ref = pandinoContext.getServiceReference<CmpOne>(CMP_ONE_KEY);
    expect(ref).toBeDefined();

    const service = pandinoContext.getService(ref);
    expect(service.hello('me')).toEqual('ME');
  });

  it('@Component is not registering if configuration policy is require and missing', async () => {
    await prepareSCR(pandinoContext);

    expect(pandinoContext.getServiceReference(CMP_ONE_KEY)).toBeUndefined();

    @Component({ name: 'test-comp-one-impl', service: CMP_ONE_KEY, configurationPolicy: 'REQUIRE' })
    class OneImpl implements CmpOne {
      hello(inp: string): string {
        return inp.toUpperCase();
      }
    }

    expect(pandinoContext.getServiceReference(CMP_ONE_KEY)).toBeUndefined();
  });

  it('@Component is registering if configuration policy is require and is present', async () => {
    await prepareSCR(pandinoContext);

    const configAdminRef = pandinoContext.getServiceReference<ConfigurationAdmin>(CONFIG_ADMIN_INTERFACE_KEY)!;
    const configAdmin = pandinoContext.getService(configAdminRef)!;

    const config = configAdmin.getConfiguration(CMP_ONE_KEY);
    config.update({
      [SERVICE_PID]: CMP_ONE_KEY,
      yolo: 'hello',
    });

    expect(pandinoContext.getServiceReference(CMP_ONE_KEY)).toBeUndefined();

    @Component({ name: 'test-comp-one-impl', service: CMP_ONE_KEY, configurationPolicy: 'REQUIRE' })
    class OneImpl implements CmpOne {
      hello(inp: string): string {
        return inp.toUpperCase();
      }
    }

    expect(pandinoContext.getServiceReference(CMP_ONE_KEY)).toBeDefined();
  });

  it('@Component is registering with pid property if present', async () => {
    await prepareSCR(pandinoContext);

    const configAdminRef = pandinoContext.getServiceReference<ConfigurationAdmin>(CONFIG_ADMIN_INTERFACE_KEY)!;
    const configAdmin = pandinoContext.getService(configAdminRef)!;
    const pid = 'custom-pid';

    const config = configAdmin.getConfiguration(pid);
    config.update({
      yolo: 'hello',
    });

    expect(pandinoContext.getServiceReference(CMP_ONE_KEY)).toBeUndefined();

    @Component({ name: 'test-comp-one-impl', service: CMP_ONE_KEY, configurationPid: pid })
    class OneImpl implements CmpOne {
      hello(inp: string): string {
        return inp.toUpperCase();
      }
    }

    const ref = pandinoContext.getServiceReference<CmpOne>(CMP_ONE_KEY);
    expect(ref).toBeDefined();

    expect(ref.getProperty(SERVICE_PID)).toEqual(pid);
  });

  it('@Activate is called', async () => {
    await prepareSCR(pandinoContext);
    const activateSpy = vi.fn();
    let cmpCtx: ComponentContext<any> | undefined;
    let bndCtx: BundleContext | undefined;
    let props: ServiceProperties | undefined;

    @Component({ name: 'test-comp-one-impl', service: CMP_ONE_KEY, property: { xOne: 1, xTwo: false } })
    class OneImpl implements CmpOne {
      hello(inp: string): string {
        return inp.toUpperCase();
      }
      @Activate()
      onActivate(componentContext: ComponentContext<CmpOne>, bundleContext: BundleContext, properties?: ServiceProperties) {
        activateSpy();
        cmpCtx = componentContext;
        bndCtx = bundleContext;
        props = properties;
      }
    }

    const ref = pandinoContext.getServiceReference<CmpOne>(CMP_ONE_KEY);
    expect(ref).toBeDefined();
    expect(ref.getProperty(OBJECTCLASS)).toEqual(CMP_ONE_KEY);

    expect(activateSpy).toHaveBeenCalledTimes(1);
    expect(cmpCtx).toBeDefined();
    expect(bndCtx).toBeDefined();
    expect(props).toMatchObject({
      [SERVICE_PID]: CMP_ONE_KEY,
      [OBJECTCLASS]: CMP_ONE_KEY,
      xOne: 1,
      xTwo: false,
    });
  });

  it('@Deactivate is called when SCR Bundle is uninstalled', async () => {
    const [pmb, cmb, scr] = await prepareSCR(pandinoContext);
    const deActivateSpy = vi.fn();
    let cmpCtx: ComponentContext<any> | undefined;

    @Component({ name: 'test-comp-one-impl', service: CMP_ONE_KEY, property: { xOne: 1, xTwo: false } })
    class OneImpl implements CmpOne {
      hello(inp: string): string {
        return inp.toUpperCase();
      }

      @Deactivate()
      onDeactivate(componentContext: ComponentContext<CmpOne>) {
        deActivateSpy();
        cmpCtx = componentContext;
      }
    }

    expect(deActivateSpy).toHaveBeenCalledTimes(0);

    await pandino.uninstallBundle(scr as any);

    expect(deActivateSpy).toHaveBeenCalledTimes(1);
    expect(cmpCtx).toBeDefined();
  });

  it('@Deactivate is called when required configuration is deleted', async () => {
    const [pmb, cmb, scr] = await prepareSCR(pandinoContext);
    const activateSpy = vi.fn();
    const deActivateSpy = vi.fn();
    const configAdminRef = pandinoContext.getServiceReference<ConfigurationAdmin>(CONFIG_ADMIN_INTERFACE_KEY)!;
    const configAdmin = pandinoContext.getService(configAdminRef)!;
    const pid = 'custom-pid';

    const config = configAdmin.getConfiguration(pid);
    config.update({
      yolo: 'hello',
    });

    @Component({ name: 'test-comp-one-impl', configurationPolicy: 'REQUIRE', service: CMP_ONE_KEY, configurationPid: pid })
    class OneImpl implements CmpOne {
      hello(inp: string): string {
        return inp.toUpperCase();
      }

      @Activate()
      onActivate(componentContext: ComponentContext<CmpOne>, bundleContext: BundleContext, properties?: ServiceProperties) {
        activateSpy();
      }

      @Deactivate()
      onDeactivate() {
        deActivateSpy();
      }
    }

    expect(activateSpy).toHaveBeenCalledTimes(1);
    expect(deActivateSpy).toHaveBeenCalledTimes(0);

    config.delete();
    const asd = configAdmin.listConfigurations();

    expect(deActivateSpy).toHaveBeenCalledTimes(1);
  });

  async function installDepBundles(ctx: BundleContext): Promise<Bundle[]> {
    const pmb = await ctx.installBundle(pmHeaders());
    const cmb = await ctx.installBundle(cmHeaders());
    return [pmb, cmb];
  }

  async function prepareSCR(ctx: BundleContext): Promise<Bundle[]> {
    const [pmb, cmb] = await installDepBundles(ctx);
    const scr = await ctx.installBundle(scrHeaders());
    return [pmb, cmb, scr];
  }
});
