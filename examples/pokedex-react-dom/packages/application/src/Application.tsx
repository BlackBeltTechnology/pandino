import { useEffect, useState } from 'react';
import { HashRouter, Route, Routes, Link } from 'react-router-dom';
import { useReactBundleContext } from '@pandino/react-dom';
import { POKEDEX_FEATURE_INTERFACE_KEY, PokedexFeature } from 'pokedex-application-contract';

import { Dashboard } from './Dashboard';
import { Pokemon } from './Pokemon';
import { FeatureListener } from './feature-listener';

export function Application() {
  const bundleContext = useReactBundleContext();
  const additionalFeatures = bundleContext.getServiceReferences<PokedexFeature>(POKEDEX_FEATURE_INTERFACE_KEY);
  const [features, setFeatures] = useState<Array<PokedexFeature>>([
    {
      route: '/',
      label: 'Dashboard',
      className: 'fa fa-home',
      getComponent: () => <Dashboard />,
    },
    {
      route: '/pokemon',
      label: 'Pokémon',
      className: 'fa fa-paw',
      getComponent: () => <Pokemon />,
    },
    ...additionalFeatures.map((r) => bundleContext.getService(r)),
  ]);

  useEffect(() => {
    const featureListener = new FeatureListener(bundleContext, features, setFeatures);
    bundleContext.addServiceListener(featureListener, `(objectClass=${POKEDEX_FEATURE_INTERFACE_KEY})`);

    return () => {
      bundleContext.removeServiceListener(featureListener);
    };
  });

  return (
    <HashRouter>
      <header className="navbar navbar-dark sticky-top bg-dark flex-md-nowrap p-0 shadow">
        <a className="navbar-brand col-md-3 col-lg-2 me-0 px-3" href="#">
          Pokédex
        </a>
        <button
          className="navbar-toggler position-absolute d-md-none collapsed"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#sidebarMenu"
          aria-controls="sidebarMenu"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
      </header>
      <div className="container-fluid">
        <div className="row">
          <nav id="sidebarMenu" className="col-md-3 col-lg-2 d-md-block bg-light sidebar collapse">
            <div className="position-sticky pt-3">
              <ul className="nav flex-column">
                {features
                  .filter((f) => !!f.label)
                  .map((route) => (
                    <li key={route.route} className="nav-item">
                      <Link to={route.route} className="nav-link">
                        <i className={route.className} /> {route.label}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          </nav>

          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
            <Routes>
              {features.map((route) => (
                <Route key={route.route} path={route.route} element={route.getComponent()} />
              ))}
            </Routes>
          </main>
        </div>
      </div>
    </HashRouter>
  );
}
