import { BundleContext, ServiceEvent, ServiceListener } from '@pandino/pandino-api';
import { PokedexFeature } from 'pokedex-application-contract';

export class FeatureListener implements ServiceListener {
  constructor(
    private context: BundleContext | undefined,
    private features: Array<PokedexFeature> = [],
    private setFeatures: Function | undefined,
  ) {}

  serviceChanged(event: ServiceEvent): void {
    const ref = event.getServiceReference();
    const feature: PokedexFeature = this.context!.getService(ref);

    if (['REGISTERED'].includes(event.getType())) {
      this.setFeatures!([...this.features, feature]);
    } else if (event.getType() === 'UNREGISTERING') {
      const newFeatures = [...this.features];
      newFeatures.splice(
        this.features.findIndex((r) => r.route === feature.route),
        1,
      );

      this.setFeatures!([...newFeatures]);
    }
  }
}
