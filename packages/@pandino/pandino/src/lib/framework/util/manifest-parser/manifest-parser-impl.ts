import {
  ActivationPolicy,
  BundleConfigMap,
  ACTIVATION_LAZY,
  BUNDLE_ACTIVATIONPOLICY,
  BUNDLE_MANIFESTVERSION,
  BUNDLE_NAMESPACE,
  BUNDLE_SYMBOLICNAME,
  BUNDLE_VERSION,
  BUNDLE_VERSION_ATTRIBUTE,
  EXCLUDE_DIRECTIVE,
  FILTER_DIRECTIVE,
  FRAGMENT_HOST,
  INCLUDE_DIRECTIVE,
  PROVIDE_CAPABILITY,
  REQUIRE_BUNDLE,
  REQUIRE_CAPABILITY,
  BundleManifestHeaders,
  SemVer,
} from '@pandino/pandino-api';
import { BundleCapabilityImpl } from '../../wiring/bundle-capability-impl';
import { ParsedHeaderClause } from './parsed-header-clause';
import { BundleRequirementImpl } from '../../wiring/bundle-requirement-impl';
import Filter, { FilterComp } from '../../../filter/filter';
import { convert, parse } from '../../../filter';
import { isAnyMissing } from '../../../utils/helpers';
import { ManifestParser } from './manifest-parser';
import { BundleRequirement } from '../../wiring/bundle-requirement';
import { BundleCapability } from '../../wiring/bundle-capability';
import { BundleRevision } from '../../bundle-revision';
import { SemVerImpl } from '../../../utils/semver-impl';
import { parseDelimitedString } from './utils';

export class ManifestParserImpl implements ManifestParser {
  private readonly configMap: BundleConfigMap;
  private readonly headerMap: Record<string, any>;
  private readonly requirements: BundleRequirement[] = [];
  private readonly capabilities: BundleCapability[] = [];
  private readonly bundleSymbolicName: string;
  private readonly bundleVersion: SemVer;
  private activationIncludeDir: string;
  private activationExcludeDir: string;
  private activationPolicy: ActivationPolicy = 'EAGER_ACTIVATION';

  static readonly EMPTY_VERSION = new SemVerImpl('0.0.0');

