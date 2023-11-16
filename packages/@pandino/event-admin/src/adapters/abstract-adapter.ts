import type { EventAdmin } from '@pandino/event-api';
import type { BundleContext } from '@pandino/pandino-api';

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
