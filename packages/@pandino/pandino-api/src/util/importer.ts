export interface ImporterReturns {
  default: any;
  [key: string | symbol | number]: any;
}

export type Importer = (activator: string) => Promise<ImporterReturns>;
