import { BUNDLE_NAMESPACE, BUNDLE_VERSION_ATTRIBUTE, SemVer } from '@pandino/pandino-api';
import { BundleCapabilityImpl } from '../framework/wiring/bundle-capability-impl';
import { isAnyMissing, isAllPresent } from './helpers';
import { Capability } from '../framework/resource/capability';
import { SemVerImpl } from './semver-impl';

export function candidateComparator(cap1: Capability, cap2: Capability): number {
  let c = 0;

  let bcap1: BundleCapabilityImpl = null;
  let bcap2: BundleCapabilityImpl = null;

  if (cap1 instanceof BundleCapabilityImpl && cap2 instanceof BundleCapabilityImpl) {
    bcap1 = cap1 as BundleCapabilityImpl;
    bcap2 = cap2 as BundleCapabilityImpl;

    if (isAllPresent(bcap1.getRevision().getWiring()) && isAnyMissing(bcap2.getRevision().getWiring())) {
      c = -1;
    } else if (isAnyMissing(bcap1.getRevision().getWiring()) && isAllPresent(bcap2.getRevision().getWiring())) {
      c = 1;
    }
  }

  if (c === 0 && cap1.getNamespace() === BUNDLE_NAMESPACE) {
    c = cap1.getAttributes()[BUNDLE_NAMESPACE].localeCompare(cap2.getAttributes()[BUNDLE_NAMESPACE]);

    if (c === 0) {
      const v1: SemVer = !cap1.getAttributes().hasOwnProperty(BUNDLE_VERSION_ATTRIBUTE)
        ? new SemVerImpl('0.0.0')
        : (cap1.getAttributes()[BUNDLE_VERSION_ATTRIBUTE] as SemVer);
      const v2: SemVer = !cap2.getAttributes().hasOwnProperty(BUNDLE_VERSION_ATTRIBUTE)
        ? new SemVerImpl('0.0.0')
        : (cap2.getAttributes()[BUNDLE_VERSION_ATTRIBUTE] as SemVer);
      c = v2.compare(v1);
    }
  }

  if (c === 0 && isAllPresent(bcap1) && isAllPresent(bcap2)) {
    if (bcap1!.getRevision().getBundle().getBundleId() < bcap2!.getRevision().getBundle().getBundleId()) {
      c = -1;
    } else if (bcap1!.getRevision().getBundle().getBundleId() > bcap2!.getRevision().getBundle().getBundleId()) {
      c = 1;
    }
  }

  return c;
}
