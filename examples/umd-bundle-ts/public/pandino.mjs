/**
 * PANDINO
 */
const DEPLOYMENT_ROOT_PROP = 'pandino.deployment.root';
const LOG_LEVEL_PROP = 'pandino.log.level';
const LOG_LOGGER_PROP = 'pandino.log.logger';
const PANDINO_BUNDLE_IMPORTER_PROP = 'pandino.bundle.importer';
const PANDINO_MANIFEST_FETCHER_PROP = 'pandino.manifest.fetcher';
const PANDINO_ACTIVATOR_RESOLVERS = 'pandino.activator.resolvers';
const BUNDLE_NAMESPACE = 'pandino.wiring.bundle';
const IDENTITY_NAMESPACE = 'pandino.identity';
const TYPE_BUNDLE = 'pandino.bundle';
const TYPE_FRAGMENT = 'pandino.fragment';
const SYSTEMBUNDLE_ACTIVATORS_PROP = 'pandino.systembundle.activators';
const PACKAGE_NAMESPACE = 'pandino.wiring.package';
const HOST_NAMESPACE = 'pandino.wiring.host';
/**
 * Location identifier of the Pandino <i>system bundle </i>, which is defined to be &quot;System Bundle&quot;.
 */
const SYSTEM_BUNDLE_LOCATION = 'System Bundle';
/**
 * Manifest header identifying the bundle's name.
 */
const BUNDLE_NAME = 'Bundle-Name';
/**
 * Manifest header containing a brief description of the bundle's functionality.
 */
const BUNDLE_DESCRIPTION = 'Bundle-Description';
/**
 * Manifest header identifying the bundle's version.
 *
 * (Required attribute)
 */
const BUNDLE_VERSION = 'Bundle-Version';
/**
 * Manifest header identifying the bundle's type.
 *
 * Valid options are:
 * - esm
 * - umd
 *
 * Default: esm
 *
 * Warning! Given that UMD modules are loaded onto the `window`, Pandino cannot guarantee that they cannot be tempered
 * with. Re-loading the same bundle multiple times may cause issues.
 */
const BUNDLE_TYPE = 'Bundle-Type';
/**
 * If the corresponding value is a path string, then the value <b>MUST</b> be a relative path calculated from the
 * {@link DEPLOYMENT_ROOT_PROP}'s value!
 *
 * (Required attribute)
 */
const BUNDLE_ACTIVATOR = 'Bundle-Activator';
/**
 * Manifest header identifying the bundle's activation policy.
 *
 * (Not yet implemented)
 */
const BUNDLE_ACTIVATIONPOLICY = 'Bundle-ActivationPolicy';
/**
 * Manifest header identifying the bundle's symbolic name.
 *
 * (Required attribute)
 */
const BUNDLE_SYMBOLICNAME = 'Bundle-SymbolicName';
/**
 * Manifest header identifying the bundle manifest version. A bundle manifest may express the version of the syntax in
 * which it is written by specifying a bundle manifest version.
 *
 * (Required attribute)
 */
const BUNDLE_MANIFESTVERSION = 'Bundle-ManifestVersion';
/**
 * Manifest header identifying the bundle's copyright information.
 */
const BUNDLE_COPYRIGHT = 'Bundle-Copyright';
/**
 * Manifest header identifying the symbolic names of other bundles required by the bundle.
 *
 * (Not yet implemented)
 */
const REQUIRE_BUNDLE = 'Require-Bundle';
/**
 * Manifest header identifying the capabilities that the bundle offers to provide to other bundles.
 */
const PROVIDE_CAPABILITY = 'Provide-Capability';
/**
 * Manifest header identifying the capabilities on which the bundle depends.
 */
const REQUIRE_CAPABILITY = 'Require-Capability';
/**
 * Manifest header directive value identifying an optional resolution type. An optional resolution type indicates that
 * the import, require bundle or require capability is optional and the bundle may be resolved without the import,
 * require bundle or require capability being resolved. If the import, require bundle or require capability is not
 * resolved when the bundle is resolved, the import, require bundle or require capability may not be resolved until the
 * bundle is refreshed.
 *
 * (Not yet implemented)
 */
const RESOLUTION_OPTIONAL = 'optional';
const SYSTEM_BUNDLE_SYMBOLICNAME = '@pandino/pandino';
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
const ACTIVATION_LAZY = 'lazy';
/**
 * Manifest header identifying the symbolic name of another bundle for which that the bundle is a fragment.
 *
 * (Not yet implemented)
 */
const FRAGMENT_HOST = 'Fragment-Host';
const FRAMEWORK_LOGGER = '@pandino/pandino/Logger';
const FRAMEWORK_MANIFEST_FETCHER = '@pandino/pandino/ManifestFetcher';
const FRAMEWORK_BUNDLE_IMPORTER = '@pandino/pandino/BundleImporter';
const FRAMEWORK_FILTER_PARSER = '@pandino/pandino/FilterParser';
const FRAMEWORK_SEMVER_FACTORY = '@pandino/pandino/SemVerFactory';
const SERVICE_DEFAULT_RANK = 0;
/**
 * Service property identifying a service's registration number. The value of this property must be of type
 * {@code number}.
 *
 * <p>
 * The value of this property is assigned by the Framework when a service is registered. The Framework assigns a unique,
 * non-negative value that is larger than all previously assigned values since the Framework was started. These values
 * are NOT persistent across restarts of the Framework.
 */
const SERVICE_ID = 'service.id';
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
const SERVICE_RANKING = 'service.ranking';
/**
 * Service property identifying the {@link Bundle#getBundleId() bundle id} of the {@link ServiceReference#getBundle()
 * bundle registering the service}.
 *
 * <p>
 * This property is set by the Framework when a service is registered. The value of this property must be of type
 * {@code number}.
 */
const SERVICE_BUNDLEID = 'service.bundleid';
/**
 * Service property identifying a service's description.
 */
const SERVICE_DESCRIPTION = 'service.description';
/**
 * Service property identifying a service's scope.
 *
 * <p>
 * This property is set by the Framework when a service is registered. If the registered object implements
 * {@link PrototypeServiceFactory}, then the value of this service property will be {@link #SCOPE_PROTOTYPE}. Otherwise,
 * if the registered object implements {@link ServiceFactory}, then the value of this service property will be
 * {@link #SCOPE_BUNDLE}. Otherwise, the value of this service property will be {@link #SCOPE_SINGLETON}.
 */
const SERVICE_SCOPE = 'service.scope';
/**
 * Service scope is singleton. All bundles using the service receive the same service object.
 */
const SCOPE_SINGLETON = 'singleton';
/**
 * Service scope is bundle. Each bundle using the service receives a customized service object.
 */
const SCOPE_BUNDLE = 'bundle';
/**
 * Service scope is prototype. Each bundle using the service receives either a customized service object or can request
 * multiple customized service objects.
 */
const SCOPE_PROTOTYPE = 'prototype';
/**
 * Service property identifying all of the class names under which a service was registered in the Framework. The value
 * of this property must be of type {@code string | string[]}.
 *
 * <p>
 * This property is set by the Framework when a service is registered.
 */
const OBJECTCLASS = 'objectClass';
/**
 * Manifest header attribute identifying a range of versions for a bundle specified in the {@code Require-Bundle} or
 * {@code Fragment-Host} manifest headers. The default value is {@code 0.0.0}.
 */
const BUNDLE_VERSION_ATTRIBUTE = 'bundle-version';
/**
 * The capability attribute identifying the {@code SemVer} of the resource if one is specified or {@code 0.0.0} if not
 * specified. The value of this attribute must be of type {@code SemVer}.
 */
const CAPABILITY_VERSION_ATTRIBUTE = 'version';
/**
 * The capability attribute that contains a human readable copyright notice for the resource. See the
 * {@code Bundle-Copyright} manifest header.
 */
const CAPABILITY_COPYRIGHT_ATTRIBUTE = 'copyright';
/**
 * The capability attribute identifying the resource type. If the resource has no type then the value
 * {@link #TYPE_UNKNOWN unknown} must be used for the attribute.
 */
const CAPABILITY_TYPE_ATTRIBUTE = 'type';
/**
 * The capability attribute that contains a human readable description for the resource. See the
 * {@code Bundle-Description} manifest header.
 */
const CAPABILITY_DESCRIPTION_ATTRIBUTE = 'description';
/**
 * Manifest header directive identifying a list of packages that an exported package or provided capability uses.
 */
const USES_DIRECTIVE = 'uses';
/**
 * Manifest header directive identifying names of matching attributes which must be specified by matching Import-Package
 * statements in the Export-Package manifest header.
 */
const MANDATORY_DIRECTIVE = 'mandatory';
/**
 * Manifest header directive identifying the capability filter specified in the Require-Capability manifest header.
 */
const FILTER_DIRECTIVE = 'filter';
/**
 * Manifest header directive identifying a list of classes to include in the exported package.
 *
 * <p>
 * This directive is used by the Export-Package manifest header to identify a list of classes of the specified package
 * which must be allowed to be exported.
 */
const INCLUDE_DIRECTIVE = 'include';
/**
 * Manifest header directive identifying a list of classes to exclude in the exported package..
 * <p>
 * This directive is used by the Export-Package manifest header to identify a list of classes of the specified package
 * which must not be allowed to be exported.
 */
const EXCLUDE_DIRECTIVE = 'exclude';
/**
 * Manifest header directive identifying the resolution type in the Import-Package, Require-Bundle or Require-Capability
 * manifest header. The default value is {@link #RESOLUTION_MANDATORY mandatory}.
 */
const RESOLUTION_DIRECTIVE = 'resolution';
/**
 * Manifest header directive identifying whether a bundle is a singleton. The default value is {@code false}.
 */
const SINGLETON_DIRECTIVE = 'singleton';
/**
 * The capability directive identifying if the resource is a singleton. A {@code string} value of &quot;true&quot;
 * indicates the resource is a singleton; any other value or {@code undefined} indicates the resource is not a
 * singleton.
 */
const CAPABILITY_SINGLETON_DIRECTIVE = 'singleton';
/**
 * Manifest header directive identifying the effective time of the provided capability. The default value is
 * {@link #EFFECTIVE_RESOLVE resolve}.
 */
const EFFECTIVE_DIRECTIVE = 'effective';
/**
 * Manifest header directive value identifying a capability that is effective at resolve time. Capabilities with an
 * effective time of resolve are the only capabilities which are processed by the resolver.
 */
const EFFECTIVE_RESOLVE = 'resolve';
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["TRACE"] = 5] = "TRACE";
    LogLevel[LogLevel["DEBUG"] = 4] = "DEBUG";
    LogLevel[LogLevel["LOG"] = 3] = "LOG";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
})(LogLevel || (LogLevel = {}));

function isAnyMissing(...parameters) {
    for (const param of parameters) {
        if (param === null || param === undefined) {
            return true;
        }
    }
    return false;
}
function isAllPresent(...parameters) {
    return !isAnyMissing(...parameters);
}

class BundleCapabilityImpl {
    revision;
    namespace;
    dirs = {};
    attrs = {};
    uses = [];
    mandatory = new Set();
    constructor(revision, namespace, dirs = {}, attrs = {}) {
        this.revision = revision;
        this.namespace = namespace;
        this.dirs = dirs;
        this.attrs = attrs;
        let value = this.dirs[USES_DIRECTIVE];
        if (value !== null && value !== undefined) {
            const uses = value.split(',').map((i) => i.trim());
            for (const u of uses) {
                this.uses.push(u);
            }
        }
        let mandatory = new Set();
        value = this.dirs[MANDATORY_DIRECTIVE];
        if (value !== null && value !== undefined) {
            const names = ManifestParserImpl.parseDelimitedString(value, ',');
            for (let name of names) {
                if (this.attrs.hasOwnProperty(name)) {
                    mandatory.add(name);
                }
                else {
                    throw new Error("Mandatory attribute '" + name + "' does not exist.");
                }
            }
        }
        this.mandatory = mandatory;
    }
    equals(other) {
        if (isAnyMissing(other) || !(other instanceof BundleCapabilityImpl)) {
            return false;
        }
        if (this.revision.getVersion().compare(other.revision.getVersion()) === 0 &&
            this.getNamespace() === other.getNamespace()) {
            return true;
        }
        return false;
    }
    getAttributes() {
        return this.attrs;
    }
    getDirectives() {
        return this.dirs;
    }
    getNamespace() {
        return this.namespace;
    }
    getResource() {
        return this.revision;
    }
    getRevision() {
        return this.revision;
    }
    isAttributeMandatory(name) {
        return this.mandatory.size > 0 && this.mandatory.has(name);
    }
    getUses() {
        return this.uses;
    }
    toString() {
        if (isAnyMissing(this.revision)) {
            return this.stringifyAttributes();
        }
        return '[' + this.revision + '] ' + this.namespace + '; ' + this.stringifyAttributes();
    }
    stringifyAttributes() {
        const list = Object.keys(this.attrs).map((key) => `${key}=${this.attrs[key]}`);
        return `${list.join('; ')}`;
    }
}

class ParsedHeaderClause {
    paths;
    dirs;
    attrs;
    types;
    constructor(paths, dirs, attrs, types) {
        this.paths = paths;
        this.dirs = dirs;
        this.attrs = attrs;
        this.types = types;
    }
}

