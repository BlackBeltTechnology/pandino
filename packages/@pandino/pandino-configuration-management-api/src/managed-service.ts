import { ServiceProperties } from '@pandino/pandino-api';

/**
 * A service that can receive configuration data from a Configuration Admin service.
 *
 * A Managed Service is a service that needs configuration data. Such an object should be registered with the Framework
 * registry with the service.pid property set to some unique identifier called a PID.
 *
 * If the Configuration Admin service has a Configuration object corresponding to this PID, it will callback the
 * updated() method of the ManagedService object, passing the properties of that Configuration object.
 *
 * If it has no such Configuration object, then it calls back with a null properties argument. Registering a Managed
 * Service will always result in a callback to the updated() method provided the Configuration Admin service is, or
 * becomes active. This callback must always be done asynchronously.
 *
 * Else, every time that either of the updated() methods is called on that Configuration object, the
 * ManagedService.updated() method with the new properties is called. If the delete() method is called on that
 * Configuration object, ManagedService.updated() is called with a null for the properties parameter. All these
 * callbacks must be done asynchronously.
 */
export interface ManagedService {
  updated(properties: ServiceProperties): void;
}
