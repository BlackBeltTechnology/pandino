export class ParsedHeaderClause {
  public readonly paths: Array<string>;
  public readonly dirs: Record<string, string>;
  public readonly attrs: Record<string, any>;
  public readonly types: Record<string, string>;

  constructor(
    paths: Array<string>,
    dirs: Record<string, string>,
    attrs: Record<string, any>,
    types: Record<string, string>,
  ) {
    this.paths = paths;
    this.dirs = dirs;
    this.attrs = attrs;
    this.types = types;
  }
}
