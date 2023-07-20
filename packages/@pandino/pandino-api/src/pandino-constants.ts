/**
 * PANDINO
 */
export const DEPLOYMENT_ROOT_PROP = 'pandino.deployment.root';
export const LOG_LEVEL_PROP = 'pandino.log.level';
export const LOG_LOGGER_PROP = 'pandino.log.logger';
export const PANDINO_BUNDLE_IMPORTER_PROP = 'pandino.bundle.importer';
export const PANDINO_MANIFEST_FETCHER_PROP = 'pandino.manifest.fetcher';
export const PANDINO_ACTIVATOR_RESOLVERS = 'pandino.activator.resolvers';
export const BUNDLE_NAMESPACE = 'pandino.wiring.bundle';
export const IDENTITY_NAMESPACE = 'pandino.identity';
export const TYPE_BUNDLE = 'pandino.bundle';
export const TYPE_FRAGMENT = 'pandino.fragment';
export const SYSTEMBUNDLE_ACTIVATORS_PROP = 'pandino.systembundle.activators';
export const PANDINO_VERSION_PROPERTY = 'pandino.version';
export const PACKAGE_NAMESPACE = 'pandino.wiring.package';
export const HOST_NAMESPACE = 'pandino.wiring.host';

/**
 * Location identifier of the Pandino <i>system bundle </i>, which is defined to be &quot;System Bundle&quot;.
 */
export const SYSTEM_BUNDLE_LOCATION = 'System Bundle';

/**
 * Manifest header identifying the bundle's name.
 */
export const BUNDLE_NAME = 'Bundle-Name';

/**
 * Manifest header containing a brief description of the bundle's functionality.
 */
export const BUNDLE_DESCRIPTION = 'Bundle-Description';

/**
 * Manifest header identifying the bundle's vendor.
 */
export const BUNDLE_VENDOR = 'Bundle-Vendor';

/**
 * Manifest header identifying the bundle's version.
 *
 * (Required attribute)
 */
export const BUNDLE_VERSION = 'Bundle-Version';

/**
 * Manifest header identifying the bundle's type.
 *
 * It can be any string, and {@code ActivatorResolver}s can be registered for it.
 *
 * Pandino comes with `esm` support built-in.
 *
 * Warning! Given that UMD modules are loaded onto the `window`, Pandino cannot guarantee that they cannot be tempered
 * with. Re-loading the same bundle multiple times may cause issues.
 */
export const BUNDLE_TYPE = 'Bundle-Type';

/**
 * Manifest header identifying the bundle's UMD name.
 *
 * If the Bundle's type is `umd` then this header MUST be present, and should refer to whatever name the module has been
 * exported on.
 */
export const BUNDLE_UMD_NAME = 'Bundle-UMD-Name';

/**
 * If the corresponding value is a path string, then the value <b>MUST</b> be a relative path calculated from the
 * {@link DEPLOYMENT_ROOT_PROP}'s value!
 *
 * (Required attribute)
 */
export const BUNDLE_ACTIVATOR = 'Bundle-Activator';

/**
 * Manifest header identifying the bundle's activation policy.
 *
 * (Not yet implemented)
 */
export const BUNDLE_ACTIVATIONPOLICY = 'Bundle-ActivationPolicy';

/**
 * Manifest header identifying the bundle's symbolic name.
 *
 * (Required attribute)
 */
export const BUNDLE_SYMBOLICNAME = 'Bundle-SymbolicName';

/**
 * Manifest header identifying the bundle manifest version. A bundle manifest may express the version of the syntax in
 * which it is written by specifying a bundle manifest version.
 *
 * (Required attribute)
 */
export const BUNDLE_MANIFESTVERSION = 'Bundle-ManifestVersion';

/**
 * Manifest header identifying the bundle's copyright information.
 */
export const BUNDLE_COPYRIGHT = 'Bundle-Copyright';

/**
 * Manifest header identifying the symbolic names of other bundles required by the bundle.
 *
 * (Not yet implemented)
 */
export const REQUIRE_BUNDLE = 'Require-Bundle';

/**
 * Manifest header identifying the capabilities that the bundle offers to provide to other bundles.
 */
export const PROVIDE_CAPABILITY = 'Provide-Capability';

/**
 * Manifest header identifying the capabilities on which the bundle depends.
 */
export const REQUIRE_CAPABILITY = 'Require-Capability';

/**
 * Manifest header identifying the path to a LICENSE file (if any).
 */
export const BUNDLE_LICENSE = 'Bundle-License';

/**
 * Manifest header directive value identifying an optional resolution type. An optional resolution type indicates that
 * the import, require bundle or require capability is optional and the bundle may be resolved without the import,
 * require bundle or require capability being resolved. If the import, require bundle or require capability is not
 * resolved when the bundle is resolved, the import, require bundle or require capability may not be resolved until the
 * bundle is refreshed.
 *
 * (Not yet implemented)
 */
