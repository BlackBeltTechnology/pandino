import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { pandinoExternalizeReact } from '@pandino/rollup-plugin-react-externalize';
import { readFileSync } from "fs";

const packageJSON = JSON.parse(readFileSync('package.json').toString('utf8'));

const exportPackage = '@pandino/react-router-dom/react-router-dom';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/esm/react-router-dom.mjs',
      format: 'esm',
    }
  ],
  plugins: [
    nodeResolve(),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' }),
    pandinoExternalizeReact({
      mockProcess: {
        env: {
          NODE_ENV: 'production'
        },
      },
      prettify: true,
      minify: true,
      externalRefs: [
        { token: 'Fragment',                      identifier: '@pandino/react-dom/react/jsx-runtime/Fragment' },
      ],
      componentsMap: [
        { component: 'BrowserRouter',             identifier: `${exportPackage}/BrowserRoute` },
        { component: 'HashRouter',                identifier: `${exportPackage}/HashRouter` },
        { component: 'Routes',                    identifier: `${exportPackage}/Routes` },
        { component: 'Route',                     identifier: `${exportPackage}/Route` },
        { component: 'Link',                      identifier: `${exportPackage}/Link` },
        { component: 'NavLink',                   identifier: `${exportPackage}/NavLink` },
        { component: 'Outlet',                    identifier: `${exportPackage}/Outlet` },
        { component: 'useHref',                   identifier: `${exportPackage}/useHref` },
        { component: 'useLocation',               identifier: `${exportPackage}/useLocation` },
        { component: 'useNavigate',               identifier: `${exportPackage}/useNavigate` },
        { component: 'useResolvedPath',           identifier: `${exportPackage}/useResolvedPath` },
        { component: 'useRoutes',                 identifier: `${exportPackage}/useRoutes` },
        { component: 'useParams',                 identifier: `${exportPackage}/useParams` },
        { component: 'matchPath',                 identifier: `${exportPackage}/matchPath` },
        { component: 'matchRoutes',               identifier: `${exportPackage}/matchRoutes` },
        { component: 'createRoutesFromChildren',  identifier: `${exportPackage}/createRoutesFromChildren` },
        { component: 'resolvePath',               identifier: `${exportPackage}/resolvePath` },
      ],
      manifestData: {
        "Bundle-ManifestVersion": "1",
        "Bundle-SymbolicName": packageJSON.name,
        "Bundle-Name": "React Router DOM",
        "Bundle-Version": packageJSON.version,
        "Bundle-Description": packageJSON.description,
        "Bundle-Activator": "./react-router-dom.mjs",
        "Require-Capability": [
          "@pandino/react-dom;filter:=(type=DOM)",
        ],
        "Provide-Capability": "@pandino/react-router-dom;type=\"DOM\""
      },
    }),
  ],
};
