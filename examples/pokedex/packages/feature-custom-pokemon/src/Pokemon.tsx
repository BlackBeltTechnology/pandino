import { useEffect, useState } from 'react';
import { useReactBundleContext } from '@pandino/pandino-react-dom-api';
import { ConfigurationAdmin } from '@pandino/pandino-configuration-management-api';
import { Pokemon, SettingsModel } from 'pokedex-application-contract';

export function CustomPokemon() {
  const [visibleList, setVisibleList] = useState<Array<Pokemon>>([]);
  const { bundleContext } = useReactBundleContext();

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
  }, []);

  return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
        }}
      >
        {visibleList.map((pokemon, idx) => (
          <div
            key={pokemon.name}
            style={{
              flex: '1 0 21%',
              margin: '5px',
              height: '200px',
            }}
          >
            <img
              style={{
                  maxHeight: '200px',
              }}
              src={`https://raw.githubusercontent.com/jherr/pokemon/main/images/${pokemon.name.toLowerCase()}.jpg`}
              alt={pokemon.name}
            />
          </div>
        ))}
      </div>
  );
}
