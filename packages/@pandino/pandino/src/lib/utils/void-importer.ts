import { BundleImporter, ImporterReturns } from '@pandino/pandino-api';

/* istanbul ignore file */
export class VoidImporter implements BundleImporter {
  import(activatorLocation: string, manifestLocation: string, deploymentRoot?: string): Promise<ImporterReturns> {
    return Promise.reject(`Will not import ${activatorLocation}! Please provide an explicit Importer for Pandino!`);
  }
}
