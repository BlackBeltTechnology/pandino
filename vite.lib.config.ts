import { resolve } from 'node:path';
import { defineConfig, type PluginOption, type UserConfig } from 'vite';
import dts from 'vite-plugin-dts';

type BuildOptions = NonNullable<UserConfig['build']>;
type ExternalOption = NonNullable<NonNullable<BuildOptions['rollupOptions']>['external']>;

export interface LibConfigOptions {
  /** Global name of the generated library. */
  name: string;
  /** Artifact basename: emits `<artifact>.esm.js` and `<artifact>.cjs.js`. */
  artifact: string;
  /** Modules kept out of the bundle. */
  external: ExternalOption;
  /** Extra compile-time constants, e.g. injected package metadata. */
  define?: UserConfig['define'];
  /** Plugins applied ahead of `vite-plugin-dts`. */
  plugins?: PluginOption[];
  /** Globs excluded from declaration emit; defaults to node_modules and tests. */
  dtsExclude?: string[];
  /** Build target, for packages not built against the browser default. */
  target?: BuildOptions['target'];
  /** Resolve conditions, e.g. `['node']` for a build-time plugin. */
  conditions?: string[];
}

const DEFAULT_DTS_EXCLUDE = ['**/node_modules/**', '**/__tests__/**', '**/*.test.ts'];

/**
 * Shared Vite setup for the workspace's library packages: a dual ESM + CJS build
 * of `src/index.ts` emitted as a single unchunked artifact, with declaration files.
 * Only the parts that genuinely differ per package are parameters.
 */
export function defineLibConfig(options: LibConfigOptions) {
  return defineConfig(({ mode }) => {
    const isModeNotDev = mode !== 'development';
    return {
      base: '',
      define: options.define,
      resolve: options.conditions ? { conditions: options.conditions } : undefined,
      build: {
        target: options.target,
        lib: {
          entry: resolve('src/index.ts'),
          name: options.name,
          formats: ['es', 'cjs'],
          fileName: (format) => `${options.artifact}.${format === 'cjs' ? 'cjs' : 'esm'}.js`,
        },
        minify: isModeNotDev,
        sourcemap: isModeNotDev,
        rollupOptions: {
          external: options.external,
          output: {
            // Disable chunking completely for a single artifact
            manualChunks: undefined,
          },
        },
      },
      plugins: [
        ...(options.plugins ?? []),
        dts({
          exclude: options.dtsExclude ?? DEFAULT_DTS_EXCLUDE,
          entryRoot: 'src',
          outDir: 'dist',
          rollupTypes: false,
        }),
      ],
    };
  });
}
