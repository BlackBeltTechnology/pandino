import type { Bundle, FragmentResourceProcessor } from '~/framework/interfaces';

export class ResourceMapProcessor implements FragmentResourceProcessor {
  getResourceType(): string {
    return 'resources';
  }
  processResources(host: Bundle, fragment: Bundle): boolean {
    const hostModule = host.getBundleModule();
    const fragmentModule = fragment.getBundleModule();

    if (!hostModule || !fragmentModule) {
      return false;
    }

    if (!fragmentModule.default?.resources || Object.keys(fragmentModule.default.resources).length === 0) {
      return false;
    }

    if (!hostModule.default.resources) {
      hostModule.default.resources = {};
    }

    const fragmentResources = fragmentModule.default.resources;
    Object.assign(hostModule.default.resources, fragmentResources);

    return true;
  }
}
