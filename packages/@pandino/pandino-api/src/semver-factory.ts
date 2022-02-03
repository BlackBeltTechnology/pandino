import { SemVer } from 'semver';

export type SemverFactory = (version: string) => SemVer;
