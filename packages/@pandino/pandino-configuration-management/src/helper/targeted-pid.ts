import { SemverFactory, ServiceReference } from '@pandino/pandino-api';
import { SemVer } from 'semver';

import { Activator } from '../activator';

export class TargetedPID {
  private readonly rawPid: string;
  private readonly servicePid: string;
  private readonly symbolicName?: string;
  private readonly version?: SemVer;
  private readonly location?: string;
  private readonly bindingLevel: number;

  constructor(rawPid: string, semVerFactory: SemverFactory) {
    this.rawPid = rawPid;

    if (rawPid.indexOf('|') < 0) {
      this.servicePid = rawPid;
      this.bindingLevel = 0;
    } else {
      let start = 0;
      let end = rawPid.indexOf('|');
      this.servicePid = rawPid.substring(start, end);

      start = end + 1;
      end = rawPid.indexOf('|', start);
      if (end >= 0) {
        this.symbolicName = rawPid.substring(start, end);
        start = end + 1;
        end = rawPid.indexOf('|', start);
        if (end >= 0) {
          this.version = semVerFactory.build(rawPid.substring(start, end));
          this.location = rawPid.substring(end + 1);
          this.bindingLevel = 3;
        } else {
          this.version = semVerFactory.build(rawPid.substring(start));
          this.bindingLevel = 2;
        }
      } else {
        this.symbolicName = rawPid.substring(start);
        this.bindingLevel = 1;
      }
    }
  }

  matchesTarget(reference: ServiceReference<any>): boolean {
    let serviceBundle = reference.getBundle();
    if (!serviceBundle) {
      return false;
    }

    if (!this.symbolicName) {
      return true;
    }

    if (this.symbolicName !== serviceBundle.getSymbolicName()) {
      return false;
    }

    if (!this.version) {
      return true;
    }

    if (serviceBundle.getVersion().compare(this.version) !== 0) {
      return false;
    }

    return !this.location || this.location === Activator.getLocation(serviceBundle);
  }

  /**
   * Gets the raw PID with which this instance has been created.
   * <p>
   * If an actual service PID contains pipe symbols that PID might be considered being targeted PID without it actually
   * being one. This method provides access to the raw PID to allow for such services to be configured.
   */
  getRawPid(): string {
    return this.rawPid;
  }

  /**
   * Returns the service PID of this targeted PID which basically is the targeted PID without the targeting information.
   */
  getServicePid(): string {
    return this.servicePid;
  }

  /**
   * Returns <code>true</code> if this targeted PID binds stronger than the <code>other</code> {@link TargetedPID}.
   * <p>
   * This method assumes both targeted PIDs have already been checked for suitability for the bundle encoded in the
   * targetting.
   */
  bindsStronger(other: TargetedPID): boolean {
    return this.bindingLevel > other.bindingLevel;
  }

  equals(obj: any): boolean {
    if (obj === null || obj === undefined) {
      return false;
    } else if (obj === this) {
      return true;
    }

    if (obj instanceof TargetedPID) {
      return this.rawPid === (obj as TargetedPID).rawPid;
    }

    return false;
  }

  toString(): string {
    return this.rawPid;
  }
}
