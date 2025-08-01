/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PANDINO_VERSION: string;
  readonly VITE_PANDINO_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
