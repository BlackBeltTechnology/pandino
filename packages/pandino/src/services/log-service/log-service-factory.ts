import type { Bundle } from '~/framework/interfaces';
import { BundleAwareLogService } from './bundle-aware-log-service';
import { ConsoleLogService } from './console-log-service';
import type { LogService, LogServiceFactory } from './interfaces';

export class DefaultLogServiceFactory implements LogServiceFactory {
  createLogService(): LogService {
    return new ConsoleLogService();
  }

  createBundleAwareLogService(bundle: Bundle): LogService {
    const baseLogService = new ConsoleLogService();
    return new BundleAwareLogService(baseLogService, bundle);
  }
}
