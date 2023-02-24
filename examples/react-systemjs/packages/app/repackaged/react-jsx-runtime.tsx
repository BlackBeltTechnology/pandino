import * as jsxRuntime from 'react/jsx-runtime';

const runtime = jsxRuntime as any;

export const jsxs = runtime.jsxs;
export const jsx = runtime.jsx;
export const Fragment = runtime.Fragment;

// default export for sub-optimally written third party libraries which import with `* as`...
export default {
  jsx,
  jsxs,
  Fragment,
};
