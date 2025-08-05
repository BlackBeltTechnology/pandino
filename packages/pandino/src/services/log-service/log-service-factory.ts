import type { Bundle } from '~/framework/interfaces';
import { BundleAwareLogService } from './bundle-aware-log-service';
import { ConsoleLogService } from './console-log-service';
import { ConsoleLogServiceFactory } from './console-log-service-factory';
import type { LogService, LogServiceFactory } from './interfaces';

export class DefaultLogServiceFactory implements LogServiceFactory {
  createLogService(): LogService {
    // For backward compatibility, return a ConsoleLogService instance
    // In the framework, this should be registered using ConsoleLogServiceFactory
    return new ConsoleLogService();
  }
  createBundleAwareLogService(bundle: Bundle): LogService {
    const baseLogService = new ConsoleLogService();
    return new BundleAwareLogService(baseLogService, bundle);
  }
  createLogServiceFactory(): ConsoleLogServiceFactory {
    return new ConsoleLogServiceFactory();
  }
}