/* istanbul ignore file */
function peg$subclass(child, parent) {
    function ctor() {
        this.constructor = child;
    }
    ctor.prototype = parent.prototype;
    // @ts-ignore
    child.prototype = new ctor();
}
function peg$SyntaxError(message, expected, found, location) {
    this.message = message;
    this.expected = expected;
    this.found = found;
    this.location = location;
    this.name = 'SyntaxError';
    if (typeof Error.captureStackTrace === 'function') {
        Error.captureStackTrace(this, peg$SyntaxError);
    }
}
peg$subclass(peg$SyntaxError, Error);
function peg$parse(input) {
    let options = arguments.length > 1 ? arguments[1] : {}, peg$FAILED = {}, peg$startRuleFunctions = { start: peg$parsestart }, peg$startRuleFunction = peg$parsestart, peg$c0 = function (filter) {
        return filter;
    }, peg$c1 = function (filter) {
        filter.value = filter.value.replace(/ +$/, '');
        return filter;
    }, peg$c2 = '(', peg$c3 = { type: 'literal', value: '(', description: '"("' }, peg$c4 = ')', peg$c5 = { type: 'literal', value: ')', description: '")"' }, peg$c6 = '&', peg$c7 = { type: 'literal', value: '&', description: '"&"' }, peg$c8 = function (filters) {
        return Filter.AND(filters);
    }, peg$c9 = '|', peg$c10 = { type: 'literal', value: '|', description: '"|"' }, peg$c11 = function (filters) {
        return Filter.OR(filters);
    }, peg$c12 = '!', peg$c13 = { type: 'literal', value: '!', description: '"!"' }, peg$c14 = function (filter) {
        return Filter.NOT(filter);
    }, peg$c15 = function (attr, comp, value) {
        return new Filter(attr.attribute, comp, value);
    }, peg$c16 = '=', peg$c17 = { type: 'literal', value: '=', description: '"="' }, peg$c18 = '~=', peg$c19 = { type: 'literal', value: '~=', description: '"~="' }, peg$c20 = '>=', peg$c21 = { type: 'literal', value: '>=', description: '">="' }, peg$c22 = '<=', peg$c23 = { type: 'literal', value: '<=', description: '"<="' }, peg$c24 = '=*', peg$c25 = { type: 'literal', value: '=*', description: '"=*"' }, peg$c26 = function (attr) {
        return Filter.attribute(attr.attribute).present();
    }, peg$c27 = function (attr, value) {
        return new Filter(attr.attribute, FilterComp.EQ, value);
    }, peg$c28 = '*', peg$c29 = { type: 'literal', value: '*', description: '"*"' }, peg$c30 = { type: 'other', description: 'attribute description' }, peg$c31 = ';', peg$c32 = { type: 'literal', value: ';', description: '";"' }, peg$c33 = function (attr, opts) {
        if (opts) {
            opts.shift();
            opts = opts.shift();
            opts = opts.split(';');
        }
        attr.options = opts || [];
        return attr;
    }, peg$c34 = { type: 'other', description: 'attribute Type' }, peg$c35 = function (oid) {
        return {
            type: 'oid',
            attribute: oid,
        };
    }, peg$c36 = function (name) {
        return {
            type: 'attribute',
            attribute: name,
        };
    }, peg$c37 = { type: 'other', description: 'attribute type chars' }, peg$c38 = '-', peg$c39 = { type: 'literal', value: '-', description: '"-"' }, peg$c40 = { type: 'other', description: 'OID' }, peg$c41 = '.', peg$c42 = { type: 'literal', value: '.', description: '"."' }, peg$c43 = { type: 'other', description: 'attribute options' }, peg$c44 = { type: 'other', description: 'attribute option' }, peg$c45 = /^[^)]/, peg$c46 = { type: 'class', value: '[^\\x29]', description: '[^\\x29]' }, peg$c47 = '\\', peg$c48 = { type: 'literal', value: '\\', description: '"\\\\"' }, peg$c49 = function (char) {
        return String.fromCharCode(char);
    }, peg$c50 = function (value) {
        return parseInt(value, 16);
    }, peg$c51 = /^[a-fA-F0-9]/, peg$c52 = { type: 'class', value: '[a-fA-F0-9]', description: '[a-fA-F0-9]' }, peg$c53 = { type: 'other', description: 'WHITESPACE' }, peg$c54 = { type: 'other', description: 'SPACE' }, peg$c55 = /^[ ]/, peg$c56 = { type: 'class', value: '[\\x20]', description: '[\\x20]' }, peg$c57 = { type: 'other', description: 'TAB' }, peg$c58 = /^[\t]/, peg$c59 = { type: 'class', value: '[\\x09]', description: '[\\x09]' }, peg$c60 = { type: 'other', description: 'DIGIT' }, peg$c61 = /^[0-9]/, peg$c62 = { type: 'class', value: '[0-9]', description: '[0-9]' }, peg$c63 = { type: 'other', description: 'ALPHA' }, peg$c64 = /^[a-zA-Z]/, peg$c65 = { type: 'class', value: '[a-zA-Z]', description: '[a-zA-Z]' }, peg$c66 = { type: 'other', description: 'NEWLINE' }, peg$c67 = '\r\n', peg$c68 = { type: 'literal', value: '\r\n', description: '"\\r\\n"' }, peg$c69 = '\n', peg$c70 = { type: 'literal', value: '\n', description: '"\\n"' }, peg$currPos = 0, peg$posDetailsCache = [{ line: 1, column: 1, seenCR: false }], peg$maxFailPos = 0, peg$maxFailExpected = [], peg$silentFails = 0, peg$result;
    if ('startRule' in options) {
        if (!(options.startRule in peg$startRuleFunctions)) {
            throw new Error('Can\'t start parsing from rule "' + options.startRule + '".');
        }
        peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }
    function peg$computePosDetails(pos) {
        let details = peg$posDetailsCache[pos], p, ch;
        if (details) {
            return details;
        }
        else {
            p = pos - 1;
            while (!peg$posDetailsCache[p]) {
                p--;
            }
            details = peg$posDetailsCache[p];
            details = {
                line: details.line,
                column: details.column,
                seenCR: details.seenCR,
            };
            while (p < pos) {
                ch = input.charAt(p);
                if (ch === '\n') {
                    if (!details.seenCR) {
                        details.line++;
                    }
                    details.column = 1;
                    details.seenCR = false;
                }
                else if (ch === '\r' || ch === '\u2028' || ch === '\u2029') {
                    details.line++;
                    details.column = 1;
                    details.seenCR = true;
                }
                else {
                    details.column++;
                    details.seenCR = false;
                }
                p++;
            }
            peg$posDetailsCache[pos] = details;
            return details;
        }
    }
    function peg$computeLocation(startPos, endPos) {
        let startPosDetails = peg$computePosDetails(startPos), endPosDetails = peg$computePosDetails(endPos);
        return {
            start: {
                offset: startPos,
                line: startPosDetails.line,
                column: startPosDetails.column,
            },
            end: {
                offset: endPos,
                line: endPosDetails.line,
                column: endPosDetails.column,
            },
        };
    }
    function peg$fail(expected) {
        if (peg$currPos < peg$maxFailPos) {
            return;
        }
        if (peg$currPos > peg$maxFailPos) {
            peg$maxFailPos = peg$currPos;
            peg$maxFailExpected = [];
        }
        peg$maxFailExpected.push(expected);
    }
    function peg$buildException(message, expected, found, location) {
        function cleanupExpected(expected) {
            let i = 1;
            expected.sort(function (a, b) {
                if (a.description < b.description) {
                    return -1;
                }
                else if (a.description > b.description) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
            while (i < expected.length) {
                if (expected[i - 1] === expected[i]) {
                    expected.splice(i, 1);
                }
                else {
                    i++;
                }
            }
        }
        function buildMessage(expected, found) {
            function stringEscape(s) {
                function hex(ch) {
                    return ch.charCodeAt(0).toString(16).toUpperCase();
                }
                return s
                    .replace(/\\/g, '\\\\')
                    .replace(/"/g, '\\"')
                    .replace(/\x08/g, '\\b')
                    .replace(/\t/g, '\\t')
                    .replace(/\n/g, '\\n')
                    .replace(/\f/g, '\\f')
                    .replace(/\r/g, '\\r')
                    .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function (ch) {
                    return '\\x0' + hex(ch);
                })
                    .replace(/[\x10-\x1F\x80-\xFF]/g, function (ch) {
                    return '\\x' + hex(ch);
                })
                    .replace(/[\u0100-\u0FFF]/g, function (ch) {
                    return '\\u0' + hex(ch);
                })
                    .replace(/[\u1000-\uFFFF]/g, function (ch) {
                    return '\\u' + hex(ch);
                });
            }
            let expectedDescs = new Array(expected.length), expectedDesc, foundDesc, i;
            for (i = 0; i < expected.length; i++) {
                expectedDescs[i] = expected[i].description;
            }
            expectedDesc =
                expected.length > 1
                    ? expectedDescs.slice(0, -1).join(', ') + ' or ' + expectedDescs[expected.length - 1]
                    : expectedDescs[0];
            foundDesc = found ? '"' + stringEscape(found) + '"' : 'end of input';
            return 'Expected ' + expectedDesc + ' but ' + foundDesc + ' found.';
        }
        if (expected !== null) {
            cleanupExpected(expected);
        }
        // @ts-ignore
        return new peg$SyntaxError(message !== null ? message : buildMessage(expected, found), expected, found, location);
    }
    function peg$parsestart() {
        let s0, s1, s2;
        s0 = peg$currPos;
        s1 = peg$parsefilter();
        if (s1 !== peg$FAILED) {
            s1 = peg$c0(s1);
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = [];
            s2 = peg$parseFILL();
            while (s2 !== peg$FAILED) {
                s1.push(s2);
                s2 = peg$parseFILL();
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parseitem();
                if (s2 !== peg$FAILED) {
                    s1 = peg$c1(s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        return s0;
    }
    function peg$parsefilter() {
        let s0, s1, s2, s3, s4, s5, s6;
        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parseFILL();
        while (s2 !== peg$FAILED) {
            s1.push(s2);
            s2 = peg$parseFILL();
        }
        if (s1 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 40) {
                s2 = peg$c2;
                peg$currPos++;
            }
            else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c3);
                }
            }
            if (s2 !== peg$FAILED) {
                s3 = peg$parsefiltercomp();
                if (s3 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 41) {
                        s4 = peg$c4;
                        peg$currPos++;
                    }
                    else {
                        s4 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c5);
                        }
                    }
                    if (s4 !== peg$FAILED) {
                        s5 = [];
                        s6 = peg$parseFILL();
                        while (s6 !== peg$FAILED) {
                            s5.push(s6);
                            s6 = peg$parseFILL();
                        }
                        if (s5 !== peg$FAILED) {
                            s1 = peg$c0(s3);
                            s0 = s1;
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parsefiltercomp() {
        let s0;
        s0 = peg$parseand();
        if (s0 === peg$FAILED) {
            s0 = peg$parseor();
            if (s0 === peg$FAILED) {
                s0 = peg$parsenot();
                if (s0 === peg$FAILED) {
                    s0 = peg$parseitem();
                }
            }
        }
        return s0;
    }
    function peg$parseand() {
        let s0, s1, s2, s3, s4, s5;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 38) {
            s1 = peg$c6;
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c7);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = [];
            s3 = peg$parseFILL();
            while (s3 !== peg$FAILED) {
                s2.push(s3);
                s3 = peg$parseFILL();
            }
            if (s2 !== peg$FAILED) {
                s3 = peg$parsefilterlist();
                if (s3 !== peg$FAILED) {
                    s4 = [];
                    s5 = peg$parseFILL();
                    while (s5 !== peg$FAILED) {
                        s4.push(s5);
                        s5 = peg$parseFILL();
                    }
                    if (s4 !== peg$FAILED) {
                        s1 = peg$c8(s3);
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseor() {
        let s0, s1, s2, s3, s4, s5;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 124) {
            s1 = peg$c9;
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c10);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = [];
            s3 = peg$parseFILL();
            while (s3 !== peg$FAILED) {
                s2.push(s3);
                s3 = peg$parseFILL();
            }
            if (s2 !== peg$FAILED) {
                s3 = peg$parsefilterlist();
                if (s3 !== peg$FAILED) {
                    s4 = [];
                    s5 = peg$parseFILL();
                    while (s5 !== peg$FAILED) {
                        s4.push(s5);
                        s5 = peg$parseFILL();
                    }
                    if (s4 !== peg$FAILED) {
                        s1 = peg$c11(s3);
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parsenot() {
        let s0, s1, s2, s3, s4, s5;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 33) {
            s1 = peg$c12;
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c13);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = [];
            s3 = peg$parseFILL();
            while (s3 !== peg$FAILED) {
                s2.push(s3);
                s3 = peg$parseFILL();
            }
            if (s2 !== peg$FAILED) {
                s3 = peg$parsefilter();
                if (s3 !== peg$FAILED) {
                    s4 = [];
                    s5 = peg$parseFILL();
                    while (s5 !== peg$FAILED) {
                        s4.push(s5);
                        s5 = peg$parseFILL();
                    }
                    if (s4 !== peg$FAILED) {
                        s1 = peg$c14(s3);
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parsefilterlist() {
        let s0, s1;
        s0 = [];
        s1 = peg$parsefilter();
        if (s1 !== peg$FAILED) {
            while (s1 !== peg$FAILED) {
                s0.push(s1);
                s1 = peg$parsefilter();
            }
        }
        else {
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseitem() {
        let s0;
        s0 = peg$parsesubstring();
        if (s0 === peg$FAILED) {
            s0 = peg$parsesimple();
            if (s0 === peg$FAILED) {
                s0 = peg$parsepresent();
            }
        }
        return s0;
    }
    function peg$parsesimple() {
        let s0, s1, s2, s3;
        s0 = peg$currPos;
        s1 = peg$parseAttributeDescription();
        if (s1 !== peg$FAILED) {
            s2 = peg$parsefiltertype();
            if (s2 !== peg$FAILED) {
                s3 = peg$parsevalue();
                if (s3 !== peg$FAILED) {
                    s1 = peg$c15(s1, s2, s3);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parsefiltertype() {
        let s0;
        s0 = peg$parseequal();
        if (s0 === peg$FAILED) {
            s0 = peg$parseapprox();
            if (s0 === peg$FAILED) {
                s0 = peg$parsegreater();
                if (s0 === peg$FAILED) {
                    s0 = peg$parseless();
                }
            }
        }
        return s0;
    }
    function peg$parseequal() {
        let s0;
        if (input.charCodeAt(peg$currPos) === 61) {
            s0 = peg$c16;
            peg$currPos++;
        }
        else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c17);
            }
        }
        return s0;
    }
    function peg$parseapprox() {
        let s0;
        if (input.substr(peg$currPos, 2) === peg$c18) {
            s0 = peg$c18;
            peg$currPos += 2;
        }
        else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c19);
            }
        }
        return s0;
    }
    function peg$parsegreater() {
        let s0;
        if (input.substr(peg$currPos, 2) === peg$c20) {
            s0 = peg$c20;
            peg$currPos += 2;
        }
        else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c21);
            }
        }
        return s0;
    }
    function peg$parseless() {
        let s0;
        if (input.substr(peg$currPos, 2) === peg$c22) {
            s0 = peg$c22;
            peg$currPos += 2;
        }
        else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c23);
            }
        }
        return s0;
    }
    function peg$parsepresent() {
        let s0, s1, s2;
        s0 = peg$currPos;
        s1 = peg$parseAttributeDescription();
        if (s1 !== peg$FAILED) {
            if (input.substr(peg$currPos, 2) === peg$c24) {
                s2 = peg$c24;
                peg$currPos += 2;
            }
            else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c25);
                }
            }
            if (s2 !== peg$FAILED) {
                s1 = peg$c26(s1);
                s0 = s1;
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parsesubstring() {
        let s0, s1, s2, s3, s4, s5, s6, s7;
        s0 = peg$currPos;
        s1 = peg$parseAttributeDescription();
        if (s1 !== peg$FAILED) {
            s2 = peg$parseequal();
            if (s2 !== peg$FAILED) {
                s3 = peg$currPos;
                s4 = peg$currPos;
                s5 = peg$parsevalue();
                if (s5 === peg$FAILED) {
                    s5 = null;
                }
                if (s5 !== peg$FAILED) {
                    s6 = peg$parseany();
                    if (s6 !== peg$FAILED) {
                        s7 = peg$parsevalue();
                        if (s7 === peg$FAILED) {
                            s7 = null;
                        }
                        if (s7 !== peg$FAILED) {
                            s5 = [s5, s6, s7];
                            s4 = s5;
                        }
                        else {
                            peg$currPos = s4;
                            s4 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s4;
                        s4 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s4;
                    s4 = peg$FAILED;
                }
                if (s4 !== peg$FAILED) {
                    s3 = input.substring(s3, peg$currPos);
                }
                else {
                    s3 = s4;
                }
                if (s3 !== peg$FAILED) {
                    s1 = peg$c27(s1, s3);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseany() {
        let s0, s1, s2, s3, s4, s5;
        s0 = peg$currPos;
        s1 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 42) {
            s2 = peg$c28;
            peg$currPos++;
        }
        else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c29);
            }
        }
        if (s2 !== peg$FAILED) {
            s1 = input.substring(s1, peg$currPos);
        }
        else {
            s1 = s2;
        }
        if (s1 !== peg$FAILED) {
            s2 = [];
            s3 = peg$currPos;
            s4 = peg$parsevalue();
            if (s4 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 42) {
                    s5 = peg$c28;
                    peg$currPos++;
                }
                else {
                    s5 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c29);
                    }
                }
                if (s5 !== peg$FAILED) {
                    s4 = [s4, s5];
                    s3 = s4;
                }
                else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s3;
                s3 = peg$FAILED;
            }
            while (s3 !== peg$FAILED) {
                s2.push(s3);
                s3 = peg$currPos;
                s4 = peg$parsevalue();
                if (s4 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 42) {
                        s5 = peg$c28;
                        peg$currPos++;
                    }
                    else {
                        s5 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c29);
                        }
                    }
                    if (s5 !== peg$FAILED) {
                        s4 = [s4, s5];
                        s3 = s4;
                    }
                    else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
            }
            if (s2 !== peg$FAILED) {
                s1 = [s1, s2];
                s0 = s1;
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parsevalue() {
        let s0, s1, s2;
        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parseAttributeValue();
        if (s2 !== peg$FAILED) {
            while (s2 !== peg$FAILED) {
                s1.push(s2);
                s2 = peg$parseAttributeValue();
            }
        }
        else {
            s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
            s0 = input.substring(s0, peg$currPos);
        }
        else {
            s0 = s1;
        }
        return s0;
    }
    function peg$parseAttributeDescription() {
        let s0, s1, s2, s3, s4;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$parseAttributeType();
        if (s1 !== peg$FAILED) {
            s2 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 59) {
                s3 = peg$c31;
                peg$currPos++;
            }
            else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c32);
                }
            }
            if (s3 !== peg$FAILED) {
                s4 = peg$parseoptions();
                if (s4 !== peg$FAILED) {
                    s3 = [s3, s4];
                    s2 = s3;
                }
                else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s2;
                s2 = peg$FAILED;
            }
            if (s2 === peg$FAILED) {
                s2 = null;
            }
            if (s2 !== peg$FAILED) {
                s1 = peg$c33(s1, s2);
                s0 = s1;
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c30);
            }
        }
        return s0;
    }
    function peg$parseAttributeType() {
        let s0, s1, s2, s3, s4, s5;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$parseLDAP_OID();
        if (s1 !== peg$FAILED) {
            s1 = peg$c35(s1);
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$currPos;
            s2 = peg$currPos;
            s3 = peg$parseALPHA();
            if (s3 !== peg$FAILED) {
                s4 = [];
                s5 = peg$parseAttrTypeChars();
                while (s5 !== peg$FAILED) {
                    s4.push(s5);
                    s5 = peg$parseAttrTypeChars();
                }
                if (s4 !== peg$FAILED) {
                    s3 = [s3, s4];
                    s2 = s3;
                }
                else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s2;
                s2 = peg$FAILED;
            }
            if (s2 !== peg$FAILED) {
                s1 = input.substring(s1, peg$currPos);
            }
            else {
                s1 = s2;
            }
            if (s1 !== peg$FAILED) {
                s1 = peg$c36(s1);
            }
            s0 = s1;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c34);
            }
        }
        return s0;
    }
    function peg$parseAttrTypeChars() {
        let s0;
        peg$silentFails++;
        s0 = peg$parseALPHA();
        if (s0 === peg$FAILED) {
            s0 = peg$parseDIGIT();
            if (s0 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 45) {
                    s0 = peg$c38;
                    peg$currPos++;
                }
                else {
                    s0 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c39);
                    }
                }
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            if (peg$silentFails === 0) {
                peg$fail(peg$c37);
            }
        }
        return s0;
    }
    function peg$parseLDAP_OID() {
        let s0, s1, s2, s3, s4, s5, s6, s7;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$currPos;
        s2 = [];
        s3 = peg$parseDIGIT();
        if (s3 !== peg$FAILED) {
            while (s3 !== peg$FAILED) {
                s2.push(s3);
                s3 = peg$parseDIGIT();
            }
        }
        else {
            s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 46) {
                s5 = peg$c41;
                peg$currPos++;
            }
            else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c42);
                }
            }
            if (s5 !== peg$FAILED) {
                s6 = [];
                s7 = peg$parseDIGIT();
                if (s7 !== peg$FAILED) {
                    while (s7 !== peg$FAILED) {
                        s6.push(s7);
                        s7 = peg$parseDIGIT();
                    }
                }
                else {
                    s6 = peg$FAILED;
                }
                if (s6 !== peg$FAILED) {
                    s5 = [s5, s6];
                    s4 = s5;
                }
                else {
                    peg$currPos = s4;
                    s4 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s4;
                s4 = peg$FAILED;
            }
            while (s4 !== peg$FAILED) {
                s3.push(s4);
                s4 = peg$currPos;
                if (input.charCodeAt(peg$currPos) === 46) {
                    s5 = peg$c41;
                    peg$currPos++;
                }
                else {
                    s5 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c42);
                    }
                }
                if (s5 !== peg$FAILED) {
                    s6 = [];
                    s7 = peg$parseDIGIT();
                    if (s7 !== peg$FAILED) {
                        while (s7 !== peg$FAILED) {
                            s6.push(s7);
                            s7 = peg$parseDIGIT();
                        }
                    }
                    else {
                        s6 = peg$FAILED;
                    }
                    if (s6 !== peg$FAILED) {
                        s5 = [s5, s6];
                        s4 = s5;
                    }
                    else {
                        peg$currPos = s4;
                        s4 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s4;
                    s4 = peg$FAILED;
                }
            }
            if (s3 !== peg$FAILED) {
                s2 = [s2, s3];
                s1 = s2;
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s1;
            s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
            s0 = input.substring(s0, peg$currPos);
        }
        else {
            s0 = s1;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c40);
            }
        }
        return s0;
    }
    function peg$parseoptions() {
        let s0, s1, s2, s3, s4;
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$currPos;
        s2 = peg$parseoption();
        if (s2 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 59) {
                s3 = peg$c31;
                peg$currPos++;
            }
            else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c32);
                }
            }
            if (s3 !== peg$FAILED) {
                s4 = peg$parseoptions();
                if (s4 !== peg$FAILED) {
                    s2 = [s2, s3, s4];
                    s1 = s2;
                }
                else {
                    peg$currPos = s1;
                    s1 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s1;
            s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
            s0 = input.substring(s0, peg$currPos);
        }
        else {
            s0 = s1;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parseoption();
            if (s1 !== peg$FAILED) {
                s0 = input.substring(s0, peg$currPos);
            }
            else {
                s0 = s1;
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c43);
            }
        }
        return s0;
    }
    function peg$parseoption() {
        let s0, s1;
        peg$silentFails++;
        s0 = [];
        s1 = peg$parseAttrTypeChars();
        if (s1 !== peg$FAILED) {
            while (s1 !== peg$FAILED) {
                s0.push(s1);
                s1 = peg$parseAttrTypeChars();
            }
        }
        else {
            s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c44);
            }
        }
        return s0;
    }
    function peg$parseAttributeValue() {
        let s0;
        s0 = peg$parseEscapedCharacter();
        if (s0 === peg$FAILED) {
            if (peg$c45.test(input.charAt(peg$currPos))) {
                s0 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c46);
                }
            }
        }
        return s0;
    }
    function peg$parseEscapedCharacter() {
        let s0, s1, s2;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 92) {
            s1 = peg$c47;
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c48);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parseASCII_VALUE();
            if (s2 !== peg$FAILED) {
                s1 = peg$c49(s2);
                s0 = s1;
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseASCII_VALUE() {
        let s0, s1, s2, s3, s4;
        s0 = peg$currPos;
        s1 = peg$currPos;
        s2 = peg$currPos;
        s3 = peg$parseHEX_CHAR();
        if (s3 !== peg$FAILED) {
            s4 = peg$parseHEX_CHAR();
            if (s4 !== peg$FAILED) {
                s3 = [s3, s4];
                s2 = s3;
            }
            else {
                peg$currPos = s2;
                s2 = peg$FAILED;
            }
        }
        else {
            peg$currPos = s2;
            s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
            s1 = input.substring(s1, peg$currPos);
        }
        else {
            s1 = s2;
        }
        if (s1 !== peg$FAILED) {
            s1 = peg$c50(s1);
        }
        s0 = s1;
        return s0;
    }
    function peg$parseHEX_CHAR() {
        let s0;
        if (peg$c51.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
        }
        else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c52);
            }
        }
        return s0;
    }
    function peg$parseFILL() {
        let s0;
        peg$silentFails++;
        s0 = peg$parseSPACE();
        if (s0 === peg$FAILED) {
            s0 = peg$parseTAB();
            if (s0 === peg$FAILED) {
                s0 = peg$parseSEP();
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            if (peg$silentFails === 0) {
                peg$fail(peg$c53);
            }
        }
        return s0;
    }
    function peg$parseSPACE() {
        let s0;
        peg$silentFails++;
        if (peg$c55.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
        }
        else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c56);
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            if (peg$silentFails === 0) {
                peg$fail(peg$c54);
            }
        }
        return s0;
    }
    function peg$parseTAB() {
        let s0;
        peg$silentFails++;
        if (peg$c58.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
        }
        else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c59);
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            if (peg$silentFails === 0) {
                peg$fail(peg$c57);
            }
        }
        return s0;
    }
    function peg$parseDIGIT() {
        let s0, s1;
        peg$silentFails++;
        s0 = peg$currPos;
        if (peg$c61.test(input.charAt(peg$currPos))) {
            s1 = input.charAt(peg$currPos);
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c62);
            }
        }
        if (s1 !== peg$FAILED) {
            s0 = input.substring(s0, peg$currPos);
        }
        else {
            s0 = s1;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c60);
            }
        }
        return s0;
    }
    function peg$parseALPHA() {
        let s0, s1;
        peg$silentFails++;
        s0 = peg$currPos;
        if (peg$c64.test(input.charAt(peg$currPos))) {
            s1 = input.charAt(peg$currPos);
            peg$currPos++;
        }
        else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c65);
            }
        }
        if (s1 !== peg$FAILED) {
            s0 = input.substring(s0, peg$currPos);
        }
        else {
            s0 = s1;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c63);
            }
        }
        return s0;
    }
    function peg$parseSEP() {
        let s0;
        peg$silentFails++;
        if (input.substr(peg$currPos, 2) === peg$c67) {
            s0 = peg$c67;
            peg$currPos += 2;
        }
        else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$c68);
            }
        }
        if (s0 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 10) {
                s0 = peg$c69;
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c70);
                }
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            if (peg$silentFails === 0) {
                peg$fail(peg$c66);
            }
        }
        return s0;
    }
    peg$result = peg$startRuleFunction();
    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
        return peg$result;
    }
    else {
        if (peg$result !== peg$FAILED && peg$currPos < input.length) {
            peg$fail({ type: 'end', description: 'end of input' });
        }
        throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null, peg$maxFailPos < input.length
            ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
            : peg$computeLocation(peg$maxFailPos, peg$maxFailPos));
    }
}

/**
 * The original PegPARSE built Filter cannot handle dots (.) Needs to be fixed later...
 */
