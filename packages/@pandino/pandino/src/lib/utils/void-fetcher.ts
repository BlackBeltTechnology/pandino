import type { ManifestFetcher } from '@pandino/pandino-api';

/* istanbul ignore file */
export class VoidFetcher implements ManifestFetcher {
  fetch(deploymentRoot: string, uri: string): Promise<any> {
    return Promise.reject(`Will not fetch ${uri}! Please provide explicit Fetcher for Pandino!`);
  }
}
