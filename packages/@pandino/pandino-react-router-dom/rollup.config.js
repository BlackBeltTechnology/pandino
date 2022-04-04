import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import excludeDependenciesFromBundle from "rollup-plugin-exclude-dependencies-from-bundle";
import commonjs from '@rollup/plugin-commonjs';
import { pandinoExternalizeReact } from './rollup/index';
import { readFileSync } from "fs";

const packageJSON = JSON.parse(readFileSync('package.json').toString('utf8'));

const exportPackage = '@pandino/pandino-react-router-dom/react-router-dom';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/esm/pandino-react-router-dom.mjs',
      format: 'esm',
    }
  ],
  plugins: [
    nodeResolve(),
    commonjs(),
    excludeDependenciesFromBundle({
      peerDependencies: true,
    }),
    typescript({ tsconfig: './tsconfig.json' }),
    pandinoExternalizeReact({
      mockProcess: {
        env: {
          NODE_ENV: 'production'
        },
      },
      prettify: true,
      minify: true,
      externalRefsMap: [
        { token: 'isValidElement',                identifier: '@pandino/pandino-react-dom/react/isValidElement' },
        { token: 'createElement',                 identifier: '@pandino/pandino-react-dom/react/createElement' },
        { token: 'forwardRef',                    identifier: '@pandino/pandino-react-dom/react/forwardRef' },
        { token: 'useContext',                    identifier: '@pandino/pandino-react-dom/react/useContext' },
        { token: 'useMemo',                       identifier: '@pandino/pandino-react-dom/react/useMemo' },
        { token: 'useCallback',                   identifier: '@pandino/pandino-react-dom/react/useCallback' },
        { token: 'useLayoutEffect',               identifier: '@pandino/pandino-react-dom/react/useLayoutEffect' },
        { token: 'useEffect',                     identifier: '@pandino/pandino-react-dom/react/useEffect' },
        { token: 'useRef',                        identifier: '@pandino/pandino-react-dom/react/useRef' },
        { token: 'useState',                      identifier: '@pandino/pandino-react-dom/react/useState' },
        { token: 'createContext',                 identifier: '@pandino/pandino-react-dom/react/createContext' },
        { token: 'Children',                      identifier: '@pandino/pandino-react-dom/react/Children' },
        { token: 'Fragment',                      identifier: '@pandino/pandino-react-dom/react/jsx-runtime/Fragment' },
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
        "Bundle-Activator": "./pandino-react-router-dom.mjs",
        "Require-Capability": [
          "@pandino/pandino-react-dom;filter:=\"(type=dom)\"",
        ],
        "Provide-Capability": "@pandino/pandino-react-router-dom;type=\"dom\""
      },
    }),
  ],
};
