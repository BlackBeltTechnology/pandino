import { FSWatcher } from 'chokidar';

export interface InstallerServiceApi {
  watch(watcher: FSWatcher): Promise<void>;
  stopWatch(): Promise<void>;
}
