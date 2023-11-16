import type { ServiceEvent, ServiceProperties } from '@pandino/pandino-api';

export interface ServiceRegistryCallbacks {
  serviceChanged(event: ServiceEvent, oldProps?: ServiceProperties): void;
}
