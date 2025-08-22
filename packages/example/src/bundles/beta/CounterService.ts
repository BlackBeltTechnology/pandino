import { Component, Activate, Deactivate, Service } from '@pandino/decorators';
import { Reference } from '@pandino/decorators';
import type { LogService } from '@pandino/pandino';

@Component({ immediate: true })
@Service({ interfaces: ['CounterService'] })
export class CounterService {
  private count = 0;

  @Reference({ interface: 'LogService', cardinality: '1..1' })
  private logger!: LogService;

  @Activate
  onStart() {
    this.count = 0;
    this.logger.info('CounterService activated');
  }

  @Deactivate
  onStop() {
    this.logger.info(`CounterService deactivated at ${this.count}`);
  }

  increment() {
    this.count += 1;
    return this.count;
  }

  decrement() {
    this.count -= 1;
    return this.count;
  }

  getCount() {
    return this.count;
  }
}
