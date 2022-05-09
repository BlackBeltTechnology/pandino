import { Bundle, BundleContext, Logger } from '@pandino/pandino-api';
import { FSWatcher, watch, WatchEventType, readdirSync } from 'fs';

export class InstallerService {
  private pathAndBundlePairs: Map<string, Bundle> = new Map<string, Bundle>();
  private processing: string[] = [];
  private watcher: FSWatcher;

  constructor(
    private readonly deploymentRoot: string,
    private readonly context: BundleContext,
    private readonly logger: Logger,
  ) {}

  async install(path: string): Promise<void> {
    if (!this.processing.includes(path) && !this.pathAndBundlePairs.has(path)) {
      this.processing.push(path);
      this.logger.info(`Detected addition of new Bundle Manifest at: ${path}, processing...`);
      try {
        const bundle = await this.context.installBundle(path);
        this.pathAndBundlePairs.set(path, bundle);
      } finally {
        this.processing.splice(
          this.processing.findIndex((p) => p === path),
          1,
        );
      }
    }
  }

  async uninstall(path: string): Promise<void> {
    if (!this.processing.includes(path) && this.pathAndBundlePairs.has(path)) {
      this.processing.push(path);
      this.logger.info(`Detected removal of Bundle Manifest at: ${path}, processing...`);
      const bundle = this.pathAndBundlePairs.get(path);
      try {
        await bundle.uninstall();
        this.pathAndBundlePairs.delete(path);
      } finally {
        this.processing.splice(
          this.processing.findIndex((p) => p === path),
          1,
        );
      }
    }
  }

  watch(): void {
    this.logger.info(`Started watching: ${this.deploymentRoot}.`);
    for (const manifest of this.listAllManifests()) {
      this.install(manifest);
    }
    this.watcher = watch(
      this.deploymentRoot,
      {
        encoding: 'utf8',
        recursive: false,
      },
      (eventType: WatchEventType, filename: string) => {
        if (filename.endsWith('-manifest.json') && !this.processing.includes(filename)) {
          if (eventType === 'change' && !this.pathAndBundlePairs.has(filename)) {
            this.install(filename); // not awaiting on purpose
          } else if (eventType === 'rename' && this.pathAndBundlePairs.has(filename)) {
            this.uninstall(filename); // not awaiting on purpose
          }
        }
      },
    );
  }

  stopWatch(): void {
    if (!!this.watcher) {
      try {
        this.watcher.close();
        this.watcher = undefined;
        this.pathAndBundlePairs.clear();
        this.logger.info(`Stopped watching.`);
      } catch (err) {
        this.logger.error(err);
      }
    }
  }

  private listAllManifests(): Array<string> {
    const dirEntries = readdirSync(this.deploymentRoot, { withFileTypes: true });
    return dirEntries.filter((de) => de.isFile() && de.name.endsWith('-manifest.json')).map((de) => de.name);
  }
}
