import { SemVer } from '@pandino/pandino-api';

export function createVersionMock(version: string): any {
  return {
    __version: version,
    toString: () => version,
    compare: (other: SemVer) => {
      return other.toString() === version ? 0 : -1; // this is a super simplified mock, please adjust when needed
    },
  };
}
