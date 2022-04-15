import { PokedexFeature } from 'pokedex-application-contract';
import { Details } from './Details';

export const detailsFeature: PokedexFeature = {
  route: '/pokemon/:id',
  getComponent: () => <Details />,
};
