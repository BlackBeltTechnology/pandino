import { SemVer, SemverFactory } from '@pandino/pandino-api';
import { SemVerImpl } from './semver-impl';

export class SemverFactoryImpl implements SemverFactory {
  build(version: string): SemVer {
    return new SemVerImpl(version);
  }
}
