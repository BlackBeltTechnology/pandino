import { Configuration } from './configuration';

/**
 * Service for administering configuration data.
 *
 * The main purpose of this interface is to store bundle configuration data persistently. This information is
 * represented in Configuration objects. The actual configuration data is a Dictionary of properties inside a
 * Configuration object.
 *
 * Bundles that require configuration should register a Managed Service in the service registry. A registration property
 * named service.pid (persistent identifier or PID) must be used to identify this Managed Service to the Configuration
 * Admin service.
 *
 * When the ConfigurationAdmin detects the registration of a Managed Service, it checks its persistent storage for a
 * configuration object whose service.pid property matches the PID service property ( service.pid) of the Managed
 * Service. If found, it calls ManagedService.updated(Dictionary) method with the new properties. The implementation of
 * a Configuration Admin service must run these call-backs asynchronously to allow proper synchronization.
 *
 * If target's bundle location matches the configuration location it is always updated.
 */
export interface ConfigurationAdmin {
  /**
   * Get an existing Configuration object from the persistent store, or create a new Configuration object.
   *
   * If a Configuration with this PID already exists in Configuration Admin service return it. The location parameter is
   * ignored in this case though it is still used for a security check.
   *
   * Else, return a new Configuration object. This new object is bound to the location and the properties are set to
   * undefined. If the location parameter is undefined, it will be set when a Managed Service with the corresponding PID
   * is registered for the first time. If the location starts with ? then the configuration is bound to all targets that
   * are registered with the corresponding PID.
   *
   * @param {string} pid
   * @param {string} [location]
   */
  getConfiguration(pid: string, location?: string): Configuration;

  /**
   * List the current Configuration objects which match the filter.
   *
   * Only Configuration objects with non- null properties are considered current. That is, Configuration.getProperties()
   * is guaranteed not to return undefined for each of the returned Configuration objects.
   *
   * When there is no security on then all configurations can be returned.
   *
   * The syntax of the filter string is as defined in the {@code FilterApi} class. The filter can test any configuration
   * properties including the following:
   * - service.pid - the persistent identity
   * - service.bundleLocation - the bundle location
   *
   * The filter can also be undefined, meaning that all Configuration objects should be returned.
   *
   * @param {string} [filter]
   */
  listConfigurations(filter?: string): Configuration[];
}
