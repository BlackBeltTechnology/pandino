import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pandinoBundle from '@pandino/rollup-bundle-plugin';

// Read package.json to extract name and version
const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Alpha bundle with activator
    pandinoBundle({
      virtualId: 'pandino:bundle:alpha',
      include: ['src/bundles/alpha/**/*.{ts,tsx}'],
      activator: 'src/bundles/alpha/activator.ts',
      headers: {
        bundleSymbolicName: `${packageJson.name}.alpha`,
        bundleVersion: packageJson.version,
        bundleDescription: 'Alpha example bundle',
      },
    }),
    // Beta bundle
    pandinoBundle({
      virtualId: 'pandino:bundle:beta',
      include: ['src/bundles/beta/**/*.{ts,tsx}'],
      headers: {
        bundleSymbolicName: `${packageJson.name}.beta`,
        bundleVersion: packageJson.version,
        bundleDescription: 'Beta example bundle',
      },
    }),
    // Gamma bundle
    pandinoBundle({
      virtualId: 'pandino:bundle:gamma',
      include: ['src/bundles/gamma/**/*.{ts,tsx}'],
      headers: {
        bundleSymbolicName: `${packageJson.name}.gamma`,
        bundleVersion: packageJson.version,
        bundleDescription: 'Gamma example bundle',
      },
    }),
  ],
  define: {
    'import.meta.env.VITE_BUNDLE_SYMBOLIC_NAME': JSON.stringify(packageJson.name),
    'import.meta.env.VITE_BUNDLE_VERSION': JSON.stringify(packageJson.version),
    'import.meta.env.VITE_BUNDLE_DESCRIPTION': JSON.stringify(packageJson.description),
  },
});
