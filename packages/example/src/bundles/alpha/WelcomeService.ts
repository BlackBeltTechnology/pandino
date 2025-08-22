import { Component, Activate, Deactivate, Service } from '@pandino/decorators';
import { Reference } from '@pandino/decorators';
import type { LogService } from '@pandino/pandino';

// A tiny service component discovered by the rollup-bundle-plugin
// It doesn't render UI directly, but demonstrates lifecycle hooks.
@Component({ immediate: true })
@Service({ interfaces: ['WelcomeService'] })
export class WelcomeService {
  @Reference({ interface: 'LogService', cardinality: '1..1' })
  private logger!: LogService;

  @Activate
  activate() {
    // Keep logs minimal; they help demonstrate lifecycle
    this.logger.info('WelcomeService activated');
  }

  @Deactivate
  deactivate() {
    this.logger.info('WelcomeService deactivated');
  }

  sayHello(name: string) {
    return `Hello, ${name}!`;
  }
}
