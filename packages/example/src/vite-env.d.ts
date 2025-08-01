/// <reference types="vite/client" />

declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.SFC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly VITE_BUNDLE_SYMBOLIC_NAME: string;
  readonly VITE_BUNDLE_VERSION: string;
  readonly VITE_BUNDLE_DESCRIPTION: string;
  // Add other env variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
