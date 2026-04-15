import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Plugin, OutputBundle } from 'rollup';
import picomatch from 'picomatch';
import ts from 'typescript';

export interface PandinoBundleOptions {
  include?: string | string[];
  exclude?: string | string[];
  rootDir?: string;
  componentsDecorator?: string; // e.g. 'Component'
  activator?: string; // path to module exporting default activator
  virtualId?: string; // e.g. 'pandino:bundle'
  outputFile?: string; // e.g. 'pandino/bundle.js'
  headers?: Partial<{
    bundleSymbolicName: string;
    bundleVersion: string;
    bundleName?: string;
    bundleDescription?: string;
    bundleManifestVersion?: string;
    fragmentHost?: string;
    [key: string]: any;
  }>;
}

interface DiscoveredComponent {
  id: string; // module id/path
  export: 'default' | string; // export name
  localImportName: string; // unique identifier used in generated module
}

const DEFAULT_INCLUDE = ['**/*.{js,jsx,ts,tsx}'];
const DEFAULT_EXCLUDE = ['**/node_modules/**', '**/dist/**', '**/build/**'];
const DEFAULT_VIRTUAL_ID = 'pandino:bundle';
const DEFAULT_OUTPUT_FILE = 'pandino/bundle.js';

export default function pandinoBundle(options: PandinoBundleOptions = {}): Plugin {
  const include = toArray(options.include ?? DEFAULT_INCLUDE);
  const exclude = toArray(options.exclude ?? DEFAULT_EXCLUDE);
  const rootDir = path.resolve(options.rootDir ?? process.cwd());
  const componentsDecorator = options.componentsDecorator ?? 'Component';
  const virtualId = options.virtualId ?? DEFAULT_VIRTUAL_ID;
  const outputFile = options.outputFile ?? DEFAULT_OUTPUT_FILE;

  const isIncluded = makeFilter(include, exclude, rootDir);

  // State collected across hooks
  const components = new Map<string, DiscoveredComponent>(); // key: moduleId#export
  let headers: Record<string, any> | null = null;
  let activatorPath: string | null = options.activator ? pathResolveWithRoot(rootDir, options.activator) : null;

  function addComponent(comp: DiscoveredComponent) {
    const key = `${comp.id}#${comp.export}`;
    if (!components.has(key)) {
      components.set(key, comp);
    }
  }

  return {
    name: 'pandino-bundle',

    async options() {
      return null;
    },

    async buildStart() {
      // Resolve default headers from package.json
      if (!headers) {
        headers = await resolveHeaders(rootDir, options.headers);
      }

      // Pre-scan filesystem for components
      const files = await listFiles(rootDir, isIncluded);
      for (const file of files) {
        const code = await safeReadFile(file);
        if (!code) continue;
        const found = findComponentsInCode(file, code, componentsDecorator);
        for (const f of found) addComponent(f);
      }

      // Emit the virtual chunk so Rollup knows about it even if not explicitly imported as input
      this.emitFile({ type: 'chunk', id: virtualId, name: path.basename(outputFile, path.extname(outputFile)) });
    },

    resolveId(source) {
      if (source === virtualId) {
        return source;
      }
      return null;
    },

    async load(id) {
      if (id !== virtualId) return null;
      if (!headers) headers = await resolveHeaders(rootDir, options.headers);

      const comps = Array.from(components.values());
      // Stabilize order for deterministic builds
      comps.sort((a, b) => (a.id === b.id ? a.export.localeCompare(b.export) : a.id.localeCompare(b.id)));

      // Build import statements
      const importLines: string[] = [];
      const componentIds: string[] = [];

      for (let i = 0; i < comps.length; i++) {
        const c = comps[i];
        const importName = c.localImportName;
        if (c.export === 'default') {
          importLines.push(`import ${importName} from ${JSON.stringify(toModuleSpecifier(c.id, rootDir))};`);
        } else {
          importLines.push(
            `import { ${c.export} as ${importName} } from ${JSON.stringify(toModuleSpecifier(c.id, rootDir))};`,
          );
        }
        componentIds.push(importName);
      }

      let activatorImport = '';
      let activatorRef = 'undefined';
      if (activatorPath) {
        activatorImport = `import Activator from ${JSON.stringify(toModuleSpecifier(activatorPath, rootDir))};`;
        activatorRef = 'Activator';
      }

      const hdrs = headers ?? {};
      const jsonHeaders = {
        bundleSymbolicName: hdrs.bundleSymbolicName,
        bundleVersion: hdrs.bundleVersion,
        ...(hdrs.bundleName ? { bundleName: hdrs.bundleName } : {}),
        ...(hdrs.bundleDescription ? { bundleDescription: hdrs.bundleDescription } : {}),
        ...(hdrs.bundleManifestVersion ? { bundleManifestVersion: hdrs.bundleManifestVersion } : {}),
        ...(hdrs.fragmentHost ? { fragmentHost: hdrs.fragmentHost } : {}),
      } as any;

      const code = [
        ...importLines,
        activatorImport,
        `const headers = ${JSON.stringify(jsonHeaders, null, 2)};`,
        `const components = [${componentIds.join(', ')}];`,
        'export default { headers, activator: ' + activatorRef + ', components };',
      ].join('\n');

      return code;
    },

    async transform(code, id) {
      if (!isIncluded(id)) return null;
      const found = findComponentsInCode(id, code, componentsDecorator);
      if (found.length) {
        for (const f of found) addComponent(f);
      }
      return null;
    },

    async generateBundle(_options, _bundle: OutputBundle) {
      // Ensure our virtual module is emitted as a specific file path
      // Consumers may omit using it as entry; we still want a consistent chunk name/location.
      // Rollup will decide final file name; we provide a hint using fileName pattern by hooking renderChunk is overkill.
      // As a minimal approach, we set the manualChunks via name above and let user control output. We also add an asset referencing the virtual id path.
      // For better control, we add a small stub entry that imports the virtual module and let Rollup emit it.
      // Nothing else to do here minimally.
      return;
    },
  };
}

