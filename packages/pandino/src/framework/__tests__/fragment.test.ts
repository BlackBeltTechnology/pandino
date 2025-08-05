import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OSGiFramework } from '../framework';
import { LogLevel } from '~/services/log-service/interfaces';
import type { BundleModule } from '~/types/bundle-metadata';
import type { BundleContext } from '../interfaces';
import { ComponentResourceProcessor } from '~/services/declarative-services/component-resource-processor';

describe('Fragment Feature', () => {
  let framework: OSGiFramework;
  let systemContext: BundleContext;

  beforeEach(async () => {
    framework = new OSGiFramework(LogLevel.ERROR);
    await framework.start();
    systemContext = framework.getBundleContext();

    systemContext.registerService('FragmentResourceProcessor', new ComponentResourceProcessor());
  });

  afterEach(async () => {
    await framework.stop();
  });

  function createHostBundleModule(
    symbolicName: string = 'com.example.host',
    version: string = '1.0.0',
    components: any[] = [],
  ): Promise<BundleModule> {
    return Promise.resolve({
      default: {
        headers: {
          bundleSymbolicName: symbolicName,
          bundleVersion: version,
        },
        activator: {
          start: async () => {},
          stop: async () => {},
        },
        components,
      },
    });
  }

  function createFragmentBundleModule(
    symbolicName: string = 'com.example.fragment',
    version: string = '1.0.0',
    hostSymbolicName: string = 'com.example.host',
    hostVersionRange: string | null = null,
    components: any[] = [],
  ): Promise<BundleModule> {
    let fragmentHost = hostSymbolicName;
    if (hostVersionRange) {
      fragmentHost += `;bundle-version="${hostVersionRange}"`;
    }

    return Promise.resolve({
      default: {
        headers: {
          bundleSymbolicName: symbolicName,
          bundleVersion: version,
          fragmentHost,
        },
        activator: {
          start: async () => {},
          stop: async () => {},
        },
        components,
      },
    });
  }

  it('should identify a bundle as a fragment', async () => {
    // Install a fragment bundle
    const fragmentBundle = await systemContext.installBundle(createFragmentBundleModule());

    // Check if the bundle is identified as a fragment
    expect(framework.isFragment(fragmentBundle)).toBe(true);
  });

  it('should not identify a regular bundle as a fragment', async () => {
    // Install a regular bundle
    const hostBundle = await systemContext.installBundle(createHostBundleModule());

    // Check if the bundle is identified as a fragment
    expect(framework.isFragment(hostBundle)).toBe(false);
  });

  it('should find the host bundle for a fragment', async () => {
    // Install a host bundle
    const hostBundle = await systemContext.installBundle(createHostBundleModule('com.example.host', '1.0.0'));

    // Install a fragment bundle
    const fragmentBundle = await systemContext.installBundle(
      createFragmentBundleModule('com.example.fragment', '1.0.0', 'com.example.host'),
    );

    // Get the fragments for the host
    const fragments = framework.getFragmentsForHost(hostBundle);

    // Check if the fragment is in the host's fragments
    expect(fragments).toHaveLength(1);
    expect(fragments[0].getBundleId()).toBe(fragmentBundle.getBundleId());
  });

  it('should match a fragment to a host with a specific version', async () => {
    // Install host bundles with different versions
    const hostBundle1 = await systemContext.installBundle(createHostBundleModule('com.example.host', '1.0.0'));
    const hostBundle2 = await systemContext.installBundle(createHostBundleModule('com.example.host', '2.0.0'));

    // Install a fragment bundle that targets version 2.0.0
    const fragmentBundle = await systemContext.installBundle(
      createFragmentBundleModule('com.example.fragment', '1.0.0', 'com.example.host', '2.0.0'),
    );

    // Get the fragments for each host
    const fragments1 = framework.getFragmentsForHost(hostBundle1);
    const fragments2 = framework.getFragmentsForHost(hostBundle2);

    // Check if the fragment is attached to the correct host
    expect(fragments1).toHaveLength(0);
    expect(fragments2).toHaveLength(1);
    expect(fragments2[0].getBundleId()).toBe(fragmentBundle.getBundleId());
  });

  it('should match a fragment to a host with a version range', async () => {
    // Install host bundles with different versions
    const hostBundle1 = await systemContext.installBundle(createHostBundleModule('com.example.host', '1.0.0'));
    const hostBundle2 = await systemContext.installBundle(createHostBundleModule('com.example.host', '1.5.0'));
    const hostBundle3 = await systemContext.installBundle(createHostBundleModule('com.example.host', '2.0.0'));

    // Install a fragment bundle that targets versions 1.0.0 to 2.0.0 (exclusive)
    const fragmentBundle = await systemContext.installBundle(
      createFragmentBundleModule('com.example.fragment', '1.0.0', 'com.example.host', '[1.0.0,2.0.0)'),
    );

    // Get the fragments for each host
    const fragments1 = framework.getFragmentsForHost(hostBundle1);
    const fragments2 = framework.getFragmentsForHost(hostBundle2);
    const fragments3 = framework.getFragmentsForHost(hostBundle3);

    // Check if the fragment is attached to the correct hosts
    expect(fragments1).toHaveLength(1);
    expect(fragments2).toHaveLength(0);
    expect(fragments3).toHaveLength(0);
    expect(fragments1[0].getBundleId()).toBe(fragmentBundle.getBundleId());
  });

  it('should merge fragment components with host components', async () => {
    // Create a component for the host
    const hostComponent = { name: 'hostComponent' };

    // Create a component for the fragment
    const fragmentComponent = { name: 'fragmentComponent' };

    // Install a host bundle with a component
    const hostBundle = await systemContext.installBundle(
      createHostBundleModule('com.example.host', '1.0.0', [hostComponent]),
    );

    // Install a fragment bundle with a component
    await systemContext.installBundle(
      createFragmentBundleModule('com.example.fragment', '1.0.0', 'com.example.host', null, [fragmentComponent]),
    );

    // Start the host bundle to ensure the fragment is attached
    await hostBundle.start();

    // Get the host bundle module
    const hostBundleModule = hostBundle.getBundleModule();

    // Check if the fragment component was merged with the host components
    expect(hostBundleModule?.default.components).toHaveLength(2);
    expect(hostBundleModule?.default.components![0]).toBe(hostComponent);
    expect(hostBundleModule?.default.components![1]).toBe(fragmentComponent);
  });

  it('should not allow starting a fragment directly', async () => {
    // Install a host bundle
    await systemContext.installBundle(createHostBundleModule());

    // Install a fragment bundle
    const fragmentBundle = await systemContext.installBundle(createFragmentBundleModule());

    // Try to start the fragment bundle
    await expect(fragmentBundle.start()).rejects.toThrow(/cannot be started directly/);
  });

  it('should attach fragments when the host is started', async () => {
    // Install a host bundle
    const hostBundle = await systemContext.installBundle(createHostBundleModule());

    // Install a fragment bundle
    const fragmentBundle = await systemContext.installBundle(createFragmentBundleModule());

    // Start the host bundle
    await hostBundle.start();

    // Check if the fragment is attached to the host
    const fragments = framework.getFragmentsForHost(hostBundle);
    expect(fragments).toHaveLength(1);
    expect(fragments[0].getBundleId()).toBe(fragmentBundle.getBundleId());
  });

  it('should detach fragments when the host is stopped', async () => {
    // Install a host bundle
    const hostBundle = await systemContext.installBundle(createHostBundleModule());

    // Install a fragment bundle
    await systemContext.installBundle(createFragmentBundleModule());

    // Start the host bundle
    await hostBundle.start();

    // Check if the fragment is attached to the host
    let fragments = framework.getFragmentsForHost(hostBundle);
    expect(fragments).toHaveLength(1);

    // Stop the host bundle
    await hostBundle.stop();

    // Check if the fragment is detached from the host
    fragments = framework.getFragmentsForHost(hostBundle);
    expect(fragments).toHaveLength(0);
  });
});
