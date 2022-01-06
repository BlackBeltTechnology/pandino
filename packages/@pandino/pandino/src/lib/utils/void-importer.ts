import { BundleImporter, ImporterReturns } from '@pandino/pandino-api';

/* istanbul ignore file */
export class VoidImporter implements BundleImporter {
  import(deploymentRoot: string, activatorLocation: string, manifestLocation: string): Promise<ImporterReturns> {
    return Promise.reject(`Will not import ${activatorLocation}! Please provide explicit Importer for Pandino!`);
  }
}
