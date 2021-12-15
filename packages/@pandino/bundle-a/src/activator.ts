import { BundleActivator, BundleContext } from '@pandino/pandino-api';
import { LoggerService } from '@pandino/bundle-b';

import { TestService, TestServiceImpl } from './test-service';

export class BundleAActivator implements BundleActivator {
  // private fetch: FetchType;
  private logger: LoggerService;
  private testService: TestService = new TestServiceImpl();

  async start(context: BundleContext): Promise<void> {
    console.log('Bundle A - Activator');
    // context.registerService<TestService>('io.pandino.bundle-a.service', this.testService);
    //
    // this.logger = await context.waitForService<LoggerService>('io.pandino.bundle-b.logger');
    // this.fetch = await context.waitForService<FetchType>('window.fetch');
    //
    // this.logger(this.testService.test('TEST'));
    //
    // this.testFetch();
    //
    // context.registerServiceListener((event) => {
    //   if (event.getType() === 'UPGRADED' && event.getRegistry().getSymbol() === 'window.fetch') {
    //     this.fetch = event.getRegistry().getReference();
    //     this.logger('fetch() has been upgraded! :O', 'warn');
    //     this.testFetch();
    //   }
    // });
    return Promise.resolve();
  }

  stop(context: BundleContext): Promise<void> {
    return Promise.resolve();
  }

  // testFetch() {
  //   this.fetch('https://reqres.in/api/users/2')
  //     .then((res) => res.json())
  //     .then((res) => this.logger(JSON.stringify(res.data, null, 4)));
  // }
}
