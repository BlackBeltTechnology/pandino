import { Activator } from './Activator';
import type { InstallSelf } from '@pandino/pandino-api';

const installSelf: InstallSelf = (ctx) => {
  ctx.installBundle({
    'Bundle-SymbolicName': import.meta.env.VITE_APP_NAME,
    'Bundle-Version': import.meta.env.VITE_APP_VERSION,
    'Bundle-Activator': new Activator(),
    'Require-Capability': import.meta.env.VITE_REQUIRE_CAPABILITY,
    'Provide-Capability': import.meta.env.VITE_PROVIDE_CAPABILITY,
  });
}

export {
  Activator as default,
  installSelf,
}
