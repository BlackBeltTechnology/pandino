/// <reference types="vite/client" />

// Declare the global constants that Vite will inject.
// This informs TypeScript that these variables exist globally.
interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_REQUIRE_CAPABILITY: string;
  readonly VITE_PROVIDE_CAPABILITY: string;
}

