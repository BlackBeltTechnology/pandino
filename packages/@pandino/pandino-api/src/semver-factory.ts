import { SemVer } from './semver';

export interface SemverFactory {
  build(version: string): SemVer;
}
