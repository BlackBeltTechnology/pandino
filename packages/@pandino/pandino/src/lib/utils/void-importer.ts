import { Importer, ImporterReturns } from '@pandino/pandino-api';

/* istanbul ignore file */
export class VoidImporter implements Importer {
  import(activator: string): Promise<ImporterReturns> {
    return Promise.reject(`Will not import ${activator}! Please provide explicit Importer for Pandino!`);
  }
}
