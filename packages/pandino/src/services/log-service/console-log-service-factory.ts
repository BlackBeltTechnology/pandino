import type { Bundle, ServiceFactory, ServiceRegistration } from '../../framework/interfaces';
import { ConsoleLogService } from './console-log-service';
import type { LogService } from './interfaces';

export class ConsoleLogServiceFactory implements ServiceFactory<LogService> {
  getService(bundle: Bundle, _registration: ServiceRegistration<LogService>): LogService {
    const logService = new ConsoleLogService();

    // Store the bundle information in the service instance
    (logService as any).__bundle = {
      id: bundle.getBundleId(),
      symbolicName: bundle.getSymbolicName(),
      version: bundle.getVersion(),
      location: bundle.getLocation(),
    };

    return logService;
  }

  ungetService(_bundle: Bundle, _registration: ServiceRegistration<LogService>, _service: LogService): void {
    // No cleanup needed for ConsoleLogService instances
  }
}
