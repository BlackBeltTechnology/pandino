import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import generateManifest from '@pandino/rollup-plugin-generate-manifest';
// @ts-ignore
import packageJson from './package.json';

const getPackageName = () => {
  return packageJson.name;
};

const getPackageNameCamelCase = () => {
  try {
    return getPackageName()
      .replace(/@/g, '')
      .replace(/[\/\-]/g, '_')
      .toUpperCase();
  } catch (err) {
    throw new Error('Name property in package.json is missing.');
  }
};

const fileName = {
  es: `${getPackageName()}.mjs`,
  cjs: `${getPackageName()}.cjs`,
  umd: `${getPackageName()}.umd.js`,
};

const formats = Object.keys(fileName) as Array<keyof typeof fileName>;

export default defineConfig(({ mode }) => ({
  base: './',
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: getPackageNameCamelCase(),
      formats,
      fileName: (format) => fileName[format],
    },
  },
  plugins: [generateManifest(), dts()],
  define: {
    'import.meta.env.VITE_APP_NAME': JSON.stringify(packageJson.name),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version),
    'import.meta.env.VITE_REQUIRE_CAPABILITY': JSON.stringify(packageJson.pandino.manifest["Require-Capability"]),
    'import.meta.env.VITE_PROVIDE_CAPABILITY': JSON.stringify(packageJson.pandino.manifest["Provide-Capability"]),
  },
}));
