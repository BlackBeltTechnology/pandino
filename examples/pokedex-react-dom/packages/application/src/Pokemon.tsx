import { FC, useEffect, useState } from 'react';
import { useReactBundleContext } from '@pandino/pandino-react-dom';
import {
  ComponentProxyProps,
  COMPONENT_PROXY_INTERFACE_KEY,
} from '@pandino/pandino-react-dom-api';
import { CONFIG_ADMIN_INTERFACE_KEY, ConfigurationAdmin } from '@pandino/pandino-configuration-management-api';
import { Pokemon, SettingsModel } from 'pokedex-application-contract';
import { Link } from 'react-router-dom';

function TableComponent({ pokemonList, detailsSupported }: { pokemonList: Pokemon[]; detailsSupported: boolean }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th scope="col">Image</th>
          <th scope="col">Name</th>
        </tr>
      </thead>
      <tbody>
        {pokemonList.map((pokemon, idx) => (
          <tr key={pokemon.name}>
            <td>
              <img
                style={{
                  maxHeight: 60,
                }}
                src={`https://raw.githubusercontent.com/jherr/pokemon/main/images/${pokemon.name.toLowerCase()}.jpg`}
                alt={pokemon.name}
              />
            </td>
            <td>{detailsSupported ? <Link to={`${pokemon.id}`}>{pokemon.name}</Link> : pokemon.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Pokemon() {
  const [visibleList, setVisibleList] = useState<Array<Pokemon>>([]);
  const bundleContext = useReactBundleContext();
  const componentProxyRef = bundleContext.getServiceReference<FC<ComponentProxyProps>>(COMPONENT_PROXY_INTERFACE_KEY);
  let ComponentProxy: FC<ComponentProxyProps> = bundleContext.getService(componentProxyRef);

  const detailsReferences = bundleContext.getServiceReferences('@pokedex/feature', '(name=feature-details)');
  const configAdminReference = bundleContext.getServiceReference<ConfigurationAdmin>(CONFIG_ADMIN_INTERFACE_KEY);
  const configAdmin = configAdminReference
    ? bundleContext.getService<ConfigurationAdmin>(configAdminReference)
    : undefined;

  useEffect(() => {
    (async () => {
      const res = await fetch('https://raw.githubusercontent.com/jherr/pokemon/main/index.json');
      const json = await res.json();
      const config = configAdmin?.getConfiguration('pokedex.settings');
      const configProps = config?.getProperties() as SettingsModel;
      setVisibleList(json.slice(0, configProps ? configProps.maxNumberOfElements : 10));
    })();

    return () => {
      if (componentProxyRef) {
        bundleContext.ungetService(componentProxyRef);
      }
      if (detailsReferences.length) {
        detailsReferences.forEach((ref) => bundleContext.ungetService(ref));
      }
      if (configAdminReference) {
        bundleContext.ungetService(configAdminReference);
      }
    };
  }, []);

  return (
    <div className="pokemon">
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 className="h2">Pokémon</h1>
      </div>
      <ComponentProxy
        bundleContext={bundleContext}
        identifier="pokedex-pokemon"
        defaultComponent={TableComponent}
        pokemonList={visibleList}
        detailsSupported={detailsReferences.length}
      />
    </div>
  );
}
