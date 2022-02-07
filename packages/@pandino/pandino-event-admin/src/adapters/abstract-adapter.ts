import { EventAdmin } from '@pandino/pandino-event-api';
import { BundleContext } from '@pandino/pandino-api';

export abstract class AbstractAdapter {
  private readonly admin: EventAdmin;

  protected constructor(admin: EventAdmin) {
    this.admin = admin;
  }

  protected getEventAdmin(): EventAdmin {
    return this.admin;
  }

  abstract destroy(bundleContext: BundleContext): void;
}