const replaceMap = new Map([
    [SERVICE_ID, 'serviceId'],
    [SERVICE_RANKING, 'serviceRanking'],
    [SERVICE_BUNDLEID, 'serviceBundleid'],
    [SERVICE_SCOPE, 'serviceScope'],
    [SERVICE_DESCRIPTION, 'serviceDescription'],
]);
const inverseMap = new Map([
    ['serviceId', SERVICE_ID],
    ['serviceRanking', SERVICE_RANKING],
    ['serviceBundleid', SERVICE_BUNDLEID],
    ['serviceScope', SERVICE_SCOPE],
    ['serviceDescription', SERVICE_DESCRIPTION],
]);

var FilterComp;
(function (FilterComp) {
    FilterComp["NOT"] = "!";
    FilterComp["AND"] = "&";
    FilterComp["OR"] = "|";
    FilterComp["EQ"] = "=";
    FilterComp["LTE"] = "<=";
    FilterComp["GTE"] = ">=";
    FilterComp["APPROX"] = "~=";
    FilterComp["MATCH_ALL"] = "*";
    FilterComp["PRESENT"] = "=*";
})(FilterComp || (FilterComp = {}));
class Filter {
    attrib;
    comp;
    value;
    filters;
    type = 'filter';
    constructor(attrib, comp, value, filters = []) {
        this.attrib = attrib;
        this.comp = comp;
        this.value = value;
        this.filters = filters;
    }
    static attribute(name) {
        return new Attribute(name);
    }
    static parse(input) {
        if (input === '(*)') {
            return new Filter(undefined, FilterComp.MATCH_ALL, undefined);
        }
        let newInput = input;
        for (const [original, replaceVal] of replaceMap.entries()) {
            newInput = newInput.replace(new RegExp(original, 'g'), replaceVal);
        }
        const originalFilter = peg$parse(newInput);
        return Filter.recursiveReplace(originalFilter, inverseMap);
    }
    static recursiveReplace(filter, inverseMap) {
        for (const [original, replaceVal] of inverseMap.entries()) {
            if (filter.attrib) {
                filter.attrib = filter.attrib.replace(new RegExp(original, 'g'), replaceVal);
            }
        }
        for (const f of filter.filters) {
            Filter.recursiveReplace(f, inverseMap);
        }
        return filter;
    }
    static convert(attrs) {
        const filters = [];
        for (let [_, value] of Object.entries(attrs)) {
            filters.push(Filter.parse(value.toString()));
        }
        let filter;
        if (filters.length === 1) {
            filter = filters[0];
        }
        else if (Object.keys(attrs).length > 1) {
            filter = new Filter(null, FilterComp.AND, filters);
        }
        else if (filters.length === 0) {
            filter = new Filter(null, FilterComp.MATCH_ALL, null);
        }
        return filter;
    }
    match(data) {
        const value = this.value;
        const attrv = data[this.attrib];
        switch (this.comp) {
            case '!':
                return Filter.NOT(this.filters)._match(data);
            case '&':
                return Filter.AND(this.filters)._match(data);
            case '|':
                return Filter.OR(this.filters)._match(data);
            case '=':
                if (value === '*' && attrv) {
                    return true;
                }
                return Filter.matchString(attrv, value);
            case '<=':
                return Filter.matchLTE(attrv, value);
            case '>=':
                return Filter.matchGTE(attrv, value);
            default:
                throw new Error('Unsupported comparison type');
        }
    }
    simplify() {
        if (this.filters) {
            if (this.filters.length == 1) {
                return this.filters[0].simplify();
            }
            else {
                this.filters = this.filters.map((filter) => filter.simplify());
            }
        }
        return this;
    }
    _indent(indent, level, id_char) {
        const _i = parseInt(indent);
        if (indent === true) {
            indent = Filter.indent;
        }
        else if (!isNaN(_i)) {
            indent = _i;
        }
        else {
            return '';
        }
        if (id_char !== undefined && typeof id_char != 'string') {
            throw new Error('Indent string must be string');
        }
        level = level || 0;
        id_char = id_char || Filter.indent_char;
        if (typeof id_char === 'number') {
            id_char = id_char.toString();
        }
        return id_char.repeat(level * indent);
    }
    toString(indent, level, id_char) {
        return [this._indent(indent, level, id_char), '(', this.attrib, this.comp, this.value, ')'].join('');
    }
    static escapeChars = ['*', '(', ')', '\\', String.fromCharCode(0)];
    static indent = 4;
    static indent_char = ' ';
    static collapse_not = true;
    static escape(value) {
        if (!value)
            return '';
        return value
            .split('')
            .map((c) => {
            return Filter.escapeChars.indexOf(c) >= 0 ? '\\' + c.charCodeAt(0).toString(16) : c;
        })
            .join('');
    }
    static unescape(data) {
        const chars = data.split('');
        const out = [];
        let tmp;
        while (chars.length) {
            tmp = chars.shift();
            if (tmp == '\\') {
                tmp = chars.shift() + chars.shift();
                tmp = parseInt(tmp, 16);
                tmp = String.fromCharCode(tmp);
            }
            out.push(tmp);
        }
        return out.join('');
    }
    static matchString(data, filter) {
        if (!data)
            return false;
        const match = Array.isArray(data) ? data : [data];
        if (filter.indexOf('*') < 0) {
            return match.some((cv) => {
                if (cv) {
                    return cv.toLowerCase() === Filter.unescape(filter).toLowerCase();
                }
            });
        }
        return Filter.matchSubstring(data, filter);
    }
    static matchSubstring(data, filter) {
        const match = Array.isArray(data) ? data : [data];
        let pattern = filter.replace(/\*/g, '.*');
        pattern = pattern.replace(/\\([0-9a-fA-F]{2,2})/g, (m, $1) => {
            let s = String.fromCharCode(parseInt($1, 16));
            if (['(', ')', '\\', '*'].indexOf(s) >= 0) {
                s = '\\x' + $1.toUpperCase();
            }
            return s;
        });
        const regex = new RegExp('^' + pattern + '$', 'i');
        return match.some((cv) => cv.match(regex));
    }
    static matchLTE(data, filter) {
        const match = Array.isArray(data) ? data : [data];
        return match.some((cv) => cv <= filter);
    }
    static matchGTE(data, filter) {
        const match = Array.isArray(data) ? data : [data];
        return match.some((cv) => cv >= filter);
    }
    static AND(filters) {
        return new GroupAnd(filters);
    }
    static OR(filters) {
        return new GroupOr(filters);
    }
    static NOT(filter) {
        if (!Array.isArray(filter)) {
            filter = [filter];
        }
        if (filter.length != 1) {
            throw new Error('NOT must wrap single filter');
        }
        return new GroupNot(filter);
    }
}
class Group extends Filter {
    type = 'group';
    constructor(comp, filters = []) {
        super(null, comp, null, filters);
    }
    match(data) {
        return super.match(data);
    }
    toString(indent, level, id_char) {
        level = level || 0;
        let id_str = this._indent(indent, level, id_char);
        let id_str2 = id_str;
        let nl = indent ? '\n' : '';
        if (this.comp === '!') {
            nl = '';
            id_str2 = '';
            indent = 0;
        }
        return [
            id_str,
            '(',
            this.comp,
            nl,
            this.filters.map((item) => item.toString(indent, level + 1, id_char)).join(nl),
            nl,
            id_str2,
            ')',
        ].join('');
    }
}
class GroupOr extends Group {
    constructor(filters = []) {
        super(FilterComp.OR, filters);
    }
    _match(data) {
        return this.filters.some((cv) => cv.match(data));
    }
}
class GroupAnd extends Group {
    constructor(filters = []) {
        super(FilterComp.AND, filters);
    }
    _match(data) {
        return this.filters.every((cv) => cv.match(data));
    }
}
class GroupNot extends Group {
    constructor(filters = []) {
        super(FilterComp.NOT, filters);
    }
    _match(data) {
        return this.filters.every((cv) => {
            if (cv && typeof cv.match === 'function') {
                return !!!cv.match(data);
            }
        });
    }
    simplify() {
        return this;
    }
}
class Attribute {
    name;
    escapeChars = ['*', '(', ')', '\\', String.fromCharCode(0)];
    constructor(name) {
        this.name = name;
    }
    present() {
        return new Filter(this.name, FilterComp.EQ, '*');
    }
    raw(value) {
        return new Filter(this.name, FilterComp.EQ, value);
    }
    equalTo(value) {
        return new Filter(this.name, FilterComp.EQ, this.escape(value));
    }
    endsWith(value) {
        return new Filter(this.name, FilterComp.EQ, '*' + this.escape(value));
    }
    startsWith(value) {
        return new Filter(this.name, FilterComp.EQ, this.escape(value) + '*');
    }
    contains(value) {
        return new Filter(this.name, FilterComp.EQ, '*' + this.escape(value) + '*');
    }
    approx(value) {
        return new Filter(this.name, FilterComp.APPROX, this.escape(value));
    }
    lte(value) {
        return new Filter(this.name, FilterComp.LTE, this.escape(value));
    }
    gte(value) {
        return new Filter(this.name, FilterComp.GTE, this.escape(value));
    }
    escape(value) {
        if (typeof value === 'number') {
            value = value.toString();
        }
        const rv = [];
        for (let i = 0, l = value.length; i < l; i++) {
            rv.push(this.escapeChars.indexOf(value[i]) >= 0 ? '\\' + value.charCodeAt(i).toString(16) : value[i]);
        }
        return rv.join('');
    }
}

const MAX_LENGTH = 256;
const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991;
// 正则标识
// 数字，禁止纯数字补 0
const NUMERIC_IDENTIFIER = '0|[1-9]\\d*';
const BUILD_IDENTIFIER = `[0-9A-Za-z-]+`;
// 数字和字母组合，达到禁止纯数字补0的目的
const NON_NUMERIC_IDENTIFIER = '\\d*[a-zA-Z-][a-zA-Z0-9-]*';
const MAIN_VERSION_IDENTIFIER = `(${NUMERIC_IDENTIFIER})\\.(${NUMERIC_IDENTIFIER})\\.(${NUMERIC_IDENTIFIER})`;
// 先行版本号，由 ASCII 码的英数字和连接号 [0-9A-Za-z-] 组成，
// 且“禁止 MUST NOT ”留白。数字型的标识符号“禁止 MUST NOT ”在前方补零
const PRERELEASE_IDENTIFIER = `(?:${NUMERIC_IDENTIFIER}|${NON_NUMERIC_IDENTIFIER})`;
const PRERELEASE = `(?:\\-(${PRERELEASE_IDENTIFIER}(?:\\.${PRERELEASE_IDENTIFIER})*))`;
// 编译版本号
const BUILD = `(?:\\+(${BUILD_IDENTIFIER}(?:\\.${BUILD_IDENTIFIER})*))`;
const FULL_VERSION_IDENTIFIER = `^v?${MAIN_VERSION_IDENTIFIER}${PRERELEASE}?${BUILD}?$`;
const REGEX_FULL_VERSION = new RegExp(FULL_VERSION_IDENTIFIER);
const REGEX_NUMERIC = /^[0-9]+$/;
class SemverVersion {
    rawVersion;
    major;
    minor;
    patch;
    prereleaseArray;
    prerelease;
    build;
    mainVersion;
    version;
    constructor(version) {
        if (version instanceof SemverVersion) {
            return version;
        }
        else if (typeof version !== 'string') {
            throw new TypeError('Invalid Version: ' + version);
        }
        if (version.length > MAX_LENGTH) {
            throw new TypeError(`version is longer than ${MAX_LENGTH} characters`);
        }
        if (!(this instanceof SemverVersion)) {
            return new SemverVersion(version);
        }
        const matches = version.trim().match(REGEX_FULL_VERSION);
        this.rawVersion = version;
        this.major = +matches[1];
        this.minor = +matches[2];
        this.patch = +matches[3];
        this._isThrowVersionNumericError(this.major, 'major');
        this._isThrowVersionNumericError(this.minor, 'minor');
        this._isThrowVersionNumericError(this.patch, 'patch');
        if (matches[4]) {
            this.prereleaseArray = matches[4].split('.').map(function (id) {
                if (REGEX_NUMERIC.test(id)) {
                    var num = +id;
                    if (num >= 0 && num < MAX_SAFE_INTEGER) {
                        return num;
                    }
                }
                return id;
            });
        }
        else {
            this.prereleaseArray = [];
        }
        //this.build = matches[5] ? matches[5].split('.') : [];
        this.prerelease = matches[4];
        this.build = matches[5];
        this.mainVersion = [this.major, this.minor, this.patch].join('.');
        this.version =
            this.mainVersion + (this.prerelease ? `-${this.prerelease}` : '') + (this.build ? `+${this.build}` : '');
    }
    _isThrowVersionNumericError(versionNumber, versionName) {
        if (versionNumber > MAX_SAFE_INTEGER || this.major < 0) {
            throw new TypeError(`Invalid ${versionName} version`);
        }
    }
    _isNumeric(numeric) {
        return REGEX_NUMERIC.test(numeric);
    }
    _padNumber(num, fill) {
        const length = ('' + num).length;
        return Array(fill > length ? fill - length + 1 || 0 : 0).join(0) + num;
    }
    static validate(version) {
        return REGEX_FULL_VERSION.test(version);
    }
    mainVersionToNumeric(digit) {
        const numericStr = [
            this._padNumber(this.major, digit),
            this._padNumber(this.minor, digit),
            this._padNumber(this.patch, digit),
        ].join('');
        return parseInt(numericStr);
    }
    compare(other, needCompareBuildVersion = false) {
        let otherSemver = other;
        if (!(other instanceof SemverVersion)) {
            otherSemver = new SemverVersion(other);
        }
        const result = this.compareMainVersion(otherSemver) || this.comparePreReleaseVersion(otherSemver);
        if (!result && needCompareBuildVersion) {
            return this.compareBuildVersion(otherSemver);
        }
        else {
            return result;
        }
    }
    // 比较数字
    compareNumeric(a, b) {
        return a > b ? 1 : a < b ? -1 : 0;
    }
    compareIdentifiers(a, b) {
        const aIsNumeric = this._isNumeric(a);
        const bIsNumeric = this._isNumeric(b);
        if (aIsNumeric && bIsNumeric) {
            a = +a;
            b = +b;
        }
        // 字符比数字大
        if (aIsNumeric && !bIsNumeric) {
            return -1;
        }
        else if (bIsNumeric && !aIsNumeric) {
            return 1;
        }
        else {
            return this.compareNumeric(a, b);
        }
    }
    compareMainVersion(otherSemver) {
        return (this.compareNumeric(this.major, otherSemver.major) ||
            this.compareNumeric(this.minor, otherSemver.minor) ||
            this.compareNumeric(this.patch, otherSemver.patch));
    }
    comparePreReleaseVersion(otherSemver) {
        if (this.prereleaseArray.length && !otherSemver.prereleaseArray.length) {
            return -1;
        }
        else if (!this.prereleaseArray.length && otherSemver.prereleaseArray.length) {
            return 1;
        }
        else if (!this.prereleaseArray.length && !otherSemver.prereleaseArray.length) {
            return 0;
        }
        let i = 0;
        do {
            const a = this.prereleaseArray[i];
            const b = otherSemver.prereleaseArray[i];
            if (a === undefined && b === undefined) {
                return 0;
            }
            else if (b === undefined) {
                return 1;
            }
            else if (a === undefined) {
                return -1;
            }
            else if (a === b) {
                continue;
            }
            else {
                return this.compareIdentifiers(a, b);
            }
        } while (++i);
    }
    compareBuildVersion(otherSemver) {
        if (this.build && !otherSemver.build) {
            return 1;
        }
        else if (!this.build && otherSemver.build) {
            return -1;
        }
        else {
            return this.compareIdentifiers(this.build, otherSemver.build);
        }
    }
}

const compare = (a, b, needCompareBuildVersion) => {
    return new SemverVersion(a).compare(new SemverVersion(b), needCompareBuildVersion);
};
const gte = (a, b, needCompareBuildVersion) => {
    const result = compare(a, b, needCompareBuildVersion);
    return result === 1 || result === 0;
};
const lte = (a, b, needCompareBuildVersion) => {
    const result = compare(a, b, needCompareBuildVersion);
    return result === -1 || result === 0;
};
const equal = (a, b, needCompareBuildVersion) => {
    const result = compare(a, b, needCompareBuildVersion);
    return result === 0;
};

class SemVerImpl {
    version;
    constructor(version) {
        this.version = version;
    }
    toString() {
        return this.version.toString();
    }
    compare(other) {
        return compare(this.version, other.toString());
    }
    equal(other) {
        return equal(this.version, other);
    }
    lte(other) {
        return lte(this.version, other);
    }
    gte(other) {
        return gte(this.version, other);
    }
    neq(other) {
        return !this.equal(other);
    }
}

class CapabilitySet {
    indices = {};
    capSet = new Set();
    constructor(indexProps = []) {
        for (const indexProp in indexProps) {
            this.indices[indexProp] = {};
        }
    }
    match(sf, obeyMandatory) {
        const matches = this.matchCapSet(this.capSet, sf);
        return obeyMandatory ? CapabilitySet.matchMandatoryCapSet(matches, sf) : matches;
    }
    addCapability(cap) {
        this.capSet.add(cap);
        for (const [key, value] of Object.entries(this.indices)) {
            let value = cap.getAttributes()[key];
            if (isAllPresent(value)) {
                const index = value;
                if (Array.isArray(value)) {
                    const c = value;
                    for (const o of c) {
                        CapabilitySet.indexCapability(index, cap, o);
                    }
                }
                else {
                    CapabilitySet.indexCapability(index, cap, value);
                }
            }
        }
    }
    removeCapability(cap) {
        const hadCap = this.capSet.has(cap);
        this.capSet.delete(cap);
        if (hadCap) {
            for (const [key, eValue] of Object.entries(this.indices)) {
                let value = cap.getAttributes()[key];
                if (isAllPresent(value)) {
                    const index = eValue;
                    if (Array.isArray(value)) {
                        const c = value;
                        for (const o of c) {
                            CapabilitySet.deindexCapability(index, cap, o);
                        }
                    }
                    else {
                        CapabilitySet.deindexCapability(index, cap, value);
                    }
                }
            }
        }
    }
    static matches(cap, sf) {
        return CapabilitySet.matchesInternal(cap, sf) && CapabilitySet.matchMandatory(cap, sf);
    }
    static matchMandatory(cap, sf) {
        if (isAnyMissing(sf)) {
            return false;
        }
        const attrs = cap.getAttributes();
        for (const key of Object.keys(attrs)) {
            if (cap.isAttributeMandatory(key) && !CapabilitySet.matchMandatoryAttribute(key, sf)) {
                return false;
            }
        }
        return true;
    }
    static matchMandatoryAttribute(attrName, sf) {
        if (!sf) {
            return false;
        }
        if (sf.attrib !== null && sf.attrib !== undefined && sf.attrib === attrName) {
            return true;
        }
        else if (sf.comp === FilterComp.AND) {
            let list = sf.filters;
            for (let i = 0; i < list.length; i++) {
                let sf2 = list[i];
                if (sf2.attrib !== null && sf.attrib !== undefined && sf2.attrib === attrName) {
                    return true;
                }
            }
        }
        return false;
    }
    static compare(lhs, rhsUnknown, cmp) {
        if (isAnyMissing(lhs)) {
            return false;
        }
        if (cmp === FilterComp.PRESENT) {
            return true;
        }
        const rhs = typeof rhsUnknown === 'string' ? rhsUnknown.trim() : rhsUnknown;
        if (typeof lhs === 'boolean') {
            switch (cmp) {
                case FilterComp.EQ:
                case FilterComp.GTE:
                case FilterComp.LTE:
                    return lhs === (rhs === 'true');
                default:
                    throw new Error('Unsupported comparison operator: ' + cmp);
            }
        }
        if (typeof lhs === 'number') {
            switch (cmp) {
                case FilterComp.EQ:
                    return lhs === Number(rhs);
                case FilterComp.GTE:
                    return lhs >= Number(rhs);
                case FilterComp.LTE:
                    return lhs <= Number(rhs);
                default:
                    throw new Error('Unsupported comparison operator: ' + cmp);
            }
        }
        if (lhs instanceof SemVerImpl) {
            switch (cmp) {
                case FilterComp.EQ:
                    return equal(lhs.toString(), rhs.toString());
                case FilterComp.NOT:
                    return !equal(lhs.toString(), rhs.toString());
                case FilterComp.GTE:
                    return gte(lhs.toString(), rhs.toString());
                case FilterComp.LTE:
                    return lte(lhs.toString(), rhs.toString());
                default:
                    throw new Error('Unsupported comparison operator: ' + cmp);
            }
        }
        if (typeof lhs === 'string') {
            switch (cmp) {
                case FilterComp.EQ:
                    return lhs === rhs;
                case FilterComp.NOT:
                    return lhs !== rhs;
                default:
                    throw new Error('Unsupported comparison operator: ' + cmp);
            }
        }
        if (Array.isArray(lhs)) {
            for (let a of lhs) {
                if (CapabilitySet.compare(a, rhsUnknown, cmp)) {
                    return true;
                }
            }
            return false;
        }
        return false;
    }
    static indexCapability(index, cap, capValue) {
        let caps = new Set();
        const prevVal = index[capValue];
        if (!prevVal) {
            index[capValue] = caps;
        }
        if (isAllPresent(prevVal)) {
            caps = prevVal;
        }
        caps.add(cap);
    }
    static deindexCapability(index, cap, value) {
        let caps = index[value];
        if (isAllPresent(caps)) {
            caps.delete(cap);
            if (caps.size === 0) {
                delete index[value];
            }
        }
    }
    static matchMandatoryCapSet(caps, sf) {
        for (const cap of caps) {
            if (!CapabilitySet.matchMandatory(cap, sf)) {
                caps.delete(cap);
            }
        }
        return caps;
    }
    matchCapSet(caps, sf) {
        let matches = new Set();
        if (sf.comp === FilterComp.MATCH_ALL) {
            caps.forEach((c) => matches.add(c));
        }
        else if (sf.comp === FilterComp.AND) {
            const sfs = sf.filters;
            for (let i = 0; caps.size > 0 && i < sfs.length; i++) {
                matches = this.matchCapSet(caps, sfs[i]);
                caps = matches;
            }
        }
        else if (sf.comp === FilterComp.OR) {
            const sfs = sf.filters;
            for (let i = 0; i < sfs.length; i++) {
                this.matchCapSet(caps, sfs[i]).forEach((c) => matches.add(c));
            }
        }
        else if (sf.comp === FilterComp.NOT) {
            caps.forEach((c) => matches.add(c));
            const sfs = sf.filters;
            for (let i = 0; i < sfs.length; i++) {
                const ms = this.matchCapSet(caps, sfs[i]);
                ms.forEach((c) => matches.delete(c));
            }
        }
        else {
            const index = this.indices[sf.attrib];
            if (sf.comp === FilterComp.EQ && isAllPresent(index)) {
                const existingCaps = index[sf.attrib];
                if (isAllPresent(existingCaps)) {
                    existingCaps.forEach((c) => matches.add(c));
                    if (caps !== this.capSet) {
                        caps.forEach((c) => {
                            if (!matches.has(c)) {
                                matches.delete(c);
                            }
                        });
                    }
                }
            }
            else {
                for (const cap of caps) {
                    const lhs = cap.getAttributes()[sf.attrib];
                    if (isAllPresent(lhs)) {
                        if (CapabilitySet.compare(lhs, sf.value, sf.comp)) {
                            matches.add(cap);
                        }
                    }
                }
            }
        }
        return matches;
    }
    static matchesInternal(cap, sf) {
        let matched = true;
        if (isAnyMissing(sf)) {
            matched = false;
        }
        else if (sf.comp === FilterComp.MATCH_ALL) {
            matched = true;
        }
        else if (sf.comp === FilterComp.AND) {
            const sfs = sf.filters;
            for (let i = 0; matched && i < sfs.length; i++) {
                matched = CapabilitySet.matchesInternal(cap, sfs[i]);
            }
        }
        else if (sf.comp === FilterComp.OR) {
            matched = false;
            const sfs = sf.filters;
            for (let i = 0; !matched && i < sfs.length; i++) {
                matched = CapabilitySet.matchesInternal(cap, sfs[i]);
            }
        }
        else if (sf.comp === FilterComp.NOT) {
            const sfs = sf.filters;
            for (let i = 0; i < sfs.length; i++) {
                matched = !CapabilitySet.matchesInternal(cap, sfs[i]);
            }
        }
        else {
            matched = false;
            const lhs = cap.getAttributes()[sf.attrib];
            if (lhs !== null && lhs !== undefined) {
                matched = CapabilitySet.compare(lhs, sf.value, sf.comp);
            }
        }
        return matched;
    }
}

