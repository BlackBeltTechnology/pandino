import { FC, useEffect, useState } from 'react';
import { ComponentProxyProps, useReactBundleContext } from '@pandino/pandino-react-dom-api';
import { ConfigurationAdmin } from '@pandino/pandino-configuration-management-api';
import { Pokemon, SettingsModel } from 'pokedex-application-contract';

function TableComponent({ pokemonList }: { pokemonList: Pokemon[] }) {
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
            <td>{pokemon.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Pokemon() {
  const [visibleList, setVisibleList] = useState<Array<Pokemon>>([]);
  const { bundleContext } = useReactBundleContext();
  const componentProxyRef = bundleContext.getServiceReference<FC<ComponentProxyProps>>(
    '@pandino/pandino-react-dom/ComponentProxy',
  );
  let ComponentProxy: FC<ComponentProxyProps> = bundleContext.getService(componentProxyRef);

  const configAdminReference = bundleContext.getServiceReference<ConfigurationAdmin>(
    '@pandino/pandino-configuration-management/ConfigurationAdmin',
  );
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
      <ComponentProxy identifier="pokedex-pokemon" defaultComponent={TableComponent} pokemonList={visibleList} />
    </div>
  );
}
