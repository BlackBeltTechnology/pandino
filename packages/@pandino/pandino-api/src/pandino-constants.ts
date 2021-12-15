/**
 * PANDINO
 */
export const LOG_LEVEL_PROP = 'pandino.log.level';
export const LOG_LOGGER_PROP = 'pandino.log.logger';
export const BUNDLE_NAMESPACE = 'pandino.wiring.bundle';
export const IDENTITY_NAMESPACE = 'pandino.identity';
export const TYPE_BUNDLE = 'pandino.bundle';
export const TYPE_FRAGMENT = 'pandino.fragment';
export const SYSTEMBUNDLE_ACTIVATORS_PROP = 'pandino.systembundle.activators';
export const PANDINO_VERSION_PROPERTY = 'pandino.version';
export const PACKAGE_NAMESPACE = 'pandino.wiring.package';
export const HOST_NAMESPACE = 'pandino.wiring.host';

/**
 * BUNDLE
 */
export const BUNDLE_NAME = 'Bundle-Name';
export const BUNDLE_DESCRIPTION = 'Bundle-Description';
export const BUNDLE_VENDOR = 'Bundle-Vendor';
export const BUNDLE_VERSION = 'Bundle-Version';
export const BUNDLE_ACTIVATOR = 'Bundle-Activator';
export const BUNDLE_ACTIVATIONPOLICY = 'Bundle-ActivationPolicy';
export const BUNDLE_SYMBOLICNAME = 'Bundle-SymbolicName';
export const BUNDLE_MANIFESTVERSION = 'Bundle-ManifestVersion';
export const BUNDLE_COPYRIGHT = 'Bundle-Copyright';
export const REQUIRE_BUNDLE = 'Require-Bundle';
export const PROVIDE_CAPABILITY = 'Provide-Capability';
export const REQUIRE_CAPABILITY = 'Require-Capability';
export const RESOLUTION_OPTIONAL = 'optional';
export const SYSTEM_BUNDLE_SYMBOLICNAME = 'io.pandino.framework';
export const ACTIVATION_LAZY = 'lazy';
export const FRAGMENT_HOST = 'Fragment-Host';
export const FRAMEWORK_INACTIVE_STARTLEVEL = 0;
export const FRAMEWORK_FETCHER = 'io.pandino.fetcher';
export const FRAMEWORK_UUID = 'io.pandino.framework.uuid';
export const FRAMEWORK_VERSION = 'io.pandino.framework.version';
export const FRAMEWORK_VENDOR = 'io.pandino.framework.vendor';
export const FRAMEWORK_VENDOR_VALUE = 'Pandino Developers';
export const FRAMEWORK_LANGUAGE = 'io.pandino.framework.language';
export const REQUIREMENT_RESOLUTION_DIRECTIVE = 'resolution';
export const RESOLUTION_DYNAMIC = 'dynamic';
export const CARDINALITY_MULTIPLE = 'multiple';

/**
 * SERVICE
 */
export const IMPORT_SERVICE = 'Import-Service';
export const SERVICE_DEFAULT_RANK = 50;
export const SERVICE_ID = 'service.id';
export const SERVICE_RANKING = 'service.ranking';
export const SERVICE_BUNDLEID = 'service.bundleid';
export const SERVICE_DESCRIPTION = 'service.description';
export const SERVICE_SCOPE = 'service.scope';
export const SCOPE_SINGLETON = 'singleton';
export const SCOPE_BUNDLE = 'bundle';
export const SCOPE_PROTOTYPE = 'prototype';
export const OBJECTCLASS = 'objectClass';

/**
 * ATTRIBUTES
 */
export const BUNDLE_VERSION_ATTRIBUTE = 'bundle-version';
export const VERSION_ATTRIBUTE = 'version';
export const CAPABILITY_VERSION_ATTRIBUTE = 'version';
export const CAPABILITY_COPYRIGHT_ATTRIBUTE = 'copyright';
export const CAPABILITY_TAGS_ATTRIBUTE = 'tags';
export const CAPABILITY_TYPE_ATTRIBUTE = 'type';
export const CAPABILITY_DESCRIPTION_ATTRIBUTE = 'description';
export const BUNDLE_SYMBOLICNAME_ATTRIBUTE = 'bundle-symbolic-name';

/**
 * DIRECTIVES
 */
export const USES_DIRECTIVE = 'uses';
export const MANDATORY_DIRECTIVE = 'mandatory';
export const FILTER_DIRECTIVE = 'filter';
export const INCLUDE_DIRECTIVE = 'include';
export const EXCLUDE_DIRECTIVE = 'exclude';
export const RESOLUTION_DIRECTIVE = 'resolution';
export const SINGLETON_DIRECTIVE = 'singleton';
export const CAPABILITY_SINGLETON_DIRECTIVE = 'singleton';
export const EFFECTIVE_DIRECTIVE = 'effective';
export const EFFECTIVE_RESOLVE = 'resolve';
export const REQUIREMENT_FILTER_DIRECTIVE = 'filter';
export const VISIBILITY_DIRECTIVE = 'visibility';
export const VISIBILITY_REEXPORT = 'reexport';
export const REQUIREMENT_CARDINALITY_DIRECTIVE = 'cardinality';
