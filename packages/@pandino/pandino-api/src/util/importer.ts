export interface ImporterReturns {
  default: any;
  [key: string | symbol | number]: any;
}

export interface Importer {
  import(activator: string): Promise<ImporterReturns>;
}