class BundleRequirementImpl {
    revision;
    namespace;
    filter;
    optional;
    dirs = {};
    attrs = {};
    constructor(revision, namespace, dirs = {}, attrs = {}, filter) {
        this.revision = revision;
        this.namespace = namespace;
        this.dirs = dirs;
        this.attrs = attrs;
        this.filter = filter || Filter.convert(this.attrs);
        this.optional =
            this.dirs.hasOwnProperty(RESOLUTION_DIRECTIVE) && this.dirs[RESOLUTION_DIRECTIVE] === RESOLUTION_OPTIONAL;
    }
    getAttributes() {
        return this.attrs;
    }
    getDirectives() {
        return this.dirs;
    }
    getNamespace() {
        return this.namespace;
    }
    getResource() {
        return this.revision;
    }
    getRevision() {
        return this.revision;
    }
    matches(capability) {
        return CapabilitySet.matches(capability, this.getFilter());
    }
    isOptional() {
        return this.optional;
    }
    getFilter() {
        return this.filter;
    }
    toString() {
        return '[' + this.revision + '] ' + this.namespace + '; ' + this.getFilter()?.toString();
    }
}

class ManifestParserImpl {
    configMap;
    headerMap;
    requirements = [];
    capabilities = [];
    bundleSymbolicName;
    bundleVersion;
    activationIncludeDir;
    activationExcludeDir;
    activationPolicy = 'EAGER_ACTIVATION';
    static EMPTY_VERSION = new SemVerImpl('0.0.0');
    constructor(configMap, owner, headerMap) {
        this.configMap = configMap;
        this.headerMap = headerMap;
        const capList = [];
        // Parse bundle version.
        this.bundleVersion = ManifestParserImpl.EMPTY_VERSION;
        if (headerMap[BUNDLE_VERSION] !== null && headerMap[BUNDLE_VERSION] !== undefined) {
            try {
                this.bundleVersion = new SemVerImpl(headerMap[BUNDLE_VERSION]);
            }
            catch (ex) {
                if (this.getManifestVersion() === '2') {
                    throw ex;
                }
                this.bundleVersion = ManifestParserImpl.EMPTY_VERSION;
            }
        }
        // Parse bundle symbolic name.
        const bundleCap = ManifestParserImpl.parseBundleSymbolicName(owner, this.headerMap);
        if (bundleCap) {
            this.bundleSymbolicName = bundleCap.getAttributes()[BUNDLE_NAMESPACE];
            if (!headerMap[FRAGMENT_HOST]) {
                capList.push(bundleCap);
            }
            capList.push(ManifestParserImpl.addIdentityCapability(owner, headerMap, bundleCap));
        }
        // Verify that bundle symbolic name is specified.
        if (this.getManifestVersion() === '2' && !this.bundleSymbolicName) {
            throw new Error('R4 bundle manifests must include bundle symbolic name.');
        }
        // Parse Require-Bundle
        let rbClauses = ManifestParserImpl.parseStandardHeader(headerMap[REQUIRE_BUNDLE]);
        rbClauses = ManifestParserImpl.normalizeRequireClauses(rbClauses, this.getManifestVersion());
        const rbReqs = ManifestParserImpl.convertRequires(rbClauses, owner);
        // Parse Require-Capability.
        const requireCaps = [];
        if (Array.isArray(headerMap[REQUIRE_CAPABILITY])) {
            for (const part of headerMap[REQUIRE_CAPABILITY]) {
                requireCaps.push(...ManifestParserImpl.getRequiredClauses(part.trim(), owner));
            }
        }
        else if (typeof headerMap[REQUIRE_CAPABILITY] === 'string') {
            requireCaps.push(...ManifestParserImpl.getRequiredClauses(headerMap[REQUIRE_CAPABILITY].trim(), owner));
        }
        // Parse Provide-Capability.
        const provideCaps = [];
        if (Array.isArray(headerMap[PROVIDE_CAPABILITY])) {
            for (const part of headerMap[PROVIDE_CAPABILITY]) {
                provideCaps.push(...ManifestParserImpl.getProviderClauses(part.trim(), owner));
            }
        }
        else if (typeof headerMap[PROVIDE_CAPABILITY] === 'string') {
            provideCaps.push(...ManifestParserImpl.getProviderClauses(headerMap[PROVIDE_CAPABILITY].trim(), owner));
        }
        // Combine all requirements.
        this.requirements = [];
        this.requirements.push(...rbReqs);
        this.requirements.push(...requireCaps);
        // Combine all capabilities.
        this.capabilities = [];
        this.capabilities.push(...capList);
        this.capabilities.push(...provideCaps);
        // Parse activation policy.
        this.parseActivationPolicy(headerMap);
    }
    static getProviderClauses(part, owner) {
        let provideClauses = ManifestParserImpl.parseStandardHeader(part);
        provideClauses = ManifestParserImpl.normalizeCapabilityClauses(provideClauses);
        return ManifestParserImpl.convertProvideCapabilities(provideClauses, owner);
    }
    static getRequiredClauses(part, owner) {
        let provideClauses = ManifestParserImpl.parseStandardHeader(part);
        provideClauses = ManifestParserImpl.normalizeCapabilityClauses(provideClauses);
        return ManifestParserImpl.convertRequireCapabilities(provideClauses, owner);
    }
    getActivationIncludeDirective() {
        return this.activationIncludeDir;
    }
    getActivationExcludeDirective() {
        return this.activationExcludeDir;
    }
    getActivationPolicy() {
        return this.activationPolicy;
    }
    getSymbolicName() {
        return this.bundleSymbolicName;
    }
    getBundleVersion() {
        return this.bundleVersion;
    }
    getName(path) {
        const idx = path.lastIndexOf('/');
        return idx > -1 ? path.substring(idx) : path;
    }
    getCapabilities() {
        return this.capabilities;
    }
    getRequirements() {
        return this.requirements;
    }
    static parseDelimitedString(value, delim, trim = true) {
        if (isAnyMissing(value)) {
            value = '';
        }
        const list = [];
        const CHAR = 1;
        const DELIMITER = 2;
        const STARTQUOTE = 4;
        const ENDQUOTE = 8;
        let sb = '';
        let expecting = CHAR | DELIMITER | STARTQUOTE;
        let isEscaped = false;
        for (let i = 0; i < value.length; i++) {
            const c = value.charAt(i);
            const isDelimiter = delim.indexOf(c) >= 0;
            if (!isEscaped && c == '\\') {
                isEscaped = true;
                continue;
            }
            if (isEscaped) {
                sb += c;
            }
            else if (isDelimiter && (expecting & DELIMITER) > 0) {
                if (trim) {
                    list.push(sb.toString().trim());
                }
                else {
                    list.push(sb.toString());
                }
                sb = '';
                expecting = CHAR | DELIMITER | STARTQUOTE;
            }
            else if (c == '"' && (expecting & STARTQUOTE) > 0) {
                sb += c;
                expecting = CHAR | ENDQUOTE;
            }
            else if (c == '"' && (expecting & ENDQUOTE) > 0) {
                sb += c;
                expecting = CHAR | STARTQUOTE | DELIMITER;
            }
            else if ((expecting & CHAR) > 0) {
                sb += c;
            }
            else {
                throw new Error('Invalid delimited string: ' + value);
            }
            isEscaped = false;
        }
        if (sb.length > 0) {
            if (trim) {
                list.push(sb.toString().trim());
            }
            else {
                list.push(sb.toString());
            }
        }
        return list;
    }
    getManifestVersion() {
        const manifestVersion = ManifestParserImpl.getManifestVersion(this.headerMap);
        return isAnyMissing(manifestVersion) ? '1' : manifestVersion;
    }
    static getManifestVersion(headerMap) {
        const manifestVersion = headerMap[BUNDLE_MANIFESTVERSION];
        return isAnyMissing(manifestVersion) ? null : manifestVersion.trim();
    }
    static parseBundleSymbolicName(owner, headerMap) {
        const clauses = this.normalizeCapabilityClauses(this.parseStandardHeader(headerMap[BUNDLE_SYMBOLICNAME]));
        if (clauses.length > 0) {
            if (clauses.length > 1) {
                throw new Error('Cannot have multiple symbolic names: ' + headerMap[BUNDLE_SYMBOLICNAME]);
            }
            else if (clauses[0].paths.length > 1) {
                throw new Error('Cannot have multiple symbolic names: ' + headerMap[BUNDLE_SYMBOLICNAME]);
            }
            else if (clauses[0].attrs.hasOwnProperty(BUNDLE_VERSION)) {
                throw new Error('Cannot have a bundle version: ' + headerMap[BUNDLE_VERSION]);
            }
            // Get bundle version.
            let bundleVersion = this.EMPTY_VERSION;
            if (headerMap[BUNDLE_VERSION] !== null && headerMap[BUNDLE_VERSION] !== undefined) {
                try {
                    bundleVersion = new SemVerImpl(headerMap[BUNDLE_VERSION]);
                }
                catch (ex) {
                    let mv = this.getManifestVersion(headerMap);
                    if (mv !== null && mv !== undefined) {
                        throw ex;
                    }
                    bundleVersion = this.EMPTY_VERSION;
                }
            }
            // Create a require capability and return it.
            const symName = clauses[0].paths[0];
            clauses[0].attrs[BUNDLE_NAMESPACE] = symName;
            clauses[0].attrs[BUNDLE_VERSION_ATTRIBUTE] = bundleVersion;
            return new BundleCapabilityImpl(owner, BUNDLE_NAMESPACE, clauses[0].dirs, clauses[0].attrs);
        }
        return undefined;
    }
    static parseStandardHeader(header) {
        const clauses = [];
        if (isAnyMissing(header)) {
            return clauses;
        }
        if (!header.match(/[,;:=]/)) {
            const clause = new ParsedHeaderClause([header], {}, {}, {});
            clauses.push(clause);
            return clauses;
        }
        const semiColons = header.split(';');
        let clause;
        let dirs = {};
        let attrs = {};
        let types = {};
        semiColons.forEach((value, index) => {
            const trimValue = value.trim();
            if (index === 0 && !trimValue.match(/[:=]/)) {
                clause = new ParsedHeaderClause([trimValue], dirs, attrs, types);
            }
            const isDirective = trimValue.includes(':=');
            const isAttribute = trimValue.includes('=');
            if (isDirective) {
                const [dirKey, dirValue] = trimValue.split(':=');
                dirs[dirKey] = dirValue.trim().replace(/"|\\"/g, '').toString();
            }
            else if (isAttribute) {
                const [attrKey, attrValue] = trimValue.split('=');
                const valueEscaped = attrValue.trim().replace(/"|\\"/g, '').toString();
                const isCasted = attrKey.includes(':');
                if (!isCasted) {
                    attrs[attrKey] = valueEscaped;
                }
                else {
                    const [attrKeyTyped, attrType] = attrKey.split(':');
                    types[attrKeyTyped] = attrType;
                    if (attrType === 'number') {
                        attrs[attrKeyTyped] = Number(valueEscaped);
                    }
                    else if (attrType === 'boolean') {
                        attrs[attrKeyTyped] = valueEscaped === 'true';
                    }
                    else if (attrType === 'SemVer') {
                        attrs[attrKeyTyped] = new SemVerImpl(valueEscaped);
                    }
                    else if (attrType.startsWith('Array')) {
                        attrs[attrKeyTyped] = valueEscaped;
                    }
                    else {
                        attrs[attrKeyTyped] = valueEscaped;
                    }
                }
            }
        });
        clauses.push(clause);
        return clauses;
    }
    static normalizeCapabilityClauses(clauses) {
        for (const clause of clauses) {
            for (const [key, type] of Object.entries(clause.types)) {
                if (type !== 'string') {
                    if (type === 'number') {
                        clause.attrs[key] = Number(clause.attrs[key].toString().trim());
                    }
                    else if (type === 'SemVer') {
                        clause.attrs[key] = new SemVerImpl(clause.attrs[key].toString().trim());
                    }
                    else if (type.startsWith('Array')) {
                        let startIdx = type.indexOf('<');
                        let endIdx = type.indexOf('>');
                        if ((startIdx > 0 && endIdx <= startIdx) || (startIdx < 0 && endIdx > 0)) {
                            throw new Error("Invalid Provide-Capability attribute list type for '" + key + "' : " + type);
                        }
                        let listType = 'string';
                        if (endIdx > startIdx) {
                            listType = type.substring(startIdx + 1, endIdx).trim();
                        }
                        const tokens = ManifestParserImpl.parseDelimitedString(clause.attrs[key].toString().trim(), ',', false);
                        const values = [];
                        for (let token of tokens) {
                            if (listType === 'string') {
                                values.push(token);
                            }
                            else if (listType === 'number') {
                                values.push(Number(token.trim()));
                            }
                            else if (listType === 'SemVer') {
                                values.push(new SemVerImpl(token.trim()));
                            }
                            else {
                                throw new Error("Unknown Provide-Capability attribute list type for '" + key + "' : " + type);
                            }
                        }
                        clause.attrs[key] = values;
                    }
                    else {
                        throw new Error("Unknown Provide-Capability attribute type for '" + key + "' : " + type);
                    }
                }
            }
        }
        return clauses;
    }
    static addIdentityCapability(owner, headerMap, bundleCap) {
        const attrs = { ...bundleCap.getAttributes() };
        attrs[IDENTITY_NAMESPACE] = bundleCap.getAttributes()[BUNDLE_NAMESPACE];
        attrs[CAPABILITY_TYPE_ATTRIBUTE] = !headerMap[FRAGMENT_HOST] ? TYPE_BUNDLE : TYPE_FRAGMENT;
        attrs[CAPABILITY_VERSION_ATTRIBUTE] = bundleCap.getAttributes()[BUNDLE_VERSION_ATTRIBUTE];
        if (headerMap[BUNDLE_COPYRIGHT]) {
            attrs[CAPABILITY_COPYRIGHT_ATTRIBUTE] = headerMap[BUNDLE_COPYRIGHT];
        }
        if (headerMap[BUNDLE_DESCRIPTION]) {
            attrs[CAPABILITY_DESCRIPTION_ATTRIBUTE] = headerMap[BUNDLE_DESCRIPTION];
        }
        let dirs;
        if (bundleCap.getDirectives()[SINGLETON_DIRECTIVE]) {
            dirs = { [CAPABILITY_SINGLETON_DIRECTIVE]: bundleCap.getDirectives()[SINGLETON_DIRECTIVE] };
        }
        else {
            dirs = {};
        }
        return new BundleCapabilityImpl(owner, IDENTITY_NAMESPACE, dirs, attrs);
    }
    static normalizeRequireClauses(clauses, mv) {
        if (mv !== '2') {
            clauses.length = 0;
        }
        else {
            for (const clause of clauses) {
                let value = clause.attrs[BUNDLE_VERSION_ATTRIBUTE];
                if (value !== null && value !== undefined) {
                    clause.attrs[BUNDLE_VERSION_ATTRIBUTE] = new SemVerImpl(value.toString());
                }
            }
        }
        return clauses;
    }
    static convertRequires(clauses, owner) {
        const reqList = [];
        for (const clause of clauses) {
            for (const path of clause.paths) {
                const attrs = clause.attrs;
                const newAttrs = {
                    [BUNDLE_NAMESPACE]: path,
                    ...attrs,
                    [BUNDLE_NAMESPACE]: path, // ensure it's not overwritten
                };
                const sf = Filter.convert(newAttrs);
                const dirs = clause.dirs;
                const newDirs = {
                    ...dirs,
                    FILTER_DIRECTIVE: sf.toString(),
                };
                reqList.push(new BundleRequirementImpl(owner, BUNDLE_NAMESPACE, newDirs, newAttrs));
            }
        }
        return reqList;
    }
    static convertRequireCapabilities(clauses, owner) {
        const reqList = [];
        for (const clause of clauses) {
            try {
                let filterStr = clause.dirs[FILTER_DIRECTIVE];
                const sf = !!filterStr
                    ? Filter.parse(filterStr.trim().replace(/"|\\"/g, '').toString())
                    : new Filter(null, FilterComp.MATCH_ALL, null, []);
                for (const path of clause.paths) {
                    if (path.startsWith('pandino.wiring.')) {
                        throw new Error("Manifest cannot use Require-Capability for '" + path + "' namespace.");
                    }
                    reqList.push(new BundleRequirementImpl(owner, path, clause.dirs, clause.attrs, sf));
                }
            }
            catch (ex) {
                throw new Error('Error creating requirement: ' + ex);
            }
        }
        return reqList;
    }
    static convertProvideCapabilities(clauses, owner) {
        const capList = [];
        for (const clause of clauses) {
            for (const path of clause.paths) {
                if (path.startsWith('pandino.wiring.')) {
                    throw new Error("Manifest cannot use Provide-Capability for '" + path + "' namespace.");
                }
                capList.push(new BundleCapabilityImpl(owner, path, clause.dirs, clause.attrs));
            }
        }
        return capList;
    }
    parseActivationPolicy(headerMap) {
        this.activationPolicy = 'EAGER_ACTIVATION';
        const clauses = ManifestParserImpl.parseStandardHeader(headerMap[BUNDLE_ACTIVATIONPOLICY]);
        if (clauses.length > 0) {
            for (const path of clauses[0].paths) {
                if (path === ACTIVATION_LAZY) {
                    this.activationPolicy = 'LAZY_ACTIVATION';
                    for (const [key, value] of Object.entries(clauses[0].dirs)) {
                        if (key.toLowerCase() === INCLUDE_DIRECTIVE.toLowerCase()) {
                            this.activationIncludeDir = value;
                        }
                        else if (key.toLowerCase() === EXCLUDE_DIRECTIVE.toLowerCase()) {
                            this.activationExcludeDir = value;
                        }
                    }
                    break;
                }
            }
        }
    }
}

