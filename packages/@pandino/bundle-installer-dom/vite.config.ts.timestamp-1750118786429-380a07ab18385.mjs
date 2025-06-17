// vite.config.ts
import { resolve } from 'node:path';
import { defineConfig } from 'file:///Users/noherczeg/projects/pandino/node_modules/.pnpm/vite@5.4.10_@types+node@22.8.0_terser@5.36.0/node_modules/vite/dist/node/index.js';
import dts from 'file:///Users/noherczeg/projects/pandino/node_modules/.pnpm/vite-plugin-dts@4.5.4_@types+node@22.8.0_rollup@4.24.0_typescript@5.6.3_vite@5.4.10_@types+node@22.8.0_terser@5.36.0_/node_modules/vite-plugin-dts/dist/index.mjs';
import generateManifest from 'file:///Users/noherczeg/projects/pandino/packages/@pandino/rollup-plugin-generate-manifest/src/index.cjs';

// package.json
var package_default = {
  name: '@pandino/bundle-installer-dom',
  version: '0.8.31',
  description: "Install Bundles defined in a browser's DOM",
  module: './dist/@pandino/bundle-installer-dom.mjs',
  types: 'dist/@pandino/bundle-installer-dom.d.ts',
  type: 'module',
  exports: {
    '.': {
      require: './dist/@pandino/bundle-installer-dom.cjs',
      import: './dist/@pandino/bundle-installer-dom.mjs',
    },
  },
  scripts: {
    build: 'rimraf dist && tsc && vite build',
    tsc: 'tsc',
  },
  keywords: ['pandino', 'bundle', 'installer', 'dom'],
  author: 'Norbert Herczeg <norbert.herczeg@blackbelt.hu>',
  license: 'EPL-2.0',
  homepage: 'https://github.com/BlackBeltTechnology/pandino',
  repository: {
    type: 'git',
    url: 'https://github.com/BlackBeltTechnology/pandino.git',
    directory: 'packages/@pandino/bundle-installer-dom',
  },
  bugs: {
    url: 'https://github.com/BlackBeltTechnology/pandino/issues',
  },
  engines: {
    node: '>=18',
  },
  publishConfig: {
    access: 'public',
  },
  files: ['dist'],
  devDependencies: {
    '@pandino/pandino-api': 'workspace:^',
    '@pandino/rollup-plugin-generate-manifest': 'workspace:^',
    rimraf: '^5.0.10',
    typescript: '^5.6.3',
    vite: '^5.4.10',
    'vite-plugin-dts': '^4.5.4',
  },
  pandino: {
    manifest: {
      'Provide-Capability': '@pandino/bundle-installer;type="DOM"',
    },
  },
};

