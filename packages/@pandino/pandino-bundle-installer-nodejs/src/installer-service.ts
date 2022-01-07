import { BundleInstaller } from '@pandino/pandino-bundle-installer-api';
import { Bundle, BundleContext, Logger } from '@pandino/pandino-api';
import { FSWatcher } from 'chokidar';
import { InstallerServiceApi } from './installer-service-api';

export class InstallerService implements InstallerServiceApi, BundleInstaller {
  private watcher: FSWatcher;
  private pathAndBundlePairs: Map<string, Bundle> = new Map<string, Bundle>();

  constructor(
    private readonly deploymentRoot: string,
    private readonly context: BundleContext,
    private readonly logger: Logger,
  ) {}

  async install(path: string): Promise<void> {
    this.logger.info(`Detected addition of new Bundle Manifest at: ${path}, processing...`);
    const bundle = await this.context.installBundle(path);
    this.pathAndBundlePairs.set(path, bundle);
  }

  async uninstall(path: string): Promise<void> {
    this.logger.warn(
      `Bundle Manifest at: ${path} has been removed, but uninstall is not yet supported, Bundle lifecycle change not triggered!`,
    );
    this.pathAndBundlePairs.delete(path);
  }

  async update(path: string): Promise<void> {
    this.logger.info(`Detected change of Bundle Manifest at: ${path}, processing...`);
    const bundle = await this.context.installBundle(path);
    this.pathAndBundlePairs.set(path, bundle);
  }

  async watch(watcher: FSWatcher): Promise<void> {
    this.watcher = watcher;
    this.watcher
      .on('add', this.install.bind(this))
      .on('change', this.update.bind(this))
      .on('unlink', this.uninstall.bind(this));
  }

  async stopWatch(): Promise<void> {
    if (!!this.watcher) {
      try {
        await this.watcher.close();
        this.watcher = undefined;
        this.pathAndBundlePairs.clear();
        this.logger.info(`Stopped watching.`);
      } catch (err) {
        this.logger.error(err);
      }
    }
  }
}
