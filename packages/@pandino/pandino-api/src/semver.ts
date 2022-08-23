export interface SemVer {
  toString(): string;
  compare(other: SemVer): number;
  equal(other: string): boolean;
  lte(other: string): boolean;
  gte(other: string): boolean;
  neq(other: string): boolean;
}
