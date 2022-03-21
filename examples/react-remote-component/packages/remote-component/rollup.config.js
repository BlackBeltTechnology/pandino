import typescript from '@rollup/plugin-typescript';
import { pandinoExternalizeReact } from './rollup/pandino-externalize-react';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/remote-component.mjs',
      format: 'esm',
    }
  ],
  external: [
    'react/jsx-runtime'
  ],
  plugins: [
    typescript({ tsconfig: './tsconfig.json' }),
    pandinoExternalizeReact({
      minify: false,
      externalRefsMap: [
        { token: 'jsxs',      identifier: '@pandino/react-provider/react/jsx-runtime/jsxs' },
        { token: 'Fragment',  identifier: '@pandino/react-provider/react/jsx-runtime/Fragment' },
        { token: 'jsx',       identifier: '@pandino/react-provider/react/jsx-runtime/jsx' },
        { token: 'useState',  identifier: '@pandino/react-provider/react/useState' },
        { token: 'Component',  identifier: '@pandino/react-provider/react/Component' },
      ],
      componentsMap: [
        {
          component: 'RemoteComponent',
          identifier: '@example/react-remote-component/remote-component/RemoteComponent',
          props: {
            'service.ranking': 90,
          },
        },
        {
          component: 'OtherComponent',
          identifier: '@example/react-remote-component/remote-component/OtherComponent',
          props: {
            'service.ranking': 90,
          },
        },
      ],
    }),
  ],
};
