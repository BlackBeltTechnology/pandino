declare module 'pandino:bundle:*' {
  import type { BundleModule } from '@pandino/pandino';
  // The plugin emits a module with a default export that is the bundle config object.
  // A dynamic import resolves to a namespace shaped as { default: BundleModule['default'] },
  // which is structurally compatible with BundleModule expected by PandinoProvider.
  const mod: BundleModule['default'];
  export default mod;
}
