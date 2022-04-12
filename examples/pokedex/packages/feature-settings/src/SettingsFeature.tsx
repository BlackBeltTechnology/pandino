import {PokedexFeature} from "pokedex-application-contract";
import {Settings} from "./Settings";

export const settingsFeature: PokedexFeature = {
    route: '/settings',
    label: 'Settings',
    className: 'fa fa-bath',
    getComponent: () => <Settings />,
};
