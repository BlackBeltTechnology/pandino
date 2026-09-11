import react from '@vitejs/plugin-react';
import { defineLibConfig } from '../../vite.lib.config';
import pkg from './package.json';

const peers = Object.keys(pkg.peerDependencies || {});

export default defineLibConfig({
  name: 'PandinoReactHooks',
  artifact: 'react-hooks',
  // Externalize peer deps and any of their subpaths (e.g. `react/jsx-runtime`),
  // so Rolldown doesn't inline them as CJS with a broken `require()` shim.
  external: (id) => peers.some((p) => id === p || id.startsWith(`${p}/`)),
  plugins: [react()],
  dtsExclude: ['**/node_modules/**', '**/__tests__/**', '**/*.test.ts', '**/*.test.tsx'],
});
