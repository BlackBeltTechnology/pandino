import { SemVer } from 'semver';
import { SemverFactory } from '@pandino/pandino-api';

export const semverFactory: SemverFactory = (version: string) => new SemVer(version);