class BundleRevisionImpl {
    id;
    headerMap;
    manifestVersion;
    symbolicName;
    version;
    declaredCaps = [];
    declaredReqs = [];
    bundle;
    declaredActivationPolicy;
    wiring;
    constructor(bundle, id, headerMap) {
        this.bundle = bundle;
        this.id = id;
        this.headerMap = headerMap;
        const mp = new ManifestParserImpl(bundle.getFramework().getConfig(), this, headerMap);
        this.manifestVersion = mp.getManifestVersion();
        this.version = mp.getBundleVersion();
        this.declaredCaps = mp.getCapabilities();
        this.declaredReqs = mp.getRequirements();
        this.declaredActivationPolicy = mp.getActivationPolicy();
        this.symbolicName = mp.getSymbolicName();
    }
    getDeclaredActivationPolicy() {
        return this.declaredActivationPolicy;
    }
    equals(other) {
        if (isAnyMissing(other) || !(other instanceof BundleRevisionImpl)) {
            return false;
        }
        return this.getSymbolicName() === other.getSymbolicName() && this.getVersion().compare(other.getVersion()) === 0;
    }
    getBundle() {
        return this.bundle;
    }
    getCapabilities(namespace) {
        let result = this.declaredCaps;
        if (!isAnyMissing(namespace)) {
            result = this.declaredCaps.filter((cap) => cap.getNamespace() === namespace);
        }
        return result;
    }
    getDeclaredCapabilities(namespace) {
        let result = this.declaredCaps;
        if (!isAnyMissing(namespace)) {
            result = this.declaredCaps.filter((cap) => cap.getNamespace() === namespace);
        }
        return result;
    }
    getDeclaredRequirements(namespace) {
        let result = this.declaredReqs;
        if (isAllPresent(namespace)) {
            result = this.declaredReqs.filter((req) => req.getNamespace() === namespace);
        }
        return result;
    }
    getRequirements(namespace) {
        return this.getDeclaredRequirements(namespace);
    }
    getSymbolicName() {
        return this.symbolicName;
    }
    getVersion() {
        return this.version;
    }
    getWiring() {
        return this.wiring;
    }
    getHeaders() {
        return { ...this.headerMap };
    }
    getManifestVersion() {
        return this.manifestVersion;
    }
    getId() {
        return this.id;
    }
    resolve(wiring) {
        this.wiring = wiring;
    }
    toString() {
        return this.bundle + ' (R ' + this.id + ')';
    }
}

class BundleImpl {
    id;
    manifestLocation;
    deploymentRoot;
    headers;
    pandino;
    installingBundle;
    useDeclaredActivationPolicy;
    activator;
    context;
    state;
    revisions = [];
    currentRevision;
    logger;
    constructor(logger, id, headers, manifestLocation, deploymentRoot, pandino, installingBundle) {
        this.logger = logger;
        this.id = id;
        this.deploymentRoot = deploymentRoot;
        this.manifestLocation = manifestLocation;
        this.useDeclaredActivationPolicy = false;
        this.state = 'INSTALLED';
        this.headers = headers;
        this.pandino = pandino;
        this.installingBundle = installingBundle;
        if (isAllPresent(headers[BUNDLE_ACTIVATOR]) &&
            typeof headers[BUNDLE_ACTIVATOR].start === 'function') {
            this.activator = headers[BUNDLE_ACTIVATOR];
        }
        if (isAllPresent(pandino)) {
            const revision = this.createRevision();
            this.addRevision(revision);
        }
    }
    getRegisteredServices() {
        return this.getFramework().getBundleRegisteredServices(this);
    }
    getServicesInUse() {
        throw new Error('Method not implemented.');
    }
    getBundleId() {
        return this.id;
    }
    getBundleContext() {
        return this.context;
    }
    setBundleContext(context) {
        this.context = context;
    }
    getHeaders() {
        return this.headers;
    }
    getState() {
        return this.state;
    }
    setState(state) {
        this.state = state;
    }
    getSymbolicName() {
        return this.getCurrentRevision().getSymbolicName();
    }
    getVersion() {
        return this.getCurrentRevision().getVersion();
    }
    async start(options) {
        await this.getFramework().startBundle(this);
    }
    async stop(options) {
        await this.getFramework().stopBundle(this);
    }
    async uninstall() {
        return this.getFramework().uninstallBundle(this);
    }
    async update(headers, bundle) {
        await this.getFramework().updateBundle(this, headers, bundle);
    }
    getUniqueIdentifier() {
        return this.getSymbolicName() + '-' + this.getVersion().toString();
    }
    getActivator() {
        return this.activator;
    }
    setActivator(activator) {
        this.activator = activator;
    }
    getDeploymentRoot() {
        return this.deploymentRoot;
    }
    revise(headers) {
        const updatedRevision = this.createRevision(headers);
        this.addRevision(updatedRevision);
    }
    async refresh() {
        const current = this.getCurrentRevision();
        if (this.isRemovalPending()) {
            this.closeRevisions();
        }
        else {
            this.getFramework().getResolver().removeRevision(current);
            current.resolve(null);
        }
        this.revisions.length = 0;
        this.addRevision(current);
        this.state = 'INSTALLED';
    }
    createRevision(headers) {
        const revision = new BundleRevisionImpl(this, this.getBundleId() + '.' + this.revisions.length, headers || this.headers);
        let bundleVersion = revision.getVersion();
        bundleVersion = isAnyMissing(bundleVersion) ? new SemVerImpl('0.0.0') : bundleVersion;
        const symName = revision.getSymbolicName();
        const collisionCandidates = [];
        const bundles = this.getFramework().getBundles();
        for (let i = 0; Array.isArray(bundles) && i < bundles.length; i++) {
            const id = bundles[i].getBundleId();
            if (id !== this.getBundleId()) {
                if (symName === bundles[i].getSymbolicName() && equal(bundleVersion, bundles[i].getVersion())) {
                    collisionCandidates.push(bundles[i]);
                }
            }
        }
        if (collisionCandidates.length && isAllPresent(this.installingBundle)) {
            throw new Error('Bundle symbolic name and version are not unique: ' + symName + ':' + bundleVersion);
        }
        return revision;
    }
    closeRevisions() {
        for (const br of this.revisions) {
            this.getFramework().getResolver().removeRevision(br);
        }
    }
    isRemovalPending() {
        return this.state === 'UNINSTALLED' || this.revisions.length > 1;
    }
    addRevision(revision) {
        this.revisions.unshift(revision);
        this.currentRevision = revision;
        this.getFramework().getResolver().addRevision(revision);
    }
    getFramework() {
        return this.pandino;
    }
    getCurrentRevision() {
        return this.currentRevision;
    }
    getRevisions() {
        return this.revisions;
    }
    getLocation() {
        return this.manifestLocation;
    }
    toString() {
        return `${this.getSymbolicName()}: ${this.getVersion().toString()}`;
    }
}

class ListenerInfo {
    bundle;
    context;
    listener;
    filter;
    constructor(info, bundle, context, listener, filter) {
        if (info) {
            this.bundle = info.bundle;
            this.context = info.context;
            this.listener = info.listener;
            this.filter = info.filter;
        }
        else {
            this.bundle = bundle;
            this.context = context;
            this.listener = listener;
            this.filter = filter;
        }
    }
    getBundle() {
        return this.bundle;
    }
    getBundleContext() {
        return this.context;
    }
    getListener() {
        return this.listener;
    }
    getParsedFilter() {
        return this.filter;
    }
    getFilter() {
        if (!!this.filter) {
            return this.filter.toString();
        }
        return undefined;
    }
}

class ServiceEventImpl {
    type;
    reference;
    constructor(type, reference) {
        this.type = type;
        this.reference = reference;
    }
    getServiceReference() {
        return this.reference;
    }
    getType() {
        return this.type;
    }
    toString() {
        return `Service: ${this.reference.getProperty(SERVICE_ID)} changed state to: ${this.type}.`;
    }
}

class EventDispatcher {
    logger;
    svcListeners = new Map();
    bndListeners = new Map();
    fwkListeners = new Map();
    constructor(logger) {
        this.logger = logger;
    }
    fireServiceEvent(event, oldProps) {
        const listeners = new Map(this.svcListeners.entries());
        EventDispatcher.fireEventImmediately('SERVICE', listeners, event, oldProps);
    }
    fireFrameworkEvent(event, source) {
        const listeners = new Map(this.fwkListeners.entries());
        EventDispatcher.fireEventImmediately('FRAMEWORK', listeners, event, source);
    }
    fireBundleEvent(event, source) {
        const listeners = new Map(this.bndListeners.entries());
        EventDispatcher.fireEventImmediately('BUNDLE', listeners, event, source);
    }
    static fireEventImmediately(type, listeners, event, oldProps) {
        for (let [ctx, lstnrs] of listeners.entries()) {
            for (let info of lstnrs) {
                const bundle = info.getBundle();
                const listener = info.getListener();
                const filter = info.getParsedFilter();
                switch (type) {
                    case 'FRAMEWORK':
                        EventDispatcher.invokeFrameworkListenerCallback(bundle, listener, event);
                        break;
                    case 'BUNDLE':
                        EventDispatcher.invokeBundleListenerCallback(bundle, listener, event);
                        break;
                    case 'SERVICE':
                        EventDispatcher.invokeServiceListenerCallback(bundle, listener, event, filter, oldProps);
                        break;
                    default:
                        throw new Error(`Unhandled event type: ${type}!`);
                }
            }
        }
    }
    static invokeServiceListenerCallback(bundle, listener, event, filter, oldProps) {
        const validBundleStateTypes = ['STARTING', 'STOPPING', 'ACTIVE'];
        if (!validBundleStateTypes.includes(bundle.getState())) {
            return;
        }
        let matched = isAnyMissing(filter) ||
            CapabilitySet.matches(event.getServiceReference(), filter);
        if (matched) {
            listener.serviceChanged(event);
        }
        else if (event.getType() == 'MODIFIED') {
            if (!!filter && filter.match(oldProps)) {
                let se = new ServiceEventImpl('MODIFIED_ENDMATCH', event.getServiceReference());
                if (listener.isSync) {
                    listener.serviceChanged(se);
                }
                else {
                    setTimeout(() => listener.serviceChanged(se), 0);
                }
            }
        }
    }
    static invokeBundleListenerCallback(bundle, listener, event) {
        const validSyncEventBundleStateTypes = ['STARTING', 'STOPPING', 'ACTIVE'];
        if (validSyncEventBundleStateTypes.includes(bundle.getState())) {
            if (listener.isSync) {
                listener.bundleChanged(event);
            }
            else {
                setTimeout(() => listener.bundleChanged(event), 0);
            }
        }
    }
    static invokeFrameworkListenerCallback(bundle, listener, event) {
        const validBundleStateTypes = ['STARTING', 'ACTIVE'];
        if (validBundleStateTypes.includes(bundle.getState())) {
            if (listener.isSync) {
                listener.frameworkEvent(event);
            }
            else {
                setTimeout(() => listener.frameworkEvent(event), 0);
            }
        }
    }
    addListener(bc, type, listener, filter) {
        if (!listener) {
            throw new Error('Listener is missing');
        }
        const oldFilter = this.updateListener(bc, type, listener, filter);
        if (oldFilter) {
            return oldFilter;
        }
        try {
            bc.getBundle();
        }
        catch (ex) {
            // Bundle context is no longer valid, so just return.
            return undefined;
        }
        let listeners = null;
        if (type === 'FRAMEWORK') {
            listeners = this.fwkListeners;
        }
        else if (type === 'BUNDLE') {
            listeners = this.bndListeners;
        }
        else if (type === 'SERVICE') {
            listeners = this.svcListeners;
        }
        else {
            throw new Error('Unknown listener: ' + type);
        }
        const info = new ListenerInfo(null, bc.getBundle(), bc, listener, filter);
        listeners = EventDispatcher.addListenerInfo(listeners, info);
        if (type === 'FRAMEWORK') {
            this.fwkListeners = listeners;
        }
        else if (type === 'BUNDLE') {
            this.bndListeners = listeners;
        }
        else if (type === 'SERVICE') {
            this.svcListeners = listeners;
        }
        return undefined;
    }
    removeListener(bc, type, listener) {
        let listeners = null;
        if (!listener) {
            throw new Error('Listener is missing');
        }
        if (type === 'FRAMEWORK') {
            listeners = this.fwkListeners;
        }
        else if (type === 'BUNDLE') {
            listeners = this.bndListeners;
        }
        else if (type === 'SERVICE') {
            listeners = this.svcListeners;
        }
        else {
            throw new Error('Unknown listener: ' + type);
        }
        // Try to find the instance in our list.
        let idx = -1;
        for (let [bc, infos] of listeners.entries()) {
            for (let i = 0; i < infos.length; i++) {
                let info = infos[i];
                if (info.getBundleContext().equals(bc) && info.getListener() === listener) {
                    idx = i;
                    break;
                }
            }
        }
        if (idx >= 0) {
            listeners = EventDispatcher.removeListenerInfo(listeners, bc, idx);
        }
        if (type === 'FRAMEWORK') {
            this.fwkListeners = listeners;
        }
        else if (type === 'BUNDLE') {
            this.bndListeners = listeners;
        }
        else if (type === 'SERVICE') {
            this.svcListeners = listeners;
        }
    }
    removeListeners(bc) {
        this.fwkListeners = EventDispatcher.removeListenerInfos(this.fwkListeners, bc);
        this.bndListeners = EventDispatcher.removeListenerInfos(this.bndListeners, bc);
        this.svcListeners = EventDispatcher.removeListenerInfos(this.svcListeners, bc);
    }
    static removeListenerInfos(listeners, bc) {
        const copy = new Map(listeners.entries());
        copy.delete(bc);
        return copy;
    }
    static removeListenerInfo(listeners, bc, idx) {
        const copy = new Map(listeners.entries());
        const infos = [...copy.get(bc)];
        copy.delete(bc);
        if (Array.isArray(infos)) {
            infos.splice(idx, 1);
            if (infos.length > 0) {
                copy.set(bc, infos);
            }
            return copy;
        }
        return listeners;
    }
    updateListener(bc, type, listener, filter) {
        if (type === 'SERVICE') {
            // Verify that the bundle context is still valid.
            try {
                bc.getBundle();
            }
            catch (err) {
                return undefined;
            }
            const infos = this.svcListeners.get(bc);
            for (let i = 0; isAllPresent(infos) && i < infos.length; i++) {
                const info = infos[i];
                if (info.getBundleContext().equals(bc) && info.getListener() === listener) {
                    // The spec says to update the filter in this case.
                    const oldFilter = info.getParsedFilter();
                    const newInfo = new ListenerInfo(null, info.getBundle(), info.getBundleContext(), info.getListener(), filter);
                    this.svcListeners = EventDispatcher.updateListenerInfo(this.svcListeners, i, newInfo);
                    return oldFilter;
                }
            }
        }
        return undefined;
    }
    static updateListenerInfo(listeners, idx, info) {
        let copy = new Map(listeners);
        let infos = copy.get(info.getBundleContext());
        copy.delete(info.getBundleContext());
        if (isAllPresent(infos)) {
            infos = [...infos];
            infos[idx] = info;
            copy.set(info.getBundleContext(), infos);
            return copy;
        }
        return listeners;
    }
    static addListenerInfo(listeners, info) {
        if (!listeners.has(info.getBundleContext())) {
            listeners.set(info.getBundleContext(), []);
        }
        const infos = listeners.get(info.getBundleContext());
        infos.push(info);
        return listeners;
    }
}

class ServiceObjectsImpl {
    ref;
    context;
    pandino;
    constructor(ref, context, pandino) {
        this.ref = ref;
        this.context = context;
        this.pandino = pandino;
    }
    getService() {
        this.context.checkValidity();
        return this.pandino.getService(this.context.getBundle(), this.ref, true);
    }
    getServiceReference() {
        return this.ref;
    }
    ungetService(service) {
        this.context.checkValidity();
        if (isAllPresent(this.ref.getBundle()) && !this.pandino.ungetService(this.ref.getBundle(), this.ref, service)) {
            throw new Error(`Cannot unget service: ${service}`);
        }
    }
}

class AbstractTracked {
    closed = false;
    trackingCount = 0;
    tracked = new Map();
    adding = [];
    initial = [];
    setInitial(list = []) {
        for (const item of list) {
            if (!item) {
                continue;
            }
            this.initial.push(item);
        }
    }
    trackInitial() {
        while (true) {
            let item;
            if (this.closed || this.initial.length === 0) {
                return;
            }
            item = this.initial[0];
            this.initial.splice(0, 1);
            if (this.tracked.get(item)) {
                continue;
            }
            if (this.adding.includes(item)) {
                continue;
            }
            this.adding.push(item);
            this.trackAdding(item, undefined);
        }
    }
    close() {
        this.closed = true;
    }
    track(item, related) {
        let object;
        if (this.closed) {
            return;
        }
        object = this.tracked.get(item);
        if (isAnyMissing(object)) {
            if (this.adding.includes(item)) {
                return;
            }
            this.adding.push(item);
        }
        else {
            this.modified();
        }
        if (isAnyMissing(object)) {
            this.trackAdding(item, related);
        }
        else {
            this.customizerModified(item, object, related);
        }
    }
    untrack(item, related) {
        let object;
        const initialIdx = this.initial.findIndex((i) => i === item);
        if (initialIdx > -1) {
            this.initial.splice(initialIdx, 1);
            return;
        }
        const addingIdx = this.adding.findIndex((a) => a === item);
        if (addingIdx > -1) {
            this.adding.splice(addingIdx, 1);
            return;
        }
        object = this.tracked.get(item);
        this.tracked.delete(item);
        if (isAnyMissing(object)) {
            return;
        }
        this.modified();
        this.customizerRemoved(item, object, related);
    }
    size() {
        return this.tracked.size;
    }
    isEmpty() {
        return this.size() === 0;
    }
    getCustomizedObject(item) {
        return this.tracked.get(item);
    }
    copyKeys(list) {
        return [...list, ...Array.from(this.tracked.keys())];
    }
    modified() {
        this.trackingCount++;
    }
    getTrackingCount() {
        return this.trackingCount;
    }
    trackAdding(item, related) {
        let object;
        let becameUntracked = false;
        try {
            object = this.customizerAdding(item, related);
        }
        finally {
            const idx = this.adding.findIndex((a) => a === item);
            if (idx > -1 && !this.closed) {
                this.adding.splice(idx, 1);
                if (object) {
                    this.tracked.set(item, object);
                    this.modified();
                }
            }
            else {
                becameUntracked = true;
            }
        }
        if (becameUntracked && object) {
            this.customizerRemoved(item, object, related);
        }
    }
}

