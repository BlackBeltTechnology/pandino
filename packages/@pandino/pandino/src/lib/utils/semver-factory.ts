import { SemVer } from 'semver';
import { SemverFactory } from '@pandino/pandino-api';

export class SemverFactoryImpl implements SemverFactory {
  build(version: string): SemVer {
    return new SemVer(version);
  }
}