  constructor(configMap: BundleConfigMap, owner: BundleRevision, headerMap: BundleManifestHeaders) {
    this.configMap = configMap;
    this.headerMap = headerMap;

    const capList: Array<BundleCapability> = [];

    // Parse bundle version.
    this.bundleVersion = ManifestParserImpl.EMPTY_VERSION;
    if (headerMap[BUNDLE_VERSION] !== null && headerMap[BUNDLE_VERSION] !== undefined) {
      try {
        this.bundleVersion = new SemVerImpl(headerMap[BUNDLE_VERSION]);
      } catch (ex) {
        if (this.getManifestVersion() === '2') {
          throw ex;
        }
        this.bundleVersion = ManifestParserImpl.EMPTY_VERSION;
      }
    }

    // Parse bundle symbolic name.
    const bundleCap: BundleCapability = ManifestParserImpl.parseBundleSymbolicName(owner, this.headerMap);
    if (bundleCap) {
      this.bundleSymbolicName = bundleCap.getAttributes()[BUNDLE_NAMESPACE];

      if (!headerMap[FRAGMENT_HOST]) {
        capList.push(bundleCap);
      }

      capList.push(BundleCapabilityImpl.addIdentityCapability(owner, headerMap, bundleCap));
    }

    // Verify that bundle symbolic name is specified.
    if (this.getManifestVersion() === '2' && !this.bundleSymbolicName) {
      throw new Error('R4 bundle manifests must include bundle symbolic name.');
    }

    // Parse Require-Bundle
    let rbClauses: Array<ParsedHeaderClause> = ManifestParserImpl.parseStandardHeader(headerMap[REQUIRE_BUNDLE]);
    rbClauses = ManifestParserImpl.normalizeRequireClauses(rbClauses, this.getManifestVersion());
    const rbReqs: Array<BundleRequirementImpl> = ManifestParserImpl.convertRequires(rbClauses, owner);

    // Parse Require-Capability.
    const requireCaps: Array<BundleRequirement> = [];
    if (Array.isArray(headerMap[REQUIRE_CAPABILITY])) {
      for (const part of headerMap[REQUIRE_CAPABILITY]) {
        requireCaps.push(...ManifestParserImpl.getRequiredClauses(part.trim(), owner));
      }
    } else if (typeof headerMap[REQUIRE_CAPABILITY] === 'string') {
      requireCaps.push(
        ...ManifestParserImpl.getRequiredClauses((headerMap[REQUIRE_CAPABILITY] as string).trim(), owner),
      );
    }

    // Parse Provide-Capability.
    const provideCaps: Array<BundleCapability> = [];
    if (Array.isArray(headerMap[PROVIDE_CAPABILITY])) {
      for (const part of headerMap[PROVIDE_CAPABILITY]) {
        provideCaps.push(...ManifestParserImpl.getProviderClauses(part.trim(), owner));
      }
    } else if (typeof headerMap[PROVIDE_CAPABILITY] === 'string') {
      provideCaps.push(
        ...ManifestParserImpl.getProviderClauses((headerMap[PROVIDE_CAPABILITY] as string).trim(), owner),
      );
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

  private static getProviderClauses(part: string, owner: BundleRevision): Array<BundleCapability> {
    let provideClauses: Array<ParsedHeaderClause> = ManifestParserImpl.parseStandardHeader(part);
    provideClauses = ManifestParserImpl.normalizeCapabilityClauses(provideClauses);
    return ManifestParserImpl.convertProvideCapabilities(provideClauses, owner);
  }

  private static getRequiredClauses(part: string, owner: BundleRevision): Array<BundleRequirement> {
    let provideClauses: Array<ParsedHeaderClause> = ManifestParserImpl.parseStandardHeader(part);
    provideClauses = ManifestParserImpl.normalizeCapabilityClauses(provideClauses);
    return ManifestParserImpl.convertRequireCapabilities(provideClauses, owner);
  }

  getActivationIncludeDirective(): string {
    return this.activationIncludeDir;
  }
  getActivationExcludeDirective(): string {
    return this.activationExcludeDir;
  }

  getActivationPolicy(): ActivationPolicy {
    return this.activationPolicy;
  }

  getSymbolicName(): string {
    return this.bundleSymbolicName;
  }

  getBundleVersion(): SemVer {
    return this.bundleVersion;
  }

  getName(path: string): string {
    const idx = path.lastIndexOf('/');
    return idx > -1 ? path.substring(idx) : path;
  }

  getCapabilities(): BundleCapability[] {
    return this.capabilities;
  }

  getRequirements(): BundleRequirement[] {
    return this.requirements;
  }

  getManifestVersion(): string {
    const manifestVersion = ManifestParserImpl.getManifestVersion(this.headerMap);
    return isAnyMissing(manifestVersion) ? '1' : manifestVersion;
  }

  private static getManifestVersion(headerMap: Record<string, any>): string {
    const manifestVersion = headerMap[BUNDLE_MANIFESTVERSION] as string;
    return isAnyMissing(manifestVersion) ? null : manifestVersion.trim();
  }

  private static parseBundleSymbolicName(
    owner: BundleRevision,
    headerMap: Record<string, any>,
  ): BundleCapabilityImpl | undefined {
    const clauses: Array<ParsedHeaderClause> = this.normalizeCapabilityClauses(
      this.parseStandardHeader(headerMap[BUNDLE_SYMBOLICNAME]),
    );
    if (clauses.length > 0) {
      if (clauses.length > 1) {
        throw new Error('Cannot have multiple symbolic names: ' + headerMap[BUNDLE_SYMBOLICNAME]);
      } else if (clauses[0].paths.length > 1) {
        throw new Error('Cannot have multiple symbolic names: ' + headerMap[BUNDLE_SYMBOLICNAME]);
      } else if (clauses[0].attrs.hasOwnProperty(BUNDLE_VERSION)) {
        throw new Error('Cannot have a bundle version: ' + headerMap[BUNDLE_VERSION]);
      }

      // Get bundle version.
      let bundleVersion = this.EMPTY_VERSION;
      if (headerMap[BUNDLE_VERSION] !== null && headerMap[BUNDLE_VERSION] !== undefined) {
        try {
          bundleVersion = new SemVerImpl(headerMap[BUNDLE_VERSION]);
        } catch (ex) {
          let mv: string = this.getManifestVersion(headerMap);
          if (mv !== null && mv !== undefined) {
            throw ex;
          }
          bundleVersion = this.EMPTY_VERSION;
        }
      }

      // Create a require capability and return it.
      clauses[0].attrs[BUNDLE_NAMESPACE] = clauses[0].paths[0];
      clauses[0].attrs[BUNDLE_VERSION_ATTRIBUTE] = bundleVersion;
      return new BundleCapabilityImpl(owner, BUNDLE_NAMESPACE, clauses[0].dirs, clauses[0].attrs);
    }

    return undefined;
  }

  private static parseStandardHeader(header: string): ParsedHeaderClause[] {
    const clauses: ParsedHeaderClause[] = [];

    if (isAnyMissing(header)) {
      return clauses;
    }

    if (!header.match(/[,;:=]/)) {
      const clause = new ParsedHeaderClause([header], {}, {}, {});
      clauses.push(clause);

      return clauses;
    }

    const semiColons = header.split(';');

    let clause: ParsedHeaderClause;
    let dirs: Record<string, string> = {};
    let attrs: Record<string, any> = {};
    let types: Record<string, string> = {};

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
      } else if (isAttribute) {
        const [attrKey, attrValue] = trimValue.split('=');
        const valueEscaped = attrValue.trim().replace(/"|\\"/g, '').toString();
        const isCasted = attrKey.includes(':');

        if (!isCasted) {
          attrs[attrKey] = valueEscaped;
        } else {
          const [attrKeyTyped, attrType] = attrKey.split(':');
          types[attrKeyTyped] = attrType;

          if (attrType === 'number') {
            attrs[attrKeyTyped] = Number(valueEscaped);
          } else if (attrType === 'boolean') {
            attrs[attrKeyTyped] = valueEscaped === 'true';
          } else if (attrType === 'SemVer') {
            attrs[attrKeyTyped] = new SemVerImpl(valueEscaped);
          } else if (attrType.startsWith('Array')) {
            attrs[attrKeyTyped] = valueEscaped;
          } else {
            attrs[attrKeyTyped] = valueEscaped;
          }
        }
      }
    });

