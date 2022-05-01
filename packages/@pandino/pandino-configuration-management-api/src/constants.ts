/**
 * Configuration property naming the location of the bundle that is associated with a Configuration object.
 *
 * This property can be searched for but must not appear in the configuration dictionary for security reason.
 *
 * The property's value is of type {@code string}.
 */
export const SERVICE_BUNDLELOCATION = 'service.bundleLocation';

/**
 * The name of the implementation capability for the Configuration Admin specification
 */
export const CONFIGURATION_ADMIN_IMPLEMENTATION = 'pandino.cm';

/**
 * The version of the implementation capability for the Configuration Admin specification
 */
export const CONFIGURATION_ADMIN_SPECIFICATION_VERSION = '1.0.0';

export const CONFIG_ADMIN_INTERFACE_KEY = '@pandino/pandino-configuration-management/ConfigurationAdmin';
export const MANAGED_SERVICE_INTERFACE_KEY = '@pandino/pandino-configuration-management/ManagedService';
export const CONFIGURATION_LISTENER_INTERFACE_KEY = '@pandino/pandino-configuration-management/ConfigurationListener';

export const SERVICE_PID = 'service.pid';