function toArray<T>(v: T | T[] | undefined): T[] {
  if (!v) return [] as T[];
  return Array.isArray(v) ? v : [v];
}

function makeFilter(include: string[], exclude: string[], rootDir: string) {
  const includeMatchers = include.map((p) => picomatch(p, { dot: true }));
  const excludeMatchers = exclude.map((p) => picomatch(p, { dot: true }));
  return (id: string) => {
    const rel = normalizePath(path.isAbsolute(id) ? path.relative(rootDir, id) : id);
    if (excludeMatchers.some((m) => m(rel))) return false;
    if (!includeMatchers.length) return true;
    return includeMatchers.some((m) => m(rel));
  };
}

async function listFiles(rootDir: string, filter: (id: string) => boolean): Promise<string[]> {
  const results: string[] = [];
  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        // Quick skip of common ignored folders
        if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist' || e.name === 'build') continue;
        await walk(full);
      } else if (e.isFile()) {
        if (filter(full)) results.push(full);
      }
    }
  }
  await walk(rootDir);
  return results;
}

async function resolveHeaders(rootDir: string, overrides?: PandinoBundleOptions['headers']) {
  const pkgPath = path.join(rootDir, 'package.json');
  let pkg: any = {};
  try {
    const raw = await fs.readFile(pkgPath, 'utf8');
    pkg = JSON.parse(raw);
  } catch {
    // ignore
  }
  const headers = {
    bundleSymbolicName: pkg.name ?? 'unknown',
    bundleVersion: pkg.version ?? '0.0.0',
  } as Record<string, any>;
  if (overrides) Object.assign(headers, overrides);
  return headers;
}

function pathResolveWithRoot(rootDir: string, maybeRelative: string) {
  return path.isAbsolute(maybeRelative) ? maybeRelative : path.resolve(rootDir, maybeRelative);
}

