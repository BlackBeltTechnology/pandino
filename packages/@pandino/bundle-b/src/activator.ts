import { BundleActivator, BundleContext } from '@pandino/pandino-api';

import { LogLevel } from './log-level';
import { LoggerService } from './logger-service';

export class BundleBActivator implements BundleActivator {
  async start(context: BundleContext): Promise<void> {
    console.log('Bundle B - Activator');
    // context.registerService<LoggerService>('io.pandino.bundle-b.logger', (message: string, level?: LogLevel) => {
    //   const stamp = new Date().toISOString();
    //   switch (level) {
    //     case 'error':
    //       console.error(`[${stamp}] ${message}`);
    //       break;
    //     case 'warn':
    //       console.warn(`[${stamp}] ${message}`);
    //       break;
    //     case 'info':
    //       console.info(`[${stamp}] ${message}`);
    //       break;
    //     default:
    //       console.log(`[${stamp}] ${message}`);
    //   }
    // });
  }

  async stop(context: BundleContext): Promise<void> {
    return Promise.resolve();
  }
}
