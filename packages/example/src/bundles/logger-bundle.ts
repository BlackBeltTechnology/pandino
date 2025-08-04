import type { BundleActivator, BundleContext, ServiceRegistration } from '@pandino/pandino';

export interface LoggerService {
  debug(message: string, data?: unknown): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  getLogs(): Array<{ level: string; message: string; timestamp: number }>;
}

// Use a global variable to ensure logs are shared across all instances
const globalLogs: Array<{ level: string; message: string; timestamp: number }> = [];

class FrameworkLoggerService implements LoggerService {
  // Use the global logs array instead of a private instance variable
  private readonly frameworkLogger: any;

  constructor(context: BundleContext) {
    this.frameworkLogger = context.getLogService();
  }

  debug(message: string, data?: unknown): void {
    if (this.frameworkLogger) {
      this.frameworkLogger.debug(message, undefined, data);
    }

    const logEntry = {
      level: 'info',
      message,
      timestamp: Date.now(),
    };

    globalLogs.push(logEntry);
  }

  info(message: string): void {
    if (this.frameworkLogger) {
      this.frameworkLogger.info(message);
    }

    const logEntry = {
      level: 'info',
      message,
      timestamp: Date.now(),
    };

    globalLogs.push(logEntry);
  }

  warn(message: string): void {
    if (this.frameworkLogger) {
      this.frameworkLogger.warn(message);
    }

    const logEntry = {
      level: 'warn',
      message,
      timestamp: Date.now(),
    };

    globalLogs.push(logEntry);
  }

  error(message: string): void {
    if (this.frameworkLogger) {
      this.frameworkLogger.error(message);
    }

    const logEntry = {
      level: 'error',
      message,
      timestamp: Date.now(),
    };

    globalLogs.push(logEntry);
  }

  getLogs(): Array<{ level: string; message: string; timestamp: number }> {
    if (this.frameworkLogger) {
      this.frameworkLogger.debug('Current global logs:', undefined, { logs: globalLogs });
    }
    return [...globalLogs];
  }
}

/**
 * Bundle activator for the logger service bundle
 * This demonstrates a simple bundle lifecycle
 */
class LoggerBundleActivator implements BundleActivator {
  private serviceRegistration: ServiceRegistration<LoggerService> | null = null;
  private loggerService: FrameworkLoggerService | null = null;
  private frameworkLogger: any = null;

  async start(context: BundleContext): Promise<void> {
    // Get the framework logger
    this.frameworkLogger = context.getLogService();

    if (this.frameworkLogger) {
      this.frameworkLogger.info('Starting Logger Bundle');
    }

    // Clear any existing logs to start fresh
    while (globalLogs.length > 0) {
      globalLogs.pop();
    }

    this.loggerService = new FrameworkLoggerService(context);

    this.serviceRegistration = context.registerService<LoggerService>('LoggerService', this.loggerService, {
      'service.description': 'Framework logger service',
      'service.vendor': 'Pandino Showcase',
    });

    this.loggerService.info(`Logger Bundle (ID: ${context.getBundle().getBundleId()}) started`);

    if (this.frameworkLogger) {
      this.frameworkLogger.info('Logger Bundle started');
    }
  }

  async stop(context: BundleContext): Promise<void> {
    if (this.frameworkLogger) {
      this.frameworkLogger.info('Stopping Logger Bundle');
    }

    if (this.loggerService) {
      this.loggerService.info(`Logger Bundle (ID: ${context.getBundle().getBundleId()}) stopping`);
    }

    if (this.serviceRegistration) {
      this.serviceRegistration.unregister();
      this.serviceRegistration = null;
    }

    if (this.frameworkLogger) {
      this.frameworkLogger.info('Logger Bundle stopped');
    }
  }
}

export default {
  headers: {
    bundleSymbolicName: '@example/logger',
    bundleVersion: '1.0.0',
    bundleName: 'Logger Bundle',
  },
  activator: new LoggerBundleActivator(),
};
