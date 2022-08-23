import { SemVer } from '@pandino/pandino-api';
import { compare, lte, equal, gte } from '../semver-lite/src';

export class SemVerImpl implements SemVer {
  constructor(private readonly version: string) {}

  toString(): string {
    return this.version.toString();
  }

  compare(other: SemVer): number {
    return compare(this.version, other.toString());
  }

  equal(other: string): boolean {
    return equal(this.version, other);
  }

  lte(other: string): boolean {
    return lte(this.version, other);
  }

  gte(other: string): boolean {
    return gte(this.version, other);
  }

  neq(other: string): boolean {
    return !this.equal(other);
  }
}
