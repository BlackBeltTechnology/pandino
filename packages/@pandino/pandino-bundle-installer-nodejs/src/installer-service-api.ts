import { FSWatcher } from 'chokidar';

export const INSTALLER_SERVICE_PROP = '@pandino/pandino-bundle-installer-nodejs/installer-service';

export interface InstallerServiceApi {
  watch(watcher: FSWatcher): Promise<void>;
  stopWatch(): Promise<void>;
}
