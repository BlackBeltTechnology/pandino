import { Activate, Component, Deactivate, Modified, Reference } from '../decorators';
import { SERVICE_RANKING } from '@pandino/pandino-api';

export const DOES_STUFF_INTERFACE_KEY = '@test/DoesStuff';

export interface DoesStuff {
  doesStuff(): boolean;
}

@Component({ name: '@test/Guest', service: DOES_STUFF_INTERFACE_KEY })
export class Guest implements DoesStuff {
  doesStuff(): boolean {
    return false;
  }
}

@Component({ name: '@test/Host', property: { [SERVICE_RANKING]: 10 } })
export class Host {
  @Reference({ service: DOES_STUFF_INTERFACE_KEY, cardinality: 'MANDATORY' })
  private guest?: DoesStuff;

  private noop = 'noop';

  @Activate()
  onActivate() {
    console.log('Activating Host');
  }

  @Deactivate()
  onDeactivate() {
    console.log('Deactivating Host');
  }

  @Modified()
  onModified() {
    console.log('Modified!');
  }

  test(): boolean {
    return this.guest!.doesStuff();
  }
}
