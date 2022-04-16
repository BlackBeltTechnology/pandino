import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface DetailsPayload {
  name: string;
  type: string[];
  stats: Array<{ name: string; value: number }>;
  image: string;
}

export function Details() {
  const params = useParams();
  const [pokemon, setPokemon] = useState<DetailsPayload | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const res = await fetch(`https://raw.githubusercontent.com/jherr/pokemon/main/pokemon/${params.id}.json`);
      setPokemon(await res.json());
    })();
  }, []);

  return (
    <>
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 className="h2">{pokemon?.name}</h1>
      </div>
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <div>
          <img
            style={{
              maxHeight: '200px',
            }}
            src={`https://raw.githubusercontent.com/jherr/pokemon/main/${pokemon?.image}`}
            alt={pokemon?.name}
          />
        </div>
        <ul>
          {pokemon?.stats.map((stat) => (
            <li key={stat.name}>
              {stat.name}: {stat.value}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
