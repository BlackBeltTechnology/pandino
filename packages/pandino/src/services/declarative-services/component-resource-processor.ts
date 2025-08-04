import type { Bundle, FragmentResourceProcessor } from '~/framework/interfaces';

export class ComponentResourceProcessor implements FragmentResourceProcessor {
  getResourceType(): string {
    return 'components';
  }

  processResources(host: Bundle, fragment: Bundle): boolean {
    const hostModule = host.getBundleModule();
    const fragmentModule = fragment.getBundleModule();

    if (!hostModule || !fragmentModule) {
      return false;
    }

    if (
      !fragmentModule.default?.components ||
      !Array.isArray(fragmentModule.default.components) ||
      fragmentModule.default.components.length === 0
    ) {
      return false;
    }

    if (!hostModule.default.components) {
      hostModule.default.components = [];
    }

    const fragmentComponents = fragmentModule.default.components;
    hostModule.default.components.push(...fragmentComponents);

    return true;
  }
}