export const RESOLUTION_OPTIONAL = 'optional';

export const SYSTEM_BUNDLE_SYMBOLICNAME = '@pandino/pandino';

/**
 * Bundle activation policy declaring the bundle must be activated when the first class load is made from the bundle.
 *
 * <p>
 * A bundle with the lazy activation policy that is started with the "START_ACTIVATION_POLICY" option will wait in the
 * "STARTING" state until the first class load from the bundle occurs. The bundle will then be activated before the
 * class is returned to the requester.
 *
 * (Not yet implemented)
 */
export const ACTIVATION_LAZY = 'lazy';

/**
 * Manifest header identifying the symbolic name of another bundle for which that the bundle is a fragment.
 *
 * (Not yet implemented)
 */
export const FRAGMENT_HOST = 'Fragment-Host';

export const FRAMEWORK_LOGGER = '@pandino/pandino/Logger';

export const FRAMEWORK_MANIFEST_FETCHER = '@pandino/pandino/ManifestFetcher';

export const FRAMEWORK_BUNDLE_IMPORTER = '@pandino/pandino/BundleImporter';

export const FRAMEWORK_EVALUATE_FILTER = '@pandino/pandino/evaluateFilter';

export const FRAMEWORK_SEMVER_FACTORY = '@pandino/pandino/SemVerFactory';

export const FRAMEWORK_SERVICE_UTILS = '@pandino/pandino/ServiceUtils';

export const FRAMEWORK_UUID = '@pandino/pandino/uuid';

export const FRAMEWORK_VERSION = '@pandino/pandino/version';

export const FRAMEWORK_VENDOR = '@pandino/pandino/vendor';

export const SERVICE_DEFAULT_RANK = 0;

export const SERVICE_EVENT_INTERFACE_KEY = '@pandino/pandino/service/ServiceEvent';

export const SERVICE_LISTENER_INTERFACE_KEY = '@pandino/pandino/service/ServiceListener';

/**
 * Service property identifying a service's registration number. The value of this property must be of type
 * {@code number}.
 *
 * <p>
 * The value of this property is assigned by the Framework when a service is registered. The Framework assigns a unique,
 * non-negative value that is larger than all previously assigned values since the Framework was started. These values
 * are NOT persistent across restarts of the Framework.
 */
export const SERVICE_ID = 'service.id';

/**
 * Service property identifying a service's ranking number.
 *
 * <p>
 * This property may be supplied in the {@code properties Record} object passed to the
 * {@code BundleContext.registerService} method. The value of this property must be of type {@code number}.
 *
 * <p>
 * The service ranking is used by the Framework to determine the <i>natural order</i> of services, see
 * {@link ServiceReference#compareTo(Object)}, and the <i>default</i> service to be returned from a call to the
 * {@link BundleContext#getServiceReference(Class)} or
 * {@link BundleContext#getServiceReference(String)} method.
 *
 * <p>
 * The default ranking is zero (0). A service with a ranking of {@code Number.MAX_VALUE} is very likely to be returned
 * as the default service, whereas a service with a ranking of {@code Number.MIN_VALUE} is very unlikely to be
 * returned.
 */
export const SERVICE_RANKING = 'service.ranking';

/**
 * Service property identifying the {@link Bundle#getBundleId() bundle id} of the {@link ServiceReference#getBundle()
 * bundle registering the service}.
 *
 * <p>
 * This property is set by the Framework when a service is registered. The value of this property must be of type
 * {@code number}.
 */
export const SERVICE_BUNDLEID = 'service.bundleid';

/**
 * Service property identifying a service's description.
 */
export const SERVICE_DESCRIPTION = 'service.description';

export type SERVICE_FACTORY_TYPE = 'bundle' | 'prototype';

/**
 * Service property identifying a service's scope.
 *
 * <p>
 * This property is set by the Framework when a service is registered. If the registered object implements
 * {@link PrototypeServiceFactory}, then the value of this service property will be {@link #SCOPE_PROTOTYPE}. Otherwise,
 * if the registered object implements {@link ServiceFactory}, then the value of this service property will be
 * {@link #SCOPE_BUNDLE}. Otherwise, the value of this service property will be {@link #SCOPE_SINGLETON}.
 */
export const SERVICE_SCOPE = 'service.scope';

export const SERVICE_PID = 'service.pid';

/**
 * Service scope is singleton. All bundles using the service receive the same service object.
 */
export const SCOPE_SINGLETON = 'singleton';

/**
 * Service scope is bundle. Each bundle using the service receives a customized service object.
 */
export const SCOPE_BUNDLE = 'bundle';

