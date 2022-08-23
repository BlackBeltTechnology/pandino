import { SemverVersion } from './semver';

export const version = '0.0.5';

export const validate = (version: any) => {
  return SemverVersion.validate(version);
};

export const compare = (a: any, b: any, needCompareBuildVersion?: boolean) => {
  return new SemverVersion(a).compare(new SemverVersion(b), needCompareBuildVersion);
};

export const instance = (version: any) => {
  return new SemverVersion(version);
};

export const compareMainVersion = (a: any, b: any) => {
  return new SemverVersion(a).compareMainVersion(new SemverVersion(b));
};

export const gt = (a: any, b: any, needCompareBuildVersion?: boolean) => {
  const result = compare(a, b, needCompareBuildVersion);
  return result === 1;
};

export const gte = (a: any, b: any, needCompareBuildVersion?: any) => {
  const result = compare(a, b, needCompareBuildVersion);
  return result === 1 || result === 0;
};

export const lt = (a: any, b: any, needCompareBuildVersion?: boolean) => {
  const result = compare(a, b, needCompareBuildVersion);
  return result === -1;
};

export const lte = (a: any, b: any, needCompareBuildVersion?: boolean) => {
  const result = compare(a, b, needCompareBuildVersion);
  return result === -1 || result === 0;
};

export const equal = (a: any, b: any, needCompareBuildVersion?: boolean) => {
  const result = compare(a, b, needCompareBuildVersion);
  return result === 0;
};

export const equalMain = (a: any, b: any) => {
  return new SemverVersion(a).mainVersion === new SemverVersion(b).mainVersion;
};

// 主版本转成数字类型方便比较
export const mainVersionToNumeric = (version: any, digit = 6) => {
  const semverVersion = new SemverVersion(version);
  return semverVersion.mainVersionToNumeric(digit);
};
