import { defineLibConfig } from '../../vite.lib.config';
import pkg from './package.json';

export default defineLibConfig({
  name: 'Pandino',
  artifact: 'pandino',
  external: Object.keys(pkg.peerDependencies || {}),
  define: {
    // Inject package version and name as environment variables
    'import.meta.env.VITE_PANDINO_VERSION': JSON.stringify(pkg.version),
    'import.meta.env.VITE_PANDINO_NAME': JSON.stringify(pkg.name),
  },
});
