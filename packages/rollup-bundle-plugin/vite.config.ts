import { builtinModules } from 'node:module';
import { defineLibConfig } from '../../vite.lib.config';
import pkg from './package.json';

const deps = Object.keys(pkg.dependencies || {});
const builtins = new Set<string>([...builtinModules, ...builtinModules.map((m) => `node:${m}`)]);

export default defineLibConfig({
  name: 'RollupPluginPandinoBundle',
  artifact: 'index',
  target: 'node20',
  // Ensure Node built-ins and our deps are not bundled (and not browser-externals)
  external: (id) => deps.includes(id) || builtins.has(id) || id.startsWith('node:'),
  conditions: ['node'],
});
