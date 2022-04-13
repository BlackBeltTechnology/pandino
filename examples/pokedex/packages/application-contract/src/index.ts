import { ReactNode } from "react";

export interface PokedexFeature {
  route: string,
  label: string,
  className: string,
  getComponent: () => ReactNode | any,
}

export interface SettingsModel {
  maxNumberOfElements: number;
}

interface Pokemon {
  id: number,
  name: string,
  image: string,
}
