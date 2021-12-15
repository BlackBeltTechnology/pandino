import { Fetcher } from '@pandino/pandino-api';

export const pandinoFetcher: Fetcher = async (uri: string): Promise<any> => {
  const response = await fetch(uri);
  return response.json();
};
