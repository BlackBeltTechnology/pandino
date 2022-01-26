/**
 * The name of the framework context property defining the location for the configuration files (value is
 * "pandino.cm.dir").
 *
 * @see #start(BundleContext)
 */
export const CM_CONFIG_DIR = 'felix.cm.dir';

/**
 * The name of the framework context property defining the persistence manager to be used. If this property is not set
 * or empty, the built-in persistence manager (named file) is used. If it is specified it refers to the name property of
 * a persistence manager and that persistence manager needs to be registered.
 *
 * @see #start(BundleContext)
 */
export const CM_CONFIG_PM = 'pandino.cm.pm';
