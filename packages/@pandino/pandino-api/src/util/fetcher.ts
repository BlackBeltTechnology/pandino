export interface Fetcher {
  fetch(uri: string): Promise<any>;
}
