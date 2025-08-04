import { Component } from '@pandino/decorators';

export const formatters = {
  formatTimestamp: (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  },

  formatLevel: (level: string): string => {
    switch (level.toLowerCase()) {
      case 'info':
        return '\x1b[32mINFO\x1b[0m'; // Green
      case 'warn':
        return '\x1b[33mWARN\x1b[0m'; // Yellow
      case 'error':
        return '\x1b[31mERROR\x1b[0m'; // Red
      default:
        return level.toUpperCase();
    }
  },

  formatLogEntry: (entry: { level: string; message: string; timestamp: number }): string => {
    const formattedTimestamp = formatters.formatTimestamp(entry.timestamp);
    const formattedLevel = formatters.formatLevel(entry.level);
    return `[${formattedTimestamp}] [${formattedLevel}] ${entry.message}`;
  },
};

@Component({
  name: 'LoggerFormatters',
})
export class LoggerFormatters {
  // The class can be empty as it's just a component definition
}

export default {
  headers: {
    bundleSymbolicName: '@example/logger-formatter',
    bundleVersion: '1.0.0',
    bundleName: 'Logger Formatter Fragment',
    // Specify the host bundle this fragment attaches to
    fragmentHost: '@example/logger',
  },
  // Components will be merged with the host's components
  components: [LoggerFormatters],
  // Additional properties should be placed directly under the default export
  formatters,
};