class BundleTrackerImpl {
    customizer;
    context;
    trackedStates = [];
    tracked;
    constructor(context, trackedStates, customizer) {
        this.context = context;
        this.trackedStates = trackedStates;
        this.customizer = customizer || this;
    }
    open() {
        if (isAllPresent(this.tracked)) {
            return;
        }
        const t = new Tracked$1(this);
        this.context.addBundleListener(t);
        const bundles = this.context.getBundles();
        if (bundles && bundles.length) {
            const length = bundles.length;
            for (let i = 0; i < length; i++) {
                const state = bundles[i].getState();
                if (this.getTrackedStates().includes(state)) {
                    /* undefined out bundles whose states are not interesting */
                    bundles[i] = undefined;
                }
            }
            /* set tracked with the initial bundles */
            t.setInitial(bundles);
        }
        this.tracked = t;
        t.trackInitial();
    }
    close() {
        const outgoing = this.tracked;
        let bundles;
        if (isAnyMissing(outgoing)) {
            return;
        }
        outgoing.close();
        bundles = this.getBundles();
        this.tracked = undefined;
        try {
            this.context.removeBundleListener(outgoing);
        }
        catch (_) {
            /* In case the context was stopped. */
        }
        if (Array.isArray(bundles)) {
            for (const bundle of bundles) {
                outgoing.untrack(bundle, undefined);
            }
        }
    }
    addingBundle(bundle, event) {
        return bundle;
    }
    modifiedBundle(bundle, event, object) {
        /* do nothing */
    }
    removedBundle(bundle, event, object) {
        /* do nothing */
    }
    getBundles() {
        if (isAnyMissing(this.tracked)) {
            return [];
        }
        if (this.tracked.isEmpty()) {
            return [];
        }
        return this.tracked.copyKeys([]);
    }
    getObject(bundle) {
        if (isAnyMissing(this.tracked)) {
            return undefined;
        }
        return this.tracked.getCustomizedObject(bundle);
    }
    remove(bundle) {
        if (isAnyMissing(this.tracked)) {
            return;
        }
        this.tracked.untrack(bundle, undefined);
    }
    size() {
        if (isAnyMissing(this.tracked)) {
            return 0;
        }
        return this.tracked.size();
    }
    getTrackingCount() {
        if (isAnyMissing(this.tracked)) {
            return -1;
        }
        return this.tracked.getTrackingCount();
    }
    isEmpty() {
        if (isAnyMissing(this.tracked)) {
            return true;
        }
        return this.tracked.isEmpty();
    }
    getTrackedStates() {
        return this.trackedStates;
    }
}
class Tracked$1 extends AbstractTracked {
    isSync = true;
    tracker;
    constructor(tracker) {
        super();
        this.tracker = tracker;
    }
    customizerAdding(item, related) {
        return this.tracker.customizer.addingBundle(item, related);
    }
    customizerModified(item, object, related) {
        this.tracker.customizer.modifiedBundle(item, related, object);
    }
    customizerRemoved(item, object, related) {
        this.tracker.customizer.removedBundle(item, related, object);
    }
    bundleChanged(event) {
        if (this.closed) {
            return;
        }
        const bundle = event.getBundle();
        const state = bundle.getState();
        if (this.tracker.getTrackedStates().includes(state)) {
            this.track(bundle, event);
            /*
             * If the customizer throws an unchecked exception, it is safe
             * to let it propagate
             */
        }
        else {
            this.untrack(bundle, event);
            /*
             * If the customizer throws an unchecked exception, it is safe
             * to let it propagate
             */
        }
    }
}

class ServiceTrackerImpl {
    customizer;
    context;
    filter;
    listenerFilter;
    identifier;
    tracked;
    cachedReference;
    cachedService;
    constructor(context, identifierOrFilter, customizer) {
        this.context = context;
        this.customizer = customizer || this;
        this.listenerFilter =
            typeof identifierOrFilter === 'string' ? `(${OBJECTCLASS}=${identifierOrFilter})` : identifierOrFilter.toString();
        this.identifier = typeof identifierOrFilter === 'string' ? identifierOrFilter : undefined;
        this.filter =
            typeof identifierOrFilter === 'string' ? context.createFilter(this.listenerFilter) : identifierOrFilter;
    }
    open() {
        let t;
        if (isAllPresent(this.tracked)) {
            return;
        }
        t = new AllTracked(this);
        this.context.addServiceListener(t, this.listenerFilter);
        let references = [];
        if (isAllPresent(this.identifier)) {
            references = this.getInitialReferences(this.identifier);
        }
        else {
            references = this.getInitialReferences(undefined, this.listenerFilter);
        }
        t.setInitial(references);
        this.tracked = t;
        t.trackInitial();
    }
    close() {
        const outgoing = this.tracked;
        let references;
        if (isAnyMissing(outgoing)) {
            return;
        }
        outgoing.close();
        references = this.getServiceReferences();
        this.tracked = undefined;
        try {
            this.context.removeServiceListener(outgoing);
        }
        catch (_) {
            /* In case the context was stopped. */
        }
        this.modified();
        if (isAllPresent(references)) {
            for (const reference of references) {
                outgoing.untrack(reference, undefined);
            }
        }
    }
    getServiceReferences() {
        let t = this.tracked;
        if (isAnyMissing(t)) {
            return [];
        }
        if (t.isEmpty()) {
            return [];
        }
        let result = [];
        return t.copyKeys(result);
    }
    addingService(reference) {
        return this.context.getService(reference);
    }
    modifiedService(reference, service) {
        /* do nothing */
    }
    removedService(reference, service) {
        try {
            // If a Bundle is in a STOPPING state, unget will fail
            this.context.ungetService(reference);
        }
        catch (_) { }
    }
    getService() {
        let service = this.cachedService;
        if (isAllPresent(service)) {
            return service;
        }
        let reference = this.getServiceReference();
        if (isAnyMissing(reference)) {
            return undefined;
        }
        return (this.cachedService = this.getServiceForReference(reference));
    }
    getServiceReference() {
        const reference = this.cachedReference;
        if (isAllPresent(reference)) {
            return reference;
        }
        const references = this.getServiceReferences();
        const length = isAnyMissing(references) ? 0 : references.length;
        if (length === 0) {
            return undefined;
        }
        let index = 0;
        if (length > 1) {
            const rankings = [];
            let count = 0;
            let maxRanking = Number.MIN_VALUE;
            for (let i = 0; i < length; i++) {
                const property = references[i].getProperty(SERVICE_RANKING);
                const ranking = typeof property === 'number' ? Number(property) : 0;
                rankings[i] = ranking;
                if (ranking > maxRanking) {
                    index = i;
                    maxRanking = ranking;
                    count = 1;
                }
                else {
                    if (ranking === maxRanking) {
                        count++;
                    }
                }
            }
            if (count > 1) {
                let minId = Number.MAX_VALUE;
                for (let i = 0; i < length; i++) {
                    if (rankings[i] == maxRanking) {
                        const id = Number(references[i].getProperty(SERVICE_ID));
                        if (id < minId) {
                            index = i;
                            minId = id;
                        }
                    }
                }
            }
        }
        return (this.cachedReference = references[index]);
    }
    getServiceForReference(reference) {
        let t = this.tracked;
        if (isAnyMissing(t)) {
            return undefined;
        }
        return t.getCustomizedObject(reference);
    }
    getServices() {
        let t = this.tracked;
        if (isAnyMissing(t)) {
            return [];
        }
        let references = this.getServiceReferences();
        let length = isAllPresent(references) ? references.length : 0;
        if (length === 0) {
            return [];
        }
        const objects = [];
        for (let i = 0; i < length; i++) {
            objects[i] = this.getServiceForReference(references[i]);
        }
        return objects;
    }
    modified() {
        this.cachedReference = undefined;
        this.cachedService = undefined;
    }
    remove(reference) {
        let t = this.tracked;
        if (isAnyMissing(t)) {
            return;
        }
        t.untrack(reference, undefined);
    }
    size() {
        const t = this.tracked;
        if (isAnyMissing(t)) {
            return 0;
        }
        return t.size();
    }
    getTrackingCount() {
        const t = this.tracked;
        if (isAnyMissing(t)) {
            return -1;
        }
        return t.getTrackingCount();
    }
    isEmpty() {
        const t = this.tracked;
        if (isAnyMissing(t)) {
            return true;
        }
        return t.isEmpty();
    }
    getInitialReferences(identifier, filterString) {
        if (isAnyMissing(identifier) && isAnyMissing(filterString)) {
            throw new Error('Either the parameter "identifier" or "filterString" must be provided!');
        }
        return this.context.getAllServiceReferences(identifier, filterString);
    }
}
class Tracked extends AbstractTracked {
    isSync = true;
    tracker;
    constructor(tracker) {
        super();
        this.tracker = tracker;
    }
    serviceChanged(event) {
        if (this.closed) {
            return;
        }
        const reference = event.getServiceReference();
        switch (event.getType()) {
            case 'REGISTERED':
            case 'MODIFIED':
                this.track(reference, event);
                break;
            case 'MODIFIED_ENDMATCH':
            case 'UNREGISTERING':
                this.untrack(reference, event);
                break;
        }
    }
    modified() {
        super.modified();
        this.tracker.modified();
    }
    customizerAdding(item, related) {
        return this.tracker.customizer.addingService(item);
    }
    customizerModified(item, object, related) {
        this.tracker.customizer.modifiedService(item, object);
    }
    customizerRemoved(item, object, related) {
        this.tracker.customizer.removedService(item, object);
    }
}
class AllTracked extends Tracked {
    constructor(tracker) {
        super(tracker);
    }
}

class BundleContextImpl {
    logger;
    bundle;
    pandino;
    valid = true;
    bundleTrackers = [];
    serviceTrackers = [];
    constructor(logger, bundle, pandino) {
        this.logger = logger;
        this.bundle = bundle;
        this.pandino = pandino;
    }
    addBundleListener(listener) {
        this.checkValidity();
        this.pandino.addBundleListener(this.bundle, listener);
    }
    removeBundleListener(listener) {
        this.checkValidity();
        this.pandino.removeBundleListener(this.bundle, listener);
    }
    addFrameworkListener(listener) {
        this.checkValidity();
        this.pandino.addFrameworkListener(this.bundle, listener);
    }
    removeFrameworkListener(listener) {
        this.checkValidity();
        this.pandino.removeFrameworkListener(this.bundle, listener);
    }
    createFilter(filter) {
        this.checkValidity();
        return Filter.parse(filter);
    }
    getBundle(id) {
        this.checkValidity();
        if (isAllPresent(id)) {
            return this.pandino.getBundle(id);
        }
        return this.bundle;
    }
    getBundles() {
        this.checkValidity();
        return this.pandino.getBundles(this);
    }
    getProperty(key) {
        this.checkValidity();
        return this.pandino.getProperty(key);
    }
    async installBundle(locationOrHeaders) {
        if (typeof locationOrHeaders === 'string') {
            this.logger.debug(`Installing Bundle from location: ${locationOrHeaders}`);
        }
        else {
            this.logger.debug(`Installing Bundle: ${locationOrHeaders[BUNDLE_SYMBOLICNAME]}: ${locationOrHeaders[BUNDLE_VERSION]}`);
        }
        this.checkValidity();
        return this.pandino.installBundle(this.bundle, locationOrHeaders);
    }
    addServiceListener(listener, filter) {
        this.checkValidity();
        this.pandino.addServiceListener(this.bundle, listener, filter);
    }
    getService(reference) {
        this.checkValidity();
        if (isAnyMissing(reference)) {
            throw new Error('Specified service reference must be defined.');
        }
        return this.pandino.getService(this.bundle, reference, false);
    }
    getServiceReference(identifier) {
        this.checkValidity();
        try {
            const refs = this.getServiceReferences(identifier, null);
            return BundleContextImpl.getBestServiceReference(refs);
        }
        catch (ex) {
            this.logger.error('BundleContextImpl: ' + ex);
        }
        return undefined;
    }
    getAllServiceReferences(identifier, filter) {
        this.checkValidity();
        return this.pandino.getAllowedServiceReferences(this.bundle, identifier, filter, false);
    }
    getServiceReferences(identifier, filter) {
        this.checkValidity();
        return this.pandino.getAllowedServiceReferences(this.bundle, identifier, filter, true);
    }
    registerService(identifiers, service, properties) {
        this.checkValidity();
        return this.pandino.registerService(this, identifiers, service, properties || {});
    }
    removeServiceListener(listener) {
        this.checkValidity();
        this.pandino.removeServiceListener(this.bundle, listener);
    }
    ungetService(reference) {
        this.checkValidity();
        if (isAnyMissing(reference)) {
            throw new Error('Specified service reference cannot be missing.');
        }
        return this.pandino.ungetService(this.bundle, reference, null);
    }
    getServiceObjects(reference) {
        this.checkValidity();
        const reg = reference.getRegistration();
        if (reg.isValid()) {
            return new ServiceObjectsImpl(reference, this, this.pandino);
        }
        return undefined;
    }
    isValid() {
        return this.valid;
    }
    invalidate() {
        this.valid = false;
    }
    checkValidity() {
        if (this.valid) {
            switch (this.bundle.getState()) {
                case 'ACTIVE':
                case 'STARTING':
                case 'STOPPING':
                    return;
            }
        }
        throw new Error('Invalid BundleContext.');
    }
    equals(other) {
        if (isAnyMissing(other) || !(other instanceof BundleContextImpl)) {
            return false;
        }
        if (this.getBundle().getSymbolicName() === other.getBundle().getSymbolicName() &&
            this.getBundle().getVersion().toString() === other.getBundle().getVersion().toString()) {
            return true;
        }
        return false;
    }
    trackBundle(trackedStates, customizer) {
        this.checkValidity();
        const self = this;
        const tracker = new (class extends BundleTrackerImpl {
            constructor() {
                super(self, trackedStates);
            }
            addingBundle(bundle, event) {
                return customizer.addingBundle ? customizer.addingBundle(bundle, event) : super.addingBundle(bundle, event);
            }
            modifiedBundle(bundle, event, object) {
                customizer.modifiedBundle
                    ? customizer.modifiedBundle(bundle, event, object)
                    : super.modifiedBundle(bundle, event, object);
            }
            removedBundle(bundle, event, object) {
                customizer.removedBundle
                    ? customizer.removedBundle(bundle, event, object)
                    : super.removedBundle(bundle, event, object);
            }
        })();
        this.bundleTrackers.push(tracker);
        return tracker;
    }
    trackService(identifierOrFilter, customizer) {
        this.checkValidity();
        const self = this;
        const tracker = new (class extends ServiceTrackerImpl {
            constructor() {
                super(self, identifierOrFilter);
            }
            addingService(reference) {
                return customizer.addingService ? customizer.addingService(reference) : super.addingService(reference);
            }
            modifiedService(reference, service) {
                customizer.modifiedService
                    ? customizer.modifiedService(reference, service)
                    : super.modifiedService(reference, service);
            }
            removedService(reference, service) {
                customizer.removedService
                    ? customizer.removedService(reference, service)
                    : super.removedService(reference, service);
            }
        })();
        this.serviceTrackers.push(tracker);
        return tracker;
    }
    closeTrackers() {
        for (const tracker of this.bundleTrackers) {
            try {
                tracker.close();
            }
            catch (_) { }
        }
        for (const tracker of this.serviceTrackers) {
            try {
                tracker.close();
            }
            catch (_) { }
        }
        this.bundleTrackers = [];
        this.serviceTrackers = [];
    }
    static getBestServiceReference(refs) {
        if (isAnyMissing(refs)) {
            return undefined;
        }
        if (refs.length === 1) {
            return refs[0];
        }
        let bestRef = refs[0];
        for (let i = 1; i < refs.length; i++) {
            if (bestRef.compareTo(refs[i]) < 0) {
                bestRef = refs[i];
            }
        }
        return bestRef;
    }
}

class BundleEventImpl {
    bundle;
    type;
    origin;
    constructor(bundle, type, origin) {
        this.bundle = bundle;
        this.type = type;
        this.origin = origin;
    }
    getBundle() {
        return this.bundle;
    }
    getOrigin() {
        return this.origin;
    }
    getType() {
        return this.type;
    }
    toString() {
        return `${this.bundle.getUniqueIdentifier()} changed state to: ${this.type}.`;
    }
}

class BundleWireImpl {
    requirer;
    req;
    provider;
    cap;
    constructor(requirer, req, provider, cap) {
        this.requirer = requirer;
        this.req = req;
        this.provider = provider;
        this.cap = cap;
    }
    equals(other) {
        if (isAnyMissing(other) || !(other instanceof BundleWireImpl)) {
            return false;
        }
        return this.getRequirement() === other.getRequirement() && this.getCapability() === other.getCapability();
    }
    getRequirer() {
        return this.requirer;
    }
    getRequirement() {
        return this.req;
    }
    getProvider() {
        return this.provider;
    }
    getCapability() {
        return this.cap;
    }
    toString() {
        return this.req + ' -> ' + '[' + this.provider + ']';
    }
}

class BundleWiringImpl {
    configMap = {};
    resolver;
    revision;
    wires = [];
    resolvedCaps = [];
    resolvedReqs = [];
    isDisposed = false;
    constructor(configMap, resolver, revision, wires = []) {
        this.configMap = configMap;
        this.resolver = resolver;
        this.revision = revision;
        this.wires = [...wires];
        const reqList = [];
        for (const bw of wires) {
            if (bw.getRequirement().getNamespace() !== HOST_NAMESPACE || !reqList.includes(bw.getRequirement())) {
                reqList.push(bw.getRequirement());
            }
        }
        for (const req of this.revision.getDeclaredRequirements(null)) {
            if (req.getNamespace() === PACKAGE_NAMESPACE) {
                const resolution = req.getDirectives()[RESOLUTION_DIRECTIVE];
                if (isAllPresent(resolution) && resolution === 'dynamic') {
                    reqList.push(req);
                }
            }
        }
        this.resolvedReqs = [...reqList];
        const capList = [];
        for (const cap of this.revision.getDeclaredCapabilities(null)) {
            if (cap.getNamespace() !== PACKAGE_NAMESPACE) {
                let effective = cap.getDirectives()[EFFECTIVE_DIRECTIVE];
                if (isAnyMissing(effective) || effective === EFFECTIVE_RESOLVE) {
                    capList.push(cap);
                }
            }
        }
        this.resolvedCaps = [...capList];
    }
    dispose() {
        this.isDisposed = true;
    }
    getBundle() {
        return this.revision.getBundle();
    }
    isCurrent() {
        const bundle = this.getBundle();
        const current = bundle.getState() === 'UNINSTALLED' ? null : bundle.getCurrentRevision();
        return isAllPresent(current) && current.getWiring() === this;
    }
    isInUse() {
        return !this.isDisposed;
    }
    getResourceCapabilities(namespace) {
        return this.getCapabilities(namespace);
    }
    getCapabilities(namespace) {
        if (this.isInUse()) {
            let result = this.resolvedCaps;
            if (isAllPresent(namespace)) {
                result = [];
                for (const cap of this.resolvedCaps) {
                    if (cap.getNamespace() === namespace) {
                        result.push(cap);
                    }
                }
            }
            return result;
        }
        return [];
    }
    getProvidedWires(namespace) {
        throw new Error('Method not yet implemented!');
    }
    getRequiredWires(namespace) {
        if (this.isInUse()) {
            let result = [...this.wires];
            if (isAllPresent(namespace)) {
                result = this.wires.filter((bw) => bw.getRequirement().getNamespace() === namespace);
            }
            return result;
        }
        return [];
    }
    getRequirements(namespace) {
        if (this.isInUse()) {
            let searchReqs = this.resolvedReqs;
            let result = this.resolvedReqs;
            if (isAllPresent(namespace)) {
                result = [];
                for (const req of searchReqs) {
                    if (req.getNamespace() === namespace) {
                        result.push(req);
                    }
                }
            }
            return result;
        }
        return [];
    }
    getResource() {
        return this.revision;
    }
    getResourceRequirements(namespace) {
        return this.getRequirements(namespace);
    }
    getRevision() {
        return this.revision;
    }
    toString() {
        return this.revision.getBundle().toString();
    }
}

class StatefulResolver {
    pandino;
    revisions = [];
    registry;
    logger;
    constructor(logger, pandino, registry) {
        this.logger = logger;
        this.pandino = pandino;
        this.registry = registry;
    }
    async resolveOne(revision) {
        if (['ACTIVE'].includes(revision.getBundle().getState())) {
            return;
        }
        const bundleWiring = this.resolve(revision);
        if (bundleWiring) {
            this.logger.debug(`Bundle Wiring created for Revision: ${revision.getSymbolicName()}: ${revision.getVersion().toString()}`);
            const bundle = bundleWiring.getRevision().getBundle();
            this.pandino.fireBundleEvent('RESOLVED', bundle);
            try {
                await this.pandino.startBundle(bundle);
                await this.resolveRemaining();
            }
            catch (err) {
                this.logger.error(err);
            }
        }
        else {
            this.logger.debug(`No Wiring found for Revision: ${revision.getSymbolicName()}: ${revision.getVersion().toString()}`);
        }
    }
    async resolveRemaining() {
        const unresolvedRevs = this.revisions.filter((r) => isAnyMissing(r.getWiring()));
        const revsToReRun = unresolvedRevs.filter((r) => {
            const wires = StatefulResolver.getResolvableWires(r, this.getEligibleCapabilities());
            return r.getSymbolicName() !== SYSTEM_BUNDLE_SYMBOLICNAME && StatefulResolver.canBundleBeResolved(r, wires);
        });
        for (const rev of revsToReRun) {
            await this.resolveOne(rev);
        }
    }
    getActiveRequirers(bundle) {
        const bundles = [];
        // rev.getWiring().getRequiredWires(null)
        const wirings = this.revisions
            .filter((rev) => !!rev.getWiring())
            .map((rev) => rev.getWiring())
            .filter((wiring) => wiring.isInUse());
        for (const wiring of wirings) {
            const wire = wiring
                .getRequiredWires(null)
                .find((wire) => wire.getProvider().equals(bundle.getCurrentRevision()));
            if (wire) {
                bundles.push(wire.getRequirer().getBundle());
            }
        }
        return bundles;
    }
    /**
     * Currently in the resolving process, we only take ACTIVE Bundles into consideration. Given we are expecting all
     * Bundles to have at least a start() being called from A {@link BundleActivator}.
     */
    getEligibleCapabilities() {
        const caps = [];
        const activeRevisions = this.revisions.filter((rev) => rev.getBundle().getState() === 'ACTIVE');
        for (const rev of activeRevisions) {
            caps.push(...rev.getDeclaredCapabilities(null));
        }
        return caps;
    }
    resolve(rev) {
        const wiring = this.createWiringForRevision(rev);
        rev.resolve(wiring);
        return wiring;
    }
    static canBundleBeResolved(rev, wires) {
        const validStates = ['INSTALLED', 'STARTING'];
        if (!validStates.includes(rev.getBundle().getState())) {
            return false;
        }
        const requirements = rev.getDeclaredRequirements(null);
        const reqs = requirements.map((r) => r.getNamespace());
        const wireCaps = wires.map((w) => w.getCapability().getNamespace());
        return requirements.length === 0 || reqs.every((r) => wireCaps.includes(r));
    }
    static getResolvableWires(rev, allProvidedCapabilities) {
        const requirements = rev.getDeclaredRequirements(null);
        const wires = [];
        for (const req of requirements) {
            const filter = req.getFilter();
            const providedCap = allProvidedCapabilities.find((p) => p.getNamespace() === req.getNamespace() && CapabilitySet.matches(p, filter));
            if (providedCap) {
                const wire = new BundleWireImpl(req.getResource(), req, providedCap?.getResource(), providedCap);
                wires.push(wire);
            }
        }
        return wires;
    }
    createWiringForRevision(revision) {
        const wires = StatefulResolver.getResolvableWires(revision, this.getEligibleCapabilities());
        if (StatefulResolver.canBundleBeResolved(revision, wires)) {
            const impl = revision;
            return new BundleWiringImpl(impl.getHeaders(), this, impl, wires);
        }
    }
    addRevision(br) {
        this.removeRevision(br);
        this.revisions.push(br);
    }
    removeRevision(br) {
        const idx = this.revisions.findIndex((r) => r.equals(br));
        if (idx > 0) {
            this.revisions.splice(idx, 1);
        }
    }
}