/**
 * Service scope is prototype. Each bundle using the service receives either a customized service object or can request
 * multiple customized service objects.
 */
export const SCOPE_PROTOTYPE = 'prototype';

/**
 * Service property identifying all of the class names under which a service was registered in the Framework. The value
 * of this property must be of type {@code string | string[]}.
 *
 * <p>
 * This property is set by the Framework when a service is registered.
 */
export const OBJECTCLASS = 'objectClass';

/**
 * Manifest header attribute identifying a range of versions for a bundle specified in the {@code Require-Bundle} or
 * {@code Fragment-Host} manifest headers. The default value is {@code 0.0.0}.
 */
export const BUNDLE_VERSION_ATTRIBUTE = 'bundle-version';

/**
 * Manifest header attribute identifying the version of a package specified in the Export-Package or Import-Package
 * manifest header.
 */
export const VERSION_ATTRIBUTE = 'version';

/**
 * The capability attribute identifying the {@code SemVer} of the resource if one is specified or {@code 0.0.0} if not
 * specified. The value of this attribute must be of type {@code SemVer}.
 */
export const CAPABILITY_VERSION_ATTRIBUTE = 'version';

/**
 * The capability attribute that contains a human readable copyright notice for the resource. See the
 * {@code Bundle-Copyright} manifest header.
 */
export const CAPABILITY_COPYRIGHT_ATTRIBUTE = 'copyright';

/**
 * The attribute value that contains tags for the resource. A tag is used to identify an aspect of the resource that is
 * not otherwise expressed by the capabilities of the resource. The value of this attribute must be of type
 * {@code Array<string>}.
 */
export const CAPABILITY_TAGS_ATTRIBUTE = 'tags';

/**
 * The capability attribute identifying the resource type. If the resource has no type then the value
 * {@link #TYPE_UNKNOWN unknown} must be used for the attribute.
 */
export const CAPABILITY_TYPE_ATTRIBUTE = 'type';

/**
 * The capability attribute that contains a human readable description for the resource. See the
 * {@code Bundle-Description} manifest header.
 */
export const CAPABILITY_DESCRIPTION_ATTRIBUTE = 'description';

/**
 * Manifest header directive identifying a list of packages that an exported package or provided capability uses.
 */
export const USES_DIRECTIVE = 'uses';

/**
 * Manifest header directive identifying names of matching attributes which must be specified by matching Import-Package
 * statements in the Export-Package manifest header.
 */
export const MANDATORY_DIRECTIVE = 'mandatory';

/**
 * Manifest header directive identifying the capability filter specified in the Require-Capability manifest header.
 */
export const FILTER_DIRECTIVE = 'filter';

/**
 * Manifest header directive identifying a list of classes to include in the exported package.
 *
 * <p>
 * This directive is used by the Export-Package manifest header to identify a list of classes of the specified package
 * which must be allowed to be exported.
 */
export const INCLUDE_DIRECTIVE = 'include';

/**
 * Manifest header directive identifying a list of classes to exclude in the exported package..
 * <p>
 * This directive is used by the Export-Package manifest header to identify a list of classes of the specified package
 * which must not be allowed to be exported.
 */
export const EXCLUDE_DIRECTIVE = 'exclude';

/**
 * Manifest header directive identifying the resolution type in the Import-Package, Require-Bundle or Require-Capability
 * manifest header. The default value is {@link #RESOLUTION_MANDATORY mandatory}.
 */
export const RESOLUTION_DIRECTIVE = 'resolution';

/**
 * Manifest header directive identifying whether a bundle is a singleton. The default value is {@code false}.
 */
export const SINGLETON_DIRECTIVE = 'singleton';

/**
 * The capability directive identifying if the resource is a singleton. A {@code string} value of &quot;true&quot;
 * indicates the resource is a singleton; any other value or {@code undefined} indicates the resource is not a
 * singleton.
 */
export const CAPABILITY_SINGLETON_DIRECTIVE = 'singleton';

/**
 * Manifest header directive identifying the effective time of the provided capability. The default value is
 * {@link #EFFECTIVE_RESOLVE resolve}.
 */
export const EFFECTIVE_DIRECTIVE = 'effective';

/**
 * Manifest header directive value identifying a capability that is effective at resolve time. Capabilities with an
 * effective time of resolve are the only capabilities which are processed by the resolver.
 */
export const EFFECTIVE_RESOLVE = 'resolve';

/**
 * The requirement directive used to specify a capability filter. This filter is used to match against a capability's
 * attributes.
 */
export const REQUIREMENT_FILTER_DIRECTIVE = 'filter';

/**
 * The requirement directive used to specify the cardinality for a requirement. The default value is {@link #CARDINALITY_SINGLE single}.
 */
export const REQUIREMENT_CARDINALITY_DIRECTIVE = 'cardinality';