function toModuleSpecifier(filePath: string, rootDir: string) {
  // Prefer relative path from rootDir to keep deterministic and compatible with bundlers.
  let rel = path.relative(rootDir, filePath);
  if (!rel.startsWith('.')) rel = './' + rel;
  return normalizePath(rel);
}

function normalizePath(p: string) {
  return p.split(path.sep).join('/');
}

function safeReadFile(file: string): Promise<string | null> {
  return fs
    .readFile(file, 'utf8')
    .then((s) => s)
    .catch(() => null);
}

function findComponentsInCode(id: string, code: string, decoratorName: string): DiscoveredComponent[] {
  const scriptKind = inferScriptKind(id);
  const sf = ts.createSourceFile(id, code, ts.ScriptTarget.Latest, true, scriptKind);

  // Map local identifiers that refer to the decorator coming from '@pandino/decorators'
  const namedDecoratorAliases = new Set<string>(); // e.g. Component or CompAlias
  const namespaceDecoratorAliases = new Set<string>(); // e.g. Decorators when used as Decorators.Component

  sf.forEachChild((node) => {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const spec = node.moduleSpecifier.text;
      if (spec === '@pandino/decorators') {
        const clause = node.importClause;
        if (!clause) return;
        if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
          for (const el of clause.namedBindings.elements) {
            const name = el.name.text;
            const imported = el.propertyName?.text ?? el.name.text;
            if (imported === decoratorName) namedDecoratorAliases.add(name);
          }
        }
        if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
          namespaceDecoratorAliases.add(clause.namedBindings.name.text);
        }
      }
    }
  });

  const results: DiscoveredComponent[] = [];

  function checkDecorators(hasDecs: readonly ts.Decorator[] | undefined): boolean {
    if (!hasDecs || !hasDecs.length) return false;
    for (const d of hasDecs) {
      const expr = d.expression;
      if (ts.isIdentifier(expr)) {
        if (namedDecoratorAliases.has(expr.text)) return true;
      } else if (ts.isCallExpression(expr)) {
        const callee = expr.expression;
        if (ts.isIdentifier(callee) && namedDecoratorAliases.has(callee.text)) return true;
        if (ts.isPropertyAccessExpression(callee)) {
          if (
            ts.isIdentifier(callee.expression) &&
            namespaceDecoratorAliases.has(callee.expression.text) &&
            callee.name.text === decoratorName
          )
            return true;
        }
      } else if (ts.isPropertyAccessExpression(expr)) {
        if (
          ts.isIdentifier(expr.expression) &&
          namespaceDecoratorAliases.has(expr.expression.text) &&
          expr.name.text === decoratorName
        )
          return true;
      }
    }
    return false;
  }

  function visit(node: ts.Node) {
    if (ts.isClassDeclaration(node)) {
      const decs = (ts as any).getDecorators
        ? (ts as any).getDecorators(node)
        : ((node as any).decorators as readonly ts.Decorator[] | undefined);
      const has = checkDecorators(decs);
      if (has) {
        // Determine export form
        const isDefault =
          node.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword) &&
          node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
        const isNamedExport = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
        const className = node.name?.text ?? 'DefaultExportedComponent';
        if (isDefault) {
          results.push({ id, export: 'default', localImportName: makeLocalName(className, 'Default') });
        } else if (isNamedExport && node.name) {
          results.push({ id, export: className, localImportName: makeLocalName(className) });
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sf);
  return results;
}

function makeLocalName(base: string, suffix = ''): string {
  const safe = base.replace(/[^A-Za-z0-9_]/g, '_') + suffix;
  return `__pnd_${safe}`;
}

function inferScriptKind(id: string): ts.ScriptKind {
  const ext = path.extname(id).toLowerCase();
  switch (ext) {
    case '.ts':
      return ts.ScriptKind.TS;
    case '.tsx':
      return ts.ScriptKind.TSX;
    case '.jsx':
      return ts.ScriptKind.JSX;
    case '.mjs':
    case '.cjs':
    case '.js':
    default:
      return ts.ScriptKind.JS;
  }
}