const PACKAGE_SEPARATOR = '.';
class ServiceReferenceImpl extends BundleCapabilityImpl {
    reg;
    bundle;
    constructor(reg, bundle) {
        super(null, null, {}, {});
        this.reg = reg;
        this.bundle = bundle;
    }
    compareTo(other) {
        const id = Number(this.getProperty(SERVICE_ID));
        const otherId = Number(other.getProperty(SERVICE_ID));
        if (id === otherId) {
            return 0;
        }
        const rankObj = Number(this.getProperty(SERVICE_RANKING));
        const otherRankObj = Number(other.getProperty(SERVICE_RANKING));
        const rank = !rankObj ? SERVICE_DEFAULT_RANK : rankObj;
        const otherRank = !otherRankObj ? SERVICE_DEFAULT_RANK : otherRankObj;
        if (rank - otherRank < 0) {
            return -1;
        }
        else if (rank - otherRank > 0) {
            return 1;
        }
        // If ranks are equal, then sort by service id in descending order.
        return otherId - id;
    }
    getRegistration() {
        return this.reg;
    }
    getRevision() {
        throw new Error('Not supported yet.');
    }
    getNamespace() {
        return 'service-reference';
    }
    getDirectives() {
        return {};
    }
    getAttributes() {
        return {
            ...this.getRegistration().getProperties(),
        };
    }
    getUses() {
        return [];
    }
    getBundle() {
        if (this.reg.isValid()) {
            return this.bundle;
        }
    }
    getProperties() {
        return this.reg.getProperties();
    }
    getProperty(key) {
        return this.reg.getProperty(key);
    }
    getPropertyKeys() {
        return this.reg.getPropertyKeys();
    }
    getUsingBundles() {
        return this.reg.getUsingBundles(this);
    }
    isAssignableTo(bundle, className) {
        if (bundle === this.bundle) {
            return true;
        }
        let allow;
        const pkgName = ServiceReferenceImpl.getClassPackage(className);
        const requesterRevision = bundle.getCurrentRevision();
        const requesterWire = ServiceReferenceImpl.getWire(requesterRevision, pkgName);
        const requesterCap = ServiceReferenceImpl.getPackageCapability(requesterRevision, pkgName);
        const providerRevision = this.bundle.getCurrentRevision();
        const providerWire = ServiceReferenceImpl.getWire(providerRevision, pkgName);
        const providerCap = ServiceReferenceImpl.getPackageCapability(providerRevision, pkgName);
        if (isAnyMissing(requesterWire) && isAnyMissing(providerWire)) {
            allow = true;
        }
        else if (isAnyMissing(requesterWire) && isAllPresent(providerWire)) {
            if (isAllPresent(requesterCap)) {
                allow = providerRevision.getWiring().getRevision().equals(requesterRevision);
            }
            else {
                allow = true;
            }
        }
        else if (requesterWire != null && providerWire == null) {
            if (isAllPresent(providerCap)) {
                allow = requesterWire.getProvider().equals(providerRevision);
            }
            else {
                allow = true;
            }
        }
        else {
            allow = providerWire.getProvider().equals(requesterWire.getProvider());
        }
        return allow;
    }
    hasObjectClass(objectClass) {
        const classOrArray = this.getProperty(OBJECTCLASS);
        return Array.isArray(classOrArray) ? classOrArray.includes(objectClass) : classOrArray === objectClass;
    }
    static getClassName(className) {
        if (isAnyMissing(className)) {
            return '';
        }
        return className.substring(className.lastIndexOf(PACKAGE_SEPARATOR), className.length - 1);
    }
    static getClassPackage(className) {
        if (isAnyMissing(className)) {
            return '';
        }
        return className.substring(0, className.lastIndexOf(PACKAGE_SEPARATOR));
    }
    static getWire(br, name) {
        if (isAllPresent(br.getWiring())) {
            const wires = br.getWiring().getRequiredWires(null);
            if (isAllPresent(wires)) {
                for (const w of wires) {
                    if (w.getCapability().getNamespace() === PACKAGE_NAMESPACE &&
                        w.getCapability().getAttributes()[PACKAGE_NAMESPACE] === name) {
                        return w;
                    }
                }
            }
        }
        return undefined;
    }
    static getPackageCapability(br, name) {
        if (isAllPresent(br.getWiring())) {
            const capabilities = br.getWiring().getCapabilities(null);
            if (isAllPresent(capabilities)) {
                for (const c of capabilities) {
                    if (c.getNamespace() === PACKAGE_NAMESPACE && c.getAttributes()[PACKAGE_NAMESPACE] === name) {
                        return c;
                    }
                }
            }
        }
        return undefined;
    }
}

class ServiceRegistrationImpl {
    registry;
    bundle;
    classes;
    serviceId;
    svcObj;
    factory;
    propMap;
    ref;
    isUnregistering = false;
    constructor(registry, bundle, classNames, serviceId, svcObj, dict) {
        this.registry = registry;
        this.bundle = bundle;
        this.classes = classNames;
        this.serviceId = serviceId;
        this.svcObj = svcObj;
        this.factory = isAllPresent(this.svcObj.factoryType) ? this.svcObj : undefined;
        this.propMap = dict;
        this.initializeProperties(dict);
        this.ref = new ServiceReferenceImpl(this, bundle);
    }
    isValid() {
        return isAllPresent(this.svcObj);
    }
    invalidate() {
        this.svcObj = null;
    }
    getUsingBundles(ref) {
        return this.registry.getUsingBundles(ref);
    }
    getService(acqBundle) {
        if (this.factory) {
            return this.getFactoryUnchecked(acqBundle);
        }
        return this.svcObj;
    }
    ungetService(relBundle, svcObj) {
        if (this.factory) {
            try {
                this.ungetFactoryUnchecked(relBundle, svcObj);
            }
            catch (e) {
                this.registry
                    .getLogger()
                    .error('ServiceRegistrationImpl: Error ungetting service.', e);
            }
        }
    }
    getReference() {
        if (!this.isValid()) {
            throw new Error('The service registration is no longer valid for class(es): ' + JSON.stringify(this.classes));
        }
        return this.ref;
    }
    setProperties(properties) {
        let oldProps;
        if (!this.isValid()) {
            throw new Error('The service registration is no longer valid for class(es): ' + JSON.stringify(this.classes));
        }
        oldProps = this.propMap;
        this.initializeProperties(properties);
        this.registry.servicePropertiesModified(this, { ...oldProps });
    }
    unregister() {
        if (!this.isValid() || this.isUnregistering) {
            throw new Error('Service already unregistered.');
        }
        this.isUnregistering = true;
        // TODO: re-introduce
        this.registry.unregisterService(this.bundle, this);
        this.svcObj = null;
        this.factory = null;
    }
    getProperty(key) {
        return this.propMap[key];
    }
    getProperties() {
        return this.propMap;
    }
    getPropertyKeys() {
        return Object.keys(this.propMap || {});
    }
    getFactoryUnchecked(bundle) {
        return this.factory.getService(bundle, this);
    }
    ungetFactoryUnchecked(bundle, svcObj) {
        this.factory.ungetService(bundle, this, svcObj);
    }
    initializeProperties(dict) {
        const props = {};
        if (isAllPresent(dict)) {
            Object.assign(props, { ...dict });
        }
        props[OBJECTCLASS] = this.classes;
        props[SERVICE_ID] = this.serviceId;
        props[SERVICE_BUNDLEID] = this.bundle.getBundleId();
        if (this.factory) {
            props[SERVICE_SCOPE] = this.factory.factoryType === 'prototype' ? SCOPE_PROTOTYPE : SCOPE_BUNDLE;
        }
        else {
            props[SERVICE_SCOPE] = SCOPE_SINGLETON;
        }
        this.propMap = props;
    }
}

class UsageCountImpl {
    ref;
    service;
    count = 0;
    serviceObjectsCount = 0;
    isProto;
    constructor(ref, isPrototype = false) {
        this.ref = ref;
        this.isProto = isPrototype;
    }
    getReference() {
        return this.ref;
    }
    getCount() {
        return this.count;
    }
    getServiceObjectsCount() {
        return this.serviceObjectsCount;
    }
    incrementToPositiveValue() {
        if (this.count + 1 < 1) {
            return (this.count = 1);
        }
        this.count++;
        return this.count;
    }
    incrementServiceObjectsCountToPositiveValue() {
        if (this.serviceObjectsCount <= 0) {
            return (this.serviceObjectsCount = 1);
        }
        this.serviceObjectsCount++;
        return this.serviceObjectsCount;
    }
    incrementAndGet() {
        return ++this.count;
    }
    decrementAndGet() {
        return --this.count;
    }
    serviceObjectsDecrementAndGet() {
        return --this.serviceObjectsCount;
    }
    getService() {
        return this.service;
    }
    setService(service) {
        this.service = service;
    }
    isPrototype() {
        return this.isProto;
    }
}

class ServiceRegistryImpl {
    logger;
    callbacks;
    regsMap = new Map();
    regCapSet = new CapabilitySet([OBJECTCLASS]);
    inUseMap = new Map();
    currentServiceId = 0;
    constructor(logger, callbacks) {
        this.logger = logger;
        this.callbacks = callbacks;
    }
    getRegisteredServices(bundle) {
        const regs = this.regsMap.get(bundle);
        if (isAllPresent(regs)) {
            const refs = [];
            for (const reg of regs) {
                try {
                    refs.push(reg.getReference());
                }
                catch (ex) {
                    // Don't include the reference as it is not valid anymore
                }
            }
            return refs;
        }
        return [];
    }
    getService(bundle, ref, isServiceObjects = false) {
        const isPrototype = isServiceObjects && ref.getProperty(SERVICE_SCOPE) === SCOPE_PROTOTYPE;
        let usage;
        let svcObj;
        const reg = ref.getRegistration();
        try {
            if (reg.isValid()) {
                // Get the usage count, or create a new one. If this is a prototype, then we'll always create a new one.
                usage = this.obtainUsageCount(bundle, ref, undefined, isPrototype);
                usage.incrementToPositiveValue();
                svcObj = usage.getService();
                if (isAnyMissing(svcObj)) {
                    svcObj = reg.getService(bundle);
                    usage.setService(svcObj);
                }
                if (isServiceObjects) {
                    usage.incrementServiceObjectsCountToPositiveValue();
                }
                if (isAllPresent(usage) && isPrototype) {
                    const existingUsage = this.obtainUsageCount(bundle, ref, svcObj);
                    if (existingUsage && existingUsage !== usage) {
                        this.flushUsageCount(bundle, ref, usage);
                        usage = existingUsage;
                        usage.incrementToPositiveValue();
                        if (isServiceObjects) {
                            usage.incrementServiceObjectsCountToPositiveValue();
                        }
                    }
                }
            }
        }
        finally {
            if (!reg.isValid() || isAnyMissing(svcObj)) {
                this.flushUsageCount(bundle, ref, usage);
            }
        }
        return svcObj;
    }
    servicePropertiesModified(reg, oldProps) {
        if (isAllPresent(this.callbacks)) {
            this.callbacks.serviceChanged(new ServiceEventImpl('MODIFIED', reg.getReference()), oldProps);
        }
    }
    getServiceReferences(identifier, filter) {
        let filterEffective = filter;
        if (isAnyMissing(identifier) && isAnyMissing(filter)) {
            filterEffective = new Filter(null, FilterComp.MATCH_ALL, null);
        }
        else if (isAllPresent(identifier) && isAnyMissing(filter)) {
            filterEffective = new Filter(OBJECTCLASS, FilterComp.EQ, identifier);
        }
        else if (isAllPresent(identifier) && isAllPresent(filter)) {
            const filters = [];
            filters.push(new Filter(OBJECTCLASS, FilterComp.EQ, identifier));
            filters.push(filter);
            filterEffective = new Filter(null, FilterComp.AND, null, filters);
        }
        return Array.from(this.regCapSet.match(filterEffective, false));
    }
    getUsingBundles(ref) {
        let bundles = [];
        for (const bundle of this.inUseMap.keys()) {
            const usages = this.inUseMap.get(bundle);
            for (const usage of usages) {
                if (usage.getReference().compareTo(ref) === 0 && usage.getCount() > 0) {
                    if (isAnyMissing(bundles)) {
                        bundles = [bundle];
                    }
                    else {
                        bundles.push(bundle);
                    }
                }
            }
        }
        return bundles;
    }
    registerService(bundle, classNames, svcObj, dict) {
        const reg = new ServiceRegistrationImpl(this, bundle, classNames, ++this.currentServiceId, svcObj, dict);
        if (!this.regsMap.has(bundle)) {
            this.regsMap.set(bundle, []);
        }
        const regs = this.regsMap.get(bundle);
        // TODO: implement check if same service gets registered or not!
        if (!regs.find((r) => r.getReference().getProperty(SERVICE_ID) === reg.getReference().getProperty(SERVICE_ID))) {
            regs.push(reg);
        }
        else {
            this.logger.warn(`Service already registered, skipping! (${reg.getReference().getProperty(SERVICE_ID)})`);
        }
        this.regCapSet.addCapability(reg.getReference());
        return reg;
    }
    unregisterService(bundle, reg) {
        const regs = this.regsMap.get(bundle);
        if (isAllPresent(regs)) {
            const remIdx = regs.findIndex((r) => r === reg);
            if (remIdx > -1) {
                regs.splice(remIdx, 1);
            }
        }
        this.regCapSet.removeCapability(reg.getReference());
        if (isAllPresent(this.callbacks)) {
            this.callbacks.serviceChanged(new ServiceEventImpl('UNREGISTERING', reg.getReference()), null);
        }
        const ref = reg.getReference();
        this.ungetServicesByRef(ref);
        reg.invalidate();
        this.ungetServicesByRef(ref);
        for (const bundle of this.inUseMap.keys()) {
            this.flushUsageCount(bundle, ref);
        }
    }
    ungetService(bundle, ref, svcObj) {
        const reg = ref.getRegistration();
        try {
            const usage = this.obtainUsageCount(bundle, ref, svcObj);
            if (isAnyMissing(usage)) {
                return false;
            }
            if (isAllPresent(svcObj)) {
                if (usage.decrementAndGet() < 0) {
                    return false;
                }
            }
            const count = usage.decrementAndGet();
            try {
                if (count <= 0) {
                    const svc = usage.getService();
                    if (isAllPresent(svc)) {
                        usage.setService(null);
                        if (usage.getCount() <= 0) {
                            // Temporarily increase the usage again so that the service factory still sees the usage in the unget
                            usage.incrementToPositiveValue();
                            try {
                                // Remove reference from usages array.
                                reg.ungetService(bundle, svc);
                            }
                            finally {
                                // now we can decrease the usage again
                                usage.decrementAndGet();
                            }
                        }
                    }
                }
                return usage.getCount() >= 0;
            }
            finally {
                if (!reg.isValid()) {
                    usage.setService(null);
                }
                if (!reg.isValid() || (count <= 0 && isAllPresent(svcObj))) {
                    this.flushUsageCount(bundle, ref, usage);
                }
            }
        }
        finally {
            // no-nop
        }
    }
    /**
     * Utility method to flush the specified bundle's usage count for the specified service reference. This should be
     * called to completely remove the associated usage count object for the specified service reference. If the goal is
     * to simply decrement the usage, then get the usage count and decrement its counter. This method will also remove
     * the specified bundle from the "in use" map if it has no more usage counts after removing the usage count for the
     * specified service reference.
     **/
    flushUsageCount(bundle, ref, uc) {
        const usages = this.inUseMap.get(bundle) || [];
        let processUsage = true;
        while (processUsage === true) {
            const usageIdx = usages.findIndex((usage) => (isAnyMissing(uc) && usage.getReference().compareTo(ref) === 0) || uc === usage);
            if (usageIdx > -1) {
                usages.splice(usageIdx, 1);
            }
            else {
                processUsage = false;
            }
        }
        if (usages.length === 0) {
            this.inUseMap.delete(bundle);
        }
    }
    /**
     * Obtain a UsageCount object, by looking for an existing one or creating a new one (if possible). This method tries
     * to find a UsageCount object in the {@code inUseMap}. If one is found then this is returned, otherwise a UsageCount
     * object will be created, but this can only be done if the {@code isPrototype} parameter is not {@code undefined}.
     * If {@code isPrototype} is {@code TRUE} then a new UsageCount object will always be created.
     */
    obtainUsageCount(bundle, ref, svcObj, isPrototype = false) {
        let usage = null;
        const usages = this.inUseMap.get(bundle);
        if (isPrototype === false && isAllPresent(usages)) {
            for (const usage of usages) {
                if (usage.getReference().compareTo(ref) === 0 &&
                    ((isAnyMissing(svcObj) && !usage.isPrototype()) || usage.getService() === svcObj)) {
                    return usage;
                }
            }
        }
        // if (isAnyMissing(isPrototype)) {
        //   return undefined;
        // }
        usage = new UsageCountImpl(ref, isPrototype);
        if (isAnyMissing(usages)) {
            const newUsages = [usage];
            this.inUseMap.set(bundle, newUsages);
        }
        else {
            usages.push(usage);
        }
        return usage;
    }
    unregisterServices(bundle) {
        const regs = this.regsMap.get(bundle);
        this.regsMap.delete(bundle);
        if (isAllPresent(regs)) {
            for (const reg of regs) {
                if (reg.isValid()) {
                    try {
                        reg.unregister();
                    }
                    catch (ex) {
                        // Ignore exception if the service has already been unregistered
                    }
                }
            }
        }
    }
    ungetServices(bundle) {
        const usages = this.inUseMap.get(bundle);
        if (isAnyMissing(usages)) {
            return;
        }
        for (const usage of usages) {
            // Keep ungetting until all usage count is zero.
            while (this.ungetService(bundle, usage.getReference(), usage.isPrototype() ? usage.getService() : null)) {
                // Empty loop body.
            }
        }
    }
    ungetServicesByRef(ref) {
        const clients = this.getUsingBundles(ref);
        for (const client of clients) {
            const usages = this.inUseMap.get(client);
            for (const usage of usages) {
                if (usage.getReference().compareTo(ref) === 0) {
                    this.ungetService(client, ref, usage.isPrototype() ? usage.getService() : null);
                }
            }
        }
    }
    getLogger() {
        return this.logger;
    }
    getInUseMap(bundle) {
        return this.inUseMap.get(bundle);
    }
}

class FrameworkEventImpl {
    type;
    bundle;
    error;
    constructor(type, bundle, error) {
        this.type = type;
        this.bundle = bundle;
        this.error = error;
    }
    getBundle() {
        return this.bundle;
    }
    getType() {
        return this.type;
    }
    getError() {
        return this.error;
    }
    toString() {
        return `${this.bundle.getUniqueIdentifier()} changed state to: ${this.type}.`;
    }
}

