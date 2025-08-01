import { LogLevel } from '~/services/log-service/interfaces';

/**
 * Configuration options for the OSGi bootstrap.
 */
export interface BootstrapConfig {
  /**
   * The log level for framework logs.
   * Default: LogLevel.INFO
   */
  frameworkLogLevel?: LogLevel;
}

/**
 * Default bootstrap configuration.
 */
export const DEFAULT_BOOTSTRAP_CONFIG: BootstrapConfig = {
  frameworkLogLevel: LogLevel.INFO,
};