// vite.config.ts
var __vite_injected_original_dirname = '/Users/noherczeg/projects/pandino/packages/@pandino/bundle-installer-dom';
var getPackageName = () => {
  return package_default.name;
};
var getPackageNameCamelCase = () => {
  try {
    return getPackageName()
      .replace(/@/g, '')
      .replace(/[\/\-]/g, '_')
      .toUpperCase();
  } catch (err) {
    throw new Error('Name property in package.json is missing.');
  }
};
var fileName = {
  es: `${getPackageName()}.mjs`,
  cjs: `${getPackageName()}.cjs`,
  umd: `${getPackageName()}.umd.js`,
};
var formats = Object.keys(fileName);
var vite_config_default = defineConfig(({ mode }) => ({
  base: './',
  build: {
    lib: {
      entry: resolve(__vite_injected_original_dirname, 'src/index.ts'),
      name: getPackageNameCamelCase(),
      formats,
      fileName: (format) => fileName[format],
    },
  },
  plugins: [generateManifest(), dts()],
}));
export { vite_config_default as default };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAicGFja2FnZS5qc29uIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL25vaGVyY3plZy9wcm9qZWN0cy9wYW5kaW5vL3BhY2thZ2VzL0BwYW5kaW5vL2J1bmRsZS1pbnN0YWxsZXItZG9tXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvbm9oZXJjemVnL3Byb2plY3RzL3BhbmRpbm8vcGFja2FnZXMvQHBhbmRpbm8vYnVuZGxlLWluc3RhbGxlci1kb20vdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL25vaGVyY3plZy9wcm9qZWN0cy9wYW5kaW5vL3BhY2thZ2VzL0BwYW5kaW5vL2J1bmRsZS1pbnN0YWxsZXItZG9tL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCBkdHMgZnJvbSAndml0ZS1wbHVnaW4tZHRzJztcbmltcG9ydCBnZW5lcmF0ZU1hbmlmZXN0IGZyb20gJ0BwYW5kaW5vL3JvbGx1cC1wbHVnaW4tZ2VuZXJhdGUtbWFuaWZlc3QnO1xuLy8gQHRzLWlnbm9yZVxuaW1wb3J0IHBhY2thZ2VKc29uIGZyb20gJy4vcGFja2FnZS5qc29uJztcblxuY29uc3QgZ2V0UGFja2FnZU5hbWUgPSAoKSA9PiB7XG4gIHJldHVybiBwYWNrYWdlSnNvbi5uYW1lO1xufTtcblxuY29uc3QgZ2V0UGFja2FnZU5hbWVDYW1lbENhc2UgPSAoKSA9PiB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGdldFBhY2thZ2VOYW1lKClcbiAgICAgIC5yZXBsYWNlKC9AL2csICcnKVxuICAgICAgLnJlcGxhY2UoL1tcXC9cXC1dL2csICdfJylcbiAgICAgIC50b1VwcGVyQ2FzZSgpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05hbWUgcHJvcGVydHkgaW4gcGFja2FnZS5qc29uIGlzIG1pc3NpbmcuJyk7XG4gIH1cbn07XG5cbmNvbnN0IGZpbGVOYW1lID0ge1xuICBlczogYCR7Z2V0UGFja2FnZU5hbWUoKX0ubWpzYCxcbiAgY2pzOiBgJHtnZXRQYWNrYWdlTmFtZSgpfS5janNgLFxuICB1bWQ6IGAke2dldFBhY2thZ2VOYW1lKCl9LnVtZC5qc2AsXG59O1xuXG5jb25zdCBmb3JtYXRzID0gT2JqZWN0LmtleXMoZmlsZU5hbWUpIGFzIEFycmF5PGtleW9mIHR5cGVvZiBmaWxlTmFtZT47XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XG4gIGJhc2U6ICcuLycsXG4gIGJ1aWxkOiB7XG4gICAgbGliOiB7XG4gICAgICBlbnRyeTogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvaW5kZXgudHMnKSxcbiAgICAgIG5hbWU6IGdldFBhY2thZ2VOYW1lQ2FtZWxDYXNlKCksXG4gICAgICBmb3JtYXRzLFxuICAgICAgZmlsZU5hbWU6IChmb3JtYXQpID0+IGZpbGVOYW1lW2Zvcm1hdF0sXG4gICAgfSxcbiAgfSxcbiAgcGx1Z2luczogW2dlbmVyYXRlTWFuaWZlc3QoKSwgZHRzKCldLFxufSkpO1xuIiwgIntcbiAgXCJuYW1lXCI6IFwiQHBhbmRpbm8vYnVuZGxlLWluc3RhbGxlci1kb21cIixcbiAgXCJ2ZXJzaW9uXCI6IFwiMC44LjMxXCIsXG4gIFwiZGVzY3JpcHRpb25cIjogXCJJbnN0YWxsIEJ1bmRsZXMgZGVmaW5lZCBpbiBhIGJyb3dzZXIncyBET01cIixcbiAgXCJtb2R1bGVcIjogXCIuL2Rpc3QvQHBhbmRpbm8vYnVuZGxlLWluc3RhbGxlci1kb20ubWpzXCIsXG4gIFwidHlwZXNcIjogXCJkaXN0L0BwYW5kaW5vL2J1bmRsZS1pbnN0YWxsZXItZG9tLmQudHNcIixcbiAgXCJ0eXBlXCI6IFwibW9kdWxlXCIsXG4gIFwiZXhwb3J0c1wiOiB7XG4gICAgXCIuXCI6IHtcbiAgICAgIFwicmVxdWlyZVwiOiBcIi4vZGlzdC9AcGFuZGluby9idW5kbGUtaW5zdGFsbGVyLWRvbS5janNcIixcbiAgICAgIFwiaW1wb3J0XCI6IFwiLi9kaXN0L0BwYW5kaW5vL2J1bmRsZS1pbnN0YWxsZXItZG9tLm1qc1wiXG4gICAgfVxuICB9LFxuICBcInNjcmlwdHNcIjoge1xuICAgIFwiYnVpbGRcIjogXCJyaW1yYWYgZGlzdCAmJiB0c2MgJiYgdml0ZSBidWlsZFwiLFxuICAgIFwidHNjXCI6IFwidHNjXCJcbiAgfSxcbiAgXCJrZXl3b3Jkc1wiOiBbXCJwYW5kaW5vXCIsIFwiYnVuZGxlXCIsIFwiaW5zdGFsbGVyXCIsIFwiZG9tXCJdLFxuICBcImF1dGhvclwiOiBcIk5vcmJlcnQgSGVyY3plZyA8bm9yYmVydC5oZXJjemVnQGJsYWNrYmVsdC5odT5cIixcbiAgXCJsaWNlbnNlXCI6IFwiRVBMLTIuMFwiLFxuICBcImhvbWVwYWdlXCI6IFwiaHR0cHM6Ly9naXRodWIuY29tL0JsYWNrQmVsdFRlY2hub2xvZ3kvcGFuZGlub1wiLFxuICBcInJlcG9zaXRvcnlcIjoge1xuICAgIFwidHlwZVwiOiBcImdpdFwiLFxuICAgIFwidXJsXCI6IFwiaHR0cHM6Ly9naXRodWIuY29tL0JsYWNrQmVsdFRlY2hub2xvZ3kvcGFuZGluby5naXRcIixcbiAgICBcImRpcmVjdG9yeVwiOiBcInBhY2thZ2VzL0BwYW5kaW5vL2J1bmRsZS1pbnN0YWxsZXItZG9tXCJcbiAgfSxcbiAgXCJidWdzXCI6IHtcbiAgICBcInVybFwiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9CbGFja0JlbHRUZWNobm9sb2d5L3BhbmRpbm8vaXNzdWVzXCJcbiAgfSxcbiAgXCJlbmdpbmVzXCI6IHtcbiAgICBcIm5vZGVcIjogXCI+PTE4XCJcbiAgfSxcbiAgXCJwdWJsaXNoQ29uZmlnXCI6IHtcbiAgICBcImFjY2Vzc1wiOiBcInB1YmxpY1wiXG4gIH0sXG4gIFwiZmlsZXNcIjogW1wiZGlzdFwiXSxcbiAgXCJkZXZEZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiQHBhbmRpbm8vcGFuZGluby1hcGlcIjogXCJ3b3Jrc3BhY2U6XlwiLFxuICAgIFwiQHBhbmRpbm8vcm9sbHVwLXBsdWdpbi1nZW5lcmF0ZS1tYW5pZmVzdFwiOiBcIndvcmtzcGFjZTpeXCIsXG4gICAgXCJyaW1yYWZcIjogXCJeNS4wLjEwXCIsXG4gICAgXCJ0eXBlc2NyaXB0XCI6IFwiXjUuNi4zXCIsXG4gICAgXCJ2aXRlXCI6IFwiXjUuNC4xMFwiLFxuICAgIFwidml0ZS1wbHVnaW4tZHRzXCI6IFwiXjQuNS40XCJcbiAgfSxcbiAgXCJwYW5kaW5vXCI6IHtcbiAgICBcIm1hbmlmZXN0XCI6IHtcbiAgICAgIFwiUHJvdmlkZS1DYXBhYmlsaXR5XCI6IFwiQHBhbmRpbm8vYnVuZGxlLWluc3RhbGxlcjt0eXBlPVxcXCJET01cXFwiXCJcbiAgICB9XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMFksU0FBUyxlQUFlO0FBQ2xhLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sU0FBUztBQUNoQixPQUFPLHNCQUFzQjs7O0FDSDdCO0FBQUEsRUFDRSxNQUFRO0FBQUEsRUFDUixTQUFXO0FBQUEsRUFDWCxhQUFlO0FBQUEsRUFDZixRQUFVO0FBQUEsRUFDVixPQUFTO0FBQUEsRUFDVCxNQUFRO0FBQUEsRUFDUixTQUFXO0FBQUEsSUFDVCxLQUFLO0FBQUEsTUFDSCxTQUFXO0FBQUEsTUFDWCxRQUFVO0FBQUEsSUFDWjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVc7QUFBQSxJQUNULE9BQVM7QUFBQSxJQUNULEtBQU87QUFBQSxFQUNUO0FBQUEsRUFDQSxVQUFZLENBQUMsV0FBVyxVQUFVLGFBQWEsS0FBSztBQUFBLEVBQ3BELFFBQVU7QUFBQSxFQUNWLFNBQVc7QUFBQSxFQUNYLFVBQVk7QUFBQSxFQUNaLFlBQWM7QUFBQSxJQUNaLE1BQVE7QUFBQSxJQUNSLEtBQU87QUFBQSxJQUNQLFdBQWE7QUFBQSxFQUNmO0FBQUEsRUFDQSxNQUFRO0FBQUEsSUFDTixLQUFPO0FBQUEsRUFDVDtBQUFBLEVBQ0EsU0FBVztBQUFBLElBQ1QsTUFBUTtBQUFBLEVBQ1Y7QUFBQSxFQUNBLGVBQWlCO0FBQUEsSUFDZixRQUFVO0FBQUEsRUFDWjtBQUFBLEVBQ0EsT0FBUyxDQUFDLE1BQU07QUFBQSxFQUNoQixpQkFBbUI7QUFBQSxJQUNqQix3QkFBd0I7QUFBQSxJQUN4Qiw0Q0FBNEM7QUFBQSxJQUM1QyxRQUFVO0FBQUEsSUFDVixZQUFjO0FBQUEsSUFDZCxNQUFRO0FBQUEsSUFDUixtQkFBbUI7QUFBQSxFQUNyQjtBQUFBLEVBQ0EsU0FBVztBQUFBLElBQ1QsVUFBWTtBQUFBLE1BQ1Ysc0JBQXNCO0FBQUEsSUFDeEI7QUFBQSxFQUNGO0FBQ0Y7OztBRGpEQSxJQUFNLG1DQUFtQztBQU96QyxJQUFNLGlCQUFpQixNQUFNO0FBQzNCLFNBQU8sZ0JBQVk7QUFDckI7QUFFQSxJQUFNLDBCQUEwQixNQUFNO0FBQ3BDLE1BQUk7QUFDRixXQUFPLGVBQWUsRUFDbkIsUUFBUSxNQUFNLEVBQUUsRUFDaEIsUUFBUSxXQUFXLEdBQUcsRUFDdEIsWUFBWTtBQUFBLEVBQ2pCLFNBQVMsS0FBSztBQUNaLFVBQU0sSUFBSSxNQUFNLDJDQUEyQztBQUFBLEVBQzdEO0FBQ0Y7QUFFQSxJQUFNLFdBQVc7QUFBQSxFQUNmLElBQUksR0FBRyxlQUFlLENBQUM7QUFBQSxFQUN2QixLQUFLLEdBQUcsZUFBZSxDQUFDO0FBQUEsRUFDeEIsS0FBSyxHQUFHLGVBQWUsQ0FBQztBQUMxQjtBQUVBLElBQU0sVUFBVSxPQUFPLEtBQUssUUFBUTtBQUVwQyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQ3pDLE1BQU07QUFBQSxFQUNOLE9BQU87QUFBQSxJQUNMLEtBQUs7QUFBQSxNQUNILE9BQU8sUUFBUSxrQ0FBVyxjQUFjO0FBQUEsTUFDeEMsTUFBTSx3QkFBd0I7QUFBQSxNQUM5QjtBQUFBLE1BQ0EsVUFBVSxDQUFDLFdBQVcsU0FBUyxNQUFNO0FBQUEsSUFDdkM7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO0FBQ3JDLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
