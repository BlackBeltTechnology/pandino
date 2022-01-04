import { SERVICE_ID, SERVICE_RANKING } from '../pandino-constants';

export interface ServiceProperties {
  [SERVICE_ID]?: number;
  [SERVICE_RANKING]?: string;
  [key: string]: any;
}
