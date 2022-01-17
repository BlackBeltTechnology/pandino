import {
  SERVICE_BUNDLEID,
  SERVICE_DESCRIPTION,
  SERVICE_ID,
  SERVICE_RANKING,
  SERVICE_SCOPE,
} from '@pandino/pandino-api';

/**
 * The original PegPARSE built Filter cannot handle dots (.) Needs to be fixed later...
 */

export const replaceMap: Map<string, string> = new Map<string, string>([
  [SERVICE_ID, 'serviceId'],
  [SERVICE_RANKING, 'serviceRanking'],
  [SERVICE_BUNDLEID, 'serviceBundleid'],
  [SERVICE_SCOPE, 'serviceScope'],
  [SERVICE_DESCRIPTION, 'serviceDescription'],
]);

export const inverseMap: Map<string, string> = new Map<string, string>([
  ['serviceId', SERVICE_ID],
  ['serviceRanking', SERVICE_RANKING],
  ['serviceBundleid', SERVICE_BUNDLEID],
  ['serviceScope', SERVICE_SCOPE],
  ['serviceDescription', SERVICE_DESCRIPTION],
]);
