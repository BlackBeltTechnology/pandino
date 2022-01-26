import { ServiceProperties, ServiceReference } from '@pandino/pandino-api';

/**
 * The configuration information for a ManagedService object. The Configuration Admin service uses this interface to
 * represent the configuration information for a ManagedService.
 *
 * A Configuration object contains a configuration dictionary and allows the properties to be updated via this object.
 * Bundles wishing to receive configuration dictionaries do not need to use this class - they register a ManagedService.
 * Only administrative bundles, and bundles wishing to update their own configurations need to use this class.
 *
 * The properties handled in this configuration have case sensitive strings as keys.
 *
 * A configuration can be bound to a specific bundle or to a region of bundles using the location. In its simplest form
 * the location is the location of the target bundle that registered a Managed Service. However, if the location starts
 * with ? then the location indicates multiple delivery. In such a case the configuration must be delivered to all
 * targets. The Configuration Admin must only update a target when the configuration location matches the location of
 * the target's bundle and a name that matches the configuration location. Bundles can always create, manipulate, and be
 * updated from configurations that have a location that matches their bundle location.
 *
 * If a configuration's location is null, it is not yet bound to a location. It will become bound to the location of the
 * first bundle that registers a ManagedService object with the corresponding PID.
 */
export interface Configuration {
  /**
   * Get the PID for this Configuration object.
   */
  getPid(): string;

  /**
   * Return the properties of this Configuration object. The ServiceProperties object returned is a private copy for the
   * caller and may be changed without influencing the stored configuration. The keys in the returned ServiceProperties
   * are case sensitive and are always of type string.
   *
   * If called just after the configuration is created and before update has been called, this method returns undefined.
   */
  getProperties(): ServiceProperties | undefined;

  /**
   * Return the processed properties of this Configuration object.
   *
   * The ServiceProperties object returned is a private copy for the caller and may be changed without influencing the
   * stored configuration. The keys in the returned dictionary are case sensitive and are always of type string.
   *
   * @param {ServiceReference<any>} serviceReference
   */
  getProcessedProperties(serviceReference: ServiceReference<any>): ServiceProperties | undefined;

  /**
   * Update the properties of this Configuration object.
   *
   * Stores the properties in persistent storage after adding or overwriting the following properties:
   * - "service.pid" : is set to be the PID of this configuration.
   *
   * These system properties are all of type string.
   *
   * If the corresponding Managed Service is registered, its updated method must be called asynchronously. Else, this
   * callback is delayed until aforementioned registration occurs.
   *
   * Also notifies all Configuration Listeners with an "UPDATED" event.
   * @param properties
   */
  update(properties?: ServiceProperties): void;

  /**
   * Delete this Configuration object.
   *
   * Removes this configuration object from the persistent store. Notify asynchronously the corresponding
   * Managed Service. A ManagedService object is notified by a call to its updated method with an undefined properties
   * argument.
   *
   * Also notifies all Configuration Listeners with a "DELETED" event.
   */
  delete(): void;

  /**
   * Bind this Configuration object to the specified location.
   *
   * If the location parameter is undefined then the Configuration object will not be bound to a location/region. It
   * will be set to the bundle's location before the first time a Managed Service/Managed Service Factory receives this
   * Configuration object via the updated method and before any plugins are called.
   *
   * The bundle location or region will be set persistently.
   *
   * If the location starts with ? then all targets registered with the given PID must be updated.
   *
   * If the location is changed then existing targets must be informed. If they can no longer see this configuration,
   * the configuration must be deleted or updated with null. If this configuration becomes visible then they must be
   * updated with this configuration.
   */
  setBundleLocation(location?: string): void;

  /**
   * Get the bundle location.
   *
   * Returns the bundle location or region to which this configuration is bound, or null if it is not yet bound to a
   * bundle location or region. If the location starts with ? then the configuration is delivered to all targets and not
   * restricted to a single bundle.
   */
  getBundleLocation(): string;

  /**
   * Equality is defined to have equal PIDs Two Configuration objects are equal when their PIDs are equal.
   *
   * @param {any} other
   */
  equals(other: any): boolean;
}