/* istanbul ignore file */
class ConsoleLogger {
    level;
    constructor(level = LogLevel.DEBUG) {
        this.level = level;
    }
    debug(...data) {
        if (this.level - LogLevel.DEBUG >= 0) {
            console.debug(new Date().toISOString(), '[DEBUG]', ...data);
        }
    }
    error(...data) {
        if (this.level - LogLevel.ERROR >= 0) {
            console.error(new Date().toISOString(), '[ERROR]', ...data);
        }
    }
    info(...data) {
        if (this.level - LogLevel.INFO >= 0) {
            console.info(new Date().toISOString(), '[INFO]', ...data);
        }
    }
    log(...data) {
        if (this.level - LogLevel.LOG >= 0) {
            console.log(new Date().toISOString(), '[LOG]', ...data);
        }
    }
    trace(...data) {
        if (this.level - LogLevel.TRACE >= 0) {
            console.trace(new Date().toISOString(), '[TRACE]', ...data);
        }
    }
    warn(...data) {
        if (this.level - LogLevel.WARN >= 0) {
            console.warn(new Date().toISOString(), '[WARN]', ...data);
        }
    }
    setLogLevel(level) {
        this.level = level;
    }
}

/* istanbul ignore file */
class VoidFetcher {
    fetch(deploymentRoot, uri) {
        return Promise.reject(`Will not fetch ${uri}! Please provide explicit Fetcher for Pandino!`);
    }
}

/* istanbul ignore file */
class VoidImporter {
    import(activatorLocation, manifestLocation, deploymentRoot) {
        return Promise.reject(`Will not import ${activatorLocation}! Please provide an explicit Importer for Pandino!`);
    }
}

class FilterParserImpl {
    parse(filter) {
        return Filter.parse(filter);
    }
}

class SemverFactoryImpl {
    build(version) {
        return new SemVerImpl(version);
    }
}

class EsmActivatorResolver {
    resolve(module, bundleHeaders) {
        return module.default;
    }
}

class Pandino extends BundleImpl {
    fetcher;
    importer;
    configMap = new Map();
    bundles = [];
    activatorsList = [];
    dispatcher;
    resolver;
    registry;
    nextId = 1;
    constructor(configMap) {
        const deploymentRoot = configMap[DEPLOYMENT_ROOT_PROP];
        const logger = isAllPresent(configMap[LOG_LOGGER_PROP]) ? configMap[LOG_LOGGER_PROP] : new ConsoleLogger();
        const fetcher = isAllPresent(configMap[PANDINO_MANIFEST_FETCHER_PROP])
            ? configMap[PANDINO_MANIFEST_FETCHER_PROP]
            : new VoidFetcher();
        const importer = isAllPresent(configMap[PANDINO_BUNDLE_IMPORTER_PROP])
            ? configMap[PANDINO_BUNDLE_IMPORTER_PROP]
            : new VoidImporter();
        logger.setLogLevel(configMap[LOG_LEVEL_PROP] || LogLevel.LOG);
        if (!configMap[PANDINO_ACTIVATOR_RESOLVERS]) {
            // @ts-ignore
            configMap[PANDINO_ACTIVATOR_RESOLVERS] = {
                esm: new EsmActivatorResolver(),
            };
        }
        if (!configMap[PANDINO_ACTIVATOR_RESOLVERS].esm) {
            configMap[PANDINO_ACTIVATOR_RESOLVERS].esm = new EsmActivatorResolver();
        }
        super(logger, 0, {
            [BUNDLE_SYMBOLICNAME]: SYSTEM_BUNDLE_SYMBOLICNAME,
            [BUNDLE_VERSION]: '0.1.0',
            [BUNDLE_NAME]: 'Pandino Framework',
        }, '', deploymentRoot);
        this.fetcher = fetcher;
        this.importer = importer;
        Object.keys(configMap).forEach((configKey) => {
            this.configMap.set(configKey, configMap[configKey]);
        });
        if (deploymentRoot) {
            this.configMap.set(DEPLOYMENT_ROOT_PROP, deploymentRoot);
        }
        this.activatorsList = this.configMap.get(SYSTEMBUNDLE_ACTIVATORS_PROP) || [];
        this.registry = new ServiceRegistryImpl(this.logger, ((pandino) => new (class {
            serviceChanged(event, oldProps) {
                pandino.fireServiceEvent(event, oldProps);
            }
        })())(this));
        this.resolver = new StatefulResolver(this.logger, this, this.registry);
        this.dispatcher = new EventDispatcher(this.logger);
        const rev = new BundleRevisionImpl(this, '0', {
            [BUNDLE_SYMBOLICNAME]: SYSTEM_BUNDLE_SYMBOLICNAME,
            [BUNDLE_VERSION]: '0.1.0',
            [BUNDLE_NAME]: 'Pandino Framework',
        });
        this.addRevision(rev);
    }
    getBundleId() {
        return 0;
    }
    getFramework() {
        return this;
    }
    getSymbolicName() {
        return this.getHeaders()[BUNDLE_SYMBOLICNAME];
    }
    getVersion() {
        return new SemVerImpl(this.getHeaders()[BUNDLE_VERSION]);
    }
    async start() {
        try {
            if (this.getState() === 'INSTALLED') {
                await this.init();
            }
            if (this.getState() === 'STARTING') {
                this.getBundleContext().registerService(FRAMEWORK_LOGGER, this.logger);
                this.getBundleContext().registerService(FRAMEWORK_MANIFEST_FETCHER, this.fetcher);
                this.getBundleContext().registerService(FRAMEWORK_BUNDLE_IMPORTER, this.importer);
                this.getBundleContext().registerService(FRAMEWORK_FILTER_PARSER, new FilterParserImpl());
                this.getBundleContext().registerService(FRAMEWORK_SEMVER_FACTORY, new SemverFactoryImpl());
                this.setBundleStateAndNotify(this, 'ACTIVE');
            }
        }
        catch (err) {
            this.logger.error(err);
        }
        this.fireBundleEvent('STARTED', this);
        this.fireFrameworkEvent('STARTED', this);
    }
    async init(...listeners) {
        try {
            if (this.getState() === 'INSTALLED') {
                this.setBundleContext(new BundleContextImpl(this.logger, this, this));
                this.setState('STARTING');
                for (const listener of listeners) {
                    this.addFrameworkListener(this, listener);
                }
                // try {
                //   await this.getActivator().start(this.getBundleContext());
                // } catch (ex) {
                //   throw new Error('Unable to start system bundle.');
                // }
            }
        }
        catch (err) {
            await this.stopBundle(this);
            this.setState('INSTALLED');
        }
    }
    async installBundle(origin, locationOrHeaders) {
        if (this.getState() === 'STOPPING' || this.getState() === 'UNINSTALLED') {
            throw new Error('The framework has been shutdown.');
        }
        const resolvedHeaders = typeof locationOrHeaders === 'string'
            ? await this.fetcher.fetch(locationOrHeaders, this.getDeploymentRoot())
            : locationOrHeaders;
        let bundle;
        let existing = this.isBundlePresent(resolvedHeaders);
        if (!existing) {
            const id = this.getNextId();
            // FIXME: this could cause issues for loading JS via explicit Header spec!
            const manifestLocation = typeof locationOrHeaders === 'string' ? locationOrHeaders : '';
            bundle = new BundleImpl(this.logger, id, resolvedHeaders, manifestLocation, this.getDeploymentRoot(), this, origin);
            this.bundles.push(bundle);
            this.fireBundleEvent('INSTALLED', bundle, origin);
            this.logger.info(`Installed Bundle: ${resolvedHeaders[BUNDLE_SYMBOLICNAME]}: ${resolvedHeaders[BUNDLE_VERSION]}`);
            await this.resolver.resolveOne(bundle.getCurrentRevision());
            return bundle;
        }
        else {
            try {
                await this.updateBundle(existing, resolvedHeaders, origin);
                await this.resolver.resolveOne(existing.getCurrentRevision());
                return existing;
            }
            catch (err) {
                this.logger.error(err);
            }
        }
    }
    async updateBundle(bundle, headers, origin) {
        if (bundle.getState() === 'STARTING' || bundle.getState() === 'STOPPING') {
            throw new Error('Bundle ' + bundle.getUniqueIdentifier() + ' cannot be updated, since it is either STARTING or STOPPING.');
        }
        let rethrow;
        const oldState = bundle.getState();
        if (oldState === 'ACTIVE') {
            await this.stopBundle(bundle);
        }
        try {
            bundle.revise(headers);
        }
        catch (ex) {
            this.logger.error('Unable to update the bundle.', ex);
            rethrow = ex;
        }
        if (isAnyMissing(rethrow)) {
            this.setBundleStateAndNotify(bundle, 'INSTALLED');
            this.fireBundleEvent('UNRESOLVED', bundle, origin);
            this.fireBundleEvent('UPDATED', bundle, origin);
        }
        if (oldState === 'ACTIVE') {
            await this.startBundle(bundle);
        }
        return bundle;
    }
    async startBundle(bundle) {
        this.logger.info(`Starting Bundle: ${bundle.getSymbolicName()}: ${bundle.getVersion()}`);
        let rethrow;
        const validStates = ['INSTALLED'];
        if (!validStates.includes(bundle.getState())) {
            throw new Error(`Cannot start ${bundle.getUniqueIdentifier()}, because it\'s not in any of the valid states: ${validStates.join(', ')}.`);
        }
        bundle.setBundleContext(new BundleContextImpl(this.logger, bundle, this));
        this.setBundleStateAndNotify(bundle, 'STARTING');
        try {
            const revision = bundle.getCurrentRevision();
            if (isAllPresent(revision.getWiring()) || this.resolver.createWiringForRevision(revision)) {
                await this.activateBundle(bundle, false);
            }
        }
        catch (ex) {
            rethrow = ex;
            this.logger.error(`Error while starting Bundle: ${bundle.getSymbolicName()}: ${bundle.getVersion()}`, ex);
        }
        if (bundle.getState() === 'ACTIVE') {
            this.fireBundleEvent('STARTED', bundle);
            this.logger.info(`Started Bundle: ${bundle.getSymbolicName()}: ${bundle.getVersion()}`);
            await this.resolver.resolveRemaining();
        }
        else {
            bundle.setState('INSTALLED');
            this.fireBundleEvent('STOPPED', bundle);
            if (rethrow) {
                throw rethrow;
            }
        }
    }
    async activateBundle(bundle, fireEvent) {
        this.logger.info(`Activating Bundle: ${bundle.getSymbolicName()}: ${bundle.getVersion()}`);
        if (bundle.getState() === 'ACTIVE') {
            return;
        }
        let rethrow = null;
        try {
            const activator = await this.createBundleActivator(bundle);
            bundle.setActivator(activator);
        }
        catch (th) {
            rethrow = th;
        }
        try {
            this.fireBundleEvent('STARTING', bundle);
            if (isAllPresent(rethrow)) {
                throw rethrow;
            }
            if (isAllPresent(bundle.getActivator())) {
                await bundle.getActivator().start(bundle.getBundleContext());
            }
            this.setBundleStateAndNotify(bundle, 'ACTIVE');
            if (fireEvent) {
                this.fireBundleEvent('STARTED', bundle);
            }
        }
        catch (th) {
            this.logger.error(th);
            this.fireBundleEvent('STOPPING', bundle);
            this.setBundleStateAndNotify(bundle, 'INSTALLED');
            bundle.setActivator(null);
            const bci = bundle.getBundleContext();
            bci.invalidate();
            bci.closeTrackers();
            bundle.setBundleContext(null);
            this.registry.unregisterServices(bundle);
            this.registry.ungetServices(bundle);
            this.dispatcher.removeListeners(bci);
            // Rethrow all other exceptions as a BundleException.
            throw new Error('Activator start error in bundle ' + bundle + ': ' + th);
        }
    }
    async stopBundle(bundle) {
        try {
            let error;
            let wasActive = false;
            switch (bundle.getState()) {
                case 'UNINSTALLED':
                    throw new Error('Cannot stop an uninstalled bundle.');
                case 'STARTING':
                case 'STOPPING':
                    throw new Error('Stopping a starting or stopping bundle is currently not supported.');
                case 'INSTALLED':
                    return;
                case 'ACTIVE':
                    wasActive = true;
                    break;
            }
            this.logger.info(`Stopping Bundle: ${bundle.getUniqueIdentifier()}...`);
            bundle.setState('STOPPING');
            this.fireBundleEvent('STOPPING', bundle);
            if (wasActive || bundle.getBundleId() === 0) {
                try {
                    if (typeof bundle.getActivator()?.stop === 'function') {
                        await bundle.getActivator().stop(bundle.getBundleContext());
                    }
                }
                catch (err) {
                    error = err;
                }
            }
            if (bundle.getBundleId() !== 0) {
                bundle.setActivator(null);
                const bci = bundle.getBundleContext();
                bci.invalidate();
                bci.closeTrackers();
                bundle.setBundleContext(null);
                // Unregister any services offered by this bundle.
                this.registry.unregisterServices(bundle);
                // Release any services being used by this bundle.
                this.registry.ungetServices(bundle);
                // The spec says that we must remove all event listeners for a bundle when it is stopped.
                this.dispatcher.removeListeners(bci);
                // tear down wires where bundle was a requirement for others
                bundle.getCurrentRevision().resolve(undefined);
                bundle.setState('INSTALLED');
            }
            if (!!error) {
                throw new Error('Activator stop error in bundle ' + bundle + ': ' + error);
            }
        }
        finally {
        }
        for (const requirer of this.resolver.getActiveRequirers(bundle)) {
            await this.stopBundle(requirer);
        }
        this.logger.info(`Stopped Bundle: ${bundle.getUniqueIdentifier()}...`);
        this.fireBundleEvent('STOPPED', bundle);
    }
    getBundle(id) {
        return this.bundles.find((b) => b.getBundleId() === id);
    }
    isBundlePresent(headers) {
        return this.bundles.find((b) => b.getSymbolicName() === headers[BUNDLE_SYMBOLICNAME]);
    }
    fireBundleEvent(type, bundle, origin) {
        this.dispatcher.fireBundleEvent(new BundleEventImpl(bundle, type, origin), this);
    }
    fireFrameworkEvent(type, bundle, error) {
        this.dispatcher.fireFrameworkEvent(new FrameworkEventImpl(type, bundle, error), this);
    }
    getProperty(key) {
        return this.configMap.get(key);
    }
    getBundles(bc) {
        return [...this.bundles];
    }
    addBundleListener(bundle, l) {
        this.dispatcher.addListener(bundle.getBundleContext(), 'BUNDLE', l, null);
    }
    removeBundleListener(bundle, l) {
        this.dispatcher.removeListener(bundle.getBundleContext(), 'BUNDLE', l);
    }
    addServiceListener(bundle, listener, filter) {
        const newFilter = isAnyMissing(filter) ? null : Filter.parse(filter);
        this.dispatcher.addListener(bundle.getBundleContext(), 'SERVICE', listener, newFilter);
    }
    removeServiceListener(bundle, l) {
        this.dispatcher.removeListener(bundle.getBundleContext(), 'SERVICE', l);
    }
    addFrameworkListener(bundle, l) {
        this.dispatcher.addListener(bundle.getBundleContext(), 'FRAMEWORK', l, null);
    }
    removeFrameworkListener(bundle, l) {
        this.dispatcher.removeListener(bundle.getBundleContext(), 'FRAMEWORK', l);
    }
    getConfig() {
        return this.configMap;
    }
    getActivatorsList() {
        return this.activatorsList;
    }
    fireServiceEvent(event, oldProps) {
        this.dispatcher.fireServiceEvent(event, oldProps);
    }
    setBundleStateAndNotify(bundle, state) {
        bundle.setState(state);
    }
    getResolver() {
        return this.resolver;
    }
    async uninstallBundle(bundle) {
        this.logger.info(`Uninstalling Bundle: ${bundle.getUniqueIdentifier()}...`);
        const desiredStates = ['INSTALLED', 'STARTING', 'ACTIVE', 'STOPPING'];
        if (!desiredStates.includes(bundle.getState())) {
            if (bundle.getState() === 'UNINSTALLED') {
                throw new Error('Cannot uninstall an uninstalled bundle.');
            }
            else {
                throw new Error(`Bundle ${bundle.getUniqueIdentifier()} cannot be uninstalled because it is in an undesired state: ${bundle.getState()}`);
            }
        }
        if (bundle.getState() === 'STARTING' || bundle.getState() === 'STOPPING') {
            throw new Error('Bundle ' + bundle.getUniqueIdentifier() + ' cannot be uninstalled, since it is either STARTING or STOPPING.');
        }
        let errored = null;
        if (bundle.getState() === 'ACTIVE') {
            try {
                await this.stopBundle(bundle);
            }
            catch (err) {
                this.logger.error(`Error stopping bundle: ${bundle.getUniqueIdentifier()}`, err);
                this.fireFrameworkEvent('ERROR', bundle, err);
                errored = err;
            }
        }
        this.fireBundleEvent('UNRESOLVED', bundle);
        if (!errored) {
            bundle.setState('UNINSTALLED');
            this.fireBundleEvent('UNINSTALLED', bundle);
            this.logger.info(`Uninstalled bundle: ${bundle.getUniqueIdentifier()}`);
        }
    }
    getAllowedServiceReferences(bundle, className, expr, checkAssignable = false) {
        const refs = this.getServiceReferences(bundle, className, expr, checkAssignable);
        return isAnyMissing(refs) ? [] : [...refs];
    }
    getServiceReferences(bundle, className, expr, checkAssignable = false) {
        let filter = null;
        if (isAllPresent(expr)) {
            filter = Filter.parse(expr);
        }
        const refList = this.registry.getServiceReferences(className, filter);
        const effectiveRefList = [];
        if (checkAssignable) {
            for (const ref of refList) {
                if (Pandino.isServiceAssignable(bundle, ref)) {
                    effectiveRefList.push(ref);
                }
            }
        }
        if (effectiveRefList.length > 0) {
            return effectiveRefList;
        }
        return [];
    }
    getNextId() {
        const n = this.nextId;
        this.nextId++;
        return n;
    }
    async createBundleActivator(impl) {
        let activator = null;
        let headerMap = impl.getHeaders();
        let activatorDefinition = headerMap[BUNDLE_ACTIVATOR];
        if (isAnyMissing(activatorDefinition)) {
            throw new Error('Missing mandatory Bundle Activator!');
        }
        else if (typeof activatorDefinition === 'string') {
            this.logger.debug(`Attempting to load Activator from: ${activatorDefinition}`);
            let activatorInstance;
            const activatorModule = await this.importer.import(activatorDefinition, impl.getLocation(), impl.getDeploymentRoot());
            const bundleType = impl.getHeaders()[BUNDLE_TYPE] || 'esm';
            if (bundleType !== 'esm' && bundleType !== 'umd') {
                throw new Error(`Unsupported Bundle Type: ${bundleType}!`);
            }
            const activatorResolver = this.configMap.get(PANDINO_ACTIVATOR_RESOLVERS)[bundleType];
            if (!activatorResolver) {
                throw new Error(`No ActivatorResolver can be found in configuration for BundleType: ${bundleType}!`);
            }
            activatorInstance = activatorResolver.resolve(activatorModule, impl.getHeaders());
            if (!activatorInstance) {
                throw new Error(`Activator for ${impl
                    .getCurrentRevision()
                    .getSymbolicName()} could not be loaded! Resolver probably returned undefined. Please check corresponding ActivatorResolver!`);
            }
            activator =
                typeof activatorInstance === 'function' ? new activatorInstance() : activatorInstance;
        }
        else {
            return impl.getActivator();
        }
        return activator;
    }
    static isServiceAssignable(requester, ref) {
        let allow = true;
        const objectClass = ref.getProperty(OBJECTCLASS);
        if (Array.isArray(objectClass)) {
            for (let classIdx = 0; allow && classIdx < objectClass.length; classIdx++) {
                if (!ref.isAssignableTo(requester, objectClass[classIdx])) {
                    allow = false;
                }
            }
        }
        else {
            if (!ref.isAssignableTo(requester, objectClass)) {
                allow = false;
            }
        }
        return allow;
    }
    getService(bundle, ref, isServiceObjects) {
        try {
            return this.registry.getService(bundle, ref, isServiceObjects);
        }
        catch (ex) {
            this.fireFrameworkEvent('ERROR', bundle, ex);
        }
        return undefined;
    }
    ungetService(bundle, ref, srvObj) {
        return this.registry.ungetService(bundle, ref, srvObj);
    }
    registerService(context, identifier, svcObj, dict) {
        let reg = this.registry.registerService(context.getBundle(), identifier, svcObj, dict);
        this.fireServiceEvent(new ServiceEventImpl('REGISTERED', reg.getReference()), {});
        return reg;
    }
    getLocation() {
        return SYSTEM_BUNDLE_LOCATION;
    }
    getBundleRegisteredServices(bundle) {
        if (bundle.getState() === 'UNINSTALLED') {
            throw new Error('The bundle is uninstalled.');
        }
        return this.registry.getRegisteredServices(bundle);
    }
}

export { Pandino as default };
