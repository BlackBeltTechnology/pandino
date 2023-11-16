import { resolve } from "node:path";
import { defineConfig } from "vite";
import generateManifest from '@pandino/rollup-plugin-generate-manifest';
// @ts-ignore
import packageJson from "./package.json";

const getPackageName = () => {
  return packageJson.name;
};

const getPackageNameCamelCase = () => {
  try {
    return getPackageName().replace(/@/g, '').replace(/[\/\-]/g, '_').toUpperCase();
  } catch (err) {
    throw new Error("Name property in package.json is missing.");
  }
};

const fileName = {
  es: `${getPackageName()}.mjs`,
  cjs: `${getPackageName()}.cjs`,
  umd: `${getPackageName()}.umd.js`,
};

const formats = Object.keys(fileName) as Array<keyof typeof fileName>;

export default defineConfig(({ mode }) => ({
  base: "./",
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: getPackageNameCamelCase(),
      formats,
      fileName: (format) => fileName[format],
    },
  },
  plugins: [
    generateManifest(),
  ],
}));
