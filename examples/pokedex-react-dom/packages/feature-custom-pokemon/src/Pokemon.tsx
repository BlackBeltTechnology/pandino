import { useEffect, useState } from 'react';
import { useReactBundleContext } from '@pandino/pandino-react-dom';
import { CONFIG_ADMIN_INTERFACE_KEY, ConfigurationAdmin } from '@pandino/pandino-configuration-management-api';
import { Pokemon, SettingsModel } from 'pokedex-application-contract';
import { Link } from 'react-router-dom';
import { POKEDEX_FEATURE_INTERFACE_KEY } from 'pokedex-application-contract';

export function CustomPokemon() {
  const [visibleList, setVisibleList] = useState<Array<Pokemon>>([]);
  const bundleContext = useReactBundleContext();

  const detailsReferences = bundleContext.getServiceReferences(POKEDEX_FEATURE_INTERFACE_KEY, '(name=feature-details)');
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
      if (configAdminReference) {
        bundleContext.ungetService(configAdminReference);
      }
      if (detailsReferences.length) {
        detailsReferences.forEach((ref) => bundleContext.ungetService(ref));
      }
    };
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
          {detailsReferences.length ? (
            <Link to={`${pokemon.id}`}>
              <img
                style={{
                  maxHeight: '200px',
                  border: '3px solid red',
                }}
                src={`https://raw.githubusercontent.com/jherr/pokemon/main/images/${pokemon.name.toLowerCase()}.jpg`}
                alt={pokemon.name}
              />
            </Link>
          ) : (
            <img
              style={{
                maxHeight: '200px',
              }}
              src={`https://raw.githubusercontent.com/jherr/pokemon/main/images/${pokemon.name.toLowerCase()}.jpg`}
              alt={pokemon.name}
            />
          )}
        </div>
      ))}
    </div>
  );
}