    clauses.push(clause);

    return clauses;
  }

  private static normalizeCapabilityClauses(clauses: ParsedHeaderClause[]): ParsedHeaderClause[] {
    for (const clause of clauses) {
      for (const [key, type] of Object.entries(clause.types)) {
        if (type !== 'string') {
          if (type === 'number') {
            clause.attrs[key] = Number(clause.attrs[key].toString().trim());
          } else if (type === 'SemVer') {
            clause.attrs[key] = new SemVerImpl(clause.attrs[key].toString().trim());
          } else if (type.startsWith('Array')) {
            let startIdx = type.indexOf('<');
            let endIdx = type.indexOf('>');
            if ((startIdx > 0 && endIdx <= startIdx) || (startIdx < 0 && endIdx > 0)) {
              throw new Error("Invalid Provide-Capability attribute list type for '" + key + "' : " + type);
            }

            let listType = 'string';
            if (endIdx > startIdx) {
              listType = type.substring(startIdx + 1, endIdx).trim();
            }

            const tokens: Array<string> = parseDelimitedString(clause.attrs[key].toString().trim(), ',', false);
            const values: Array<any> = [];
            for (let token of tokens) {
              if (listType === 'string') {
                values.push(token);
              } else if (listType === 'number') {
                values.push(Number(token.trim()));
              } else if (listType === 'SemVer') {
                values.push(new SemVerImpl(token.trim()));
              } else {
                throw new Error("Unknown Provide-Capability attribute list type for '" + key + "' : " + type);
              }
            }
            clause.attrs[key] = values;
          } else {
            throw new Error("Unknown Provide-Capability attribute type for '" + key + "' : " + type);
          }
        }
      }
    }

    return clauses;
  }

  private static normalizeRequireClauses(clauses: ParsedHeaderClause[], mv: string): ParsedHeaderClause[] {
    if (mv !== '2') {
      clauses.length = 0;
    } else {
      for (const clause of clauses) {
        let value = clause.attrs[BUNDLE_VERSION_ATTRIBUTE];
        if (value !== null && value !== undefined) {
          clause.attrs[BUNDLE_VERSION_ATTRIBUTE] = new SemVerImpl(value.toString());
        }
      }
    }

    return clauses;
  }

  private static convertRequires(clauses: ParsedHeaderClause[], owner: BundleRevision): BundleRequirementImpl[] {
    const reqList: Array<BundleRequirementImpl> = [];
    for (const clause of clauses) {
      for (const path of clause.paths) {
        const attrs: Record<string, any> = clause.attrs;
        const newAttrs: Record<string, any> = {
          [BUNDLE_NAMESPACE]: path,
          ...attrs,
          [BUNDLE_NAMESPACE]: path, // ensure it's not overwritten
        };
        const sf: Filter = convert(newAttrs);
        const dirs: Record<string, string> = clause.dirs;
        const newDirs: Record<string, string> = {
          ...dirs,
          FILTER_DIRECTIVE: sf.toString(),
        };

        reqList.push(new BundleRequirementImpl(owner, BUNDLE_NAMESPACE, newDirs, newAttrs));
      }
    }

    return reqList;
  }

  private static convertRequireCapabilities(clauses: ParsedHeaderClause[], owner: BundleRevision): BundleRequirement[] {
    const reqList: BundleRequirement[] = [];
    for (const clause of clauses) {
      try {
        let filterStr: string = clause.dirs[FILTER_DIRECTIVE];
        const sf: Filter = !!filterStr
          ? parse(filterStr.trim().replace(/"|\\"/g, '').toString())
          : new Filter(null, FilterComp.MATCH_ALL, null, []);
        for (const path of clause.paths) {
          if (path.startsWith('pandino.wiring.')) {
            throw new Error("Manifest cannot use Require-Capability for '" + path + "' namespace.");
          }

          reqList.push(new BundleRequirementImpl(owner, path, clause.dirs, clause.attrs, sf));
        }
      } catch (ex) {
        throw new Error('Error creating requirement: ' + ex);
      }
    }

    return reqList;
  }

  private static convertProvideCapabilities(clauses: ParsedHeaderClause[], owner: BundleRevision): BundleCapability[] {
    const capList: Array<BundleCapability> = [];
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

  private parseActivationPolicy(headerMap: Record<string, any>): void {
    this.activationPolicy = 'EAGER_ACTIVATION';

    const clauses: Array<ParsedHeaderClause> = ManifestParserImpl.parseStandardHeader(
      headerMap[BUNDLE_ACTIVATIONPOLICY],
    );

    if (clauses.length > 0) {
      for (const path of clauses[0].paths) {
        if (path === ACTIVATION_LAZY) {
          this.activationPolicy = 'LAZY_ACTIVATION';
          for (const [key, value] of Object.entries(clauses[0].dirs)) {
            if (key.toLowerCase() === INCLUDE_DIRECTIVE.toLowerCase()) {
              this.activationIncludeDir = value;
            } else if (key.toLowerCase() === EXCLUDE_DIRECTIVE.toLowerCase()) {
              this.activationExcludeDir = value;
            }
          }
          break;
        }
      }
    }
  }
}
