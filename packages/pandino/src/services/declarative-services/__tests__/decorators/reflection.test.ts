import { describe, expect, it } from 'vitest';
import { getDecoratorInfo } from '../../reflection';
import {
  Activate,
  Component,
  ConfigurationPolicy,
  Deactivate,
  Property,
  Reference,
  Service,
} from '@pandino/decorators';

describe('Reflection Helpers', () => {
  describe('getDecoratorInfo', () => {
    it('should retrieve all decorator information in a single call', () => {
      @Component({
        name: 'complete.component',
        immediate: true,
        configurationPid: 'complete.config',
      })
      @Service({ interfaces: ['CompleteService'], scope: 'prototype' })
      @ConfigurationPolicy('require')
      @Property('service.ranking', 100)
      class CompleteComponent {
        @Reference({ interface: 'LogService' })
        private logger?: any;

        @Activate
        activate() {}

        @Deactivate
        deactivate() {}
      }

      const info = getDecoratorInfo(CompleteComponent);

      expect(info).toMatchSnapshot();
    });

    it('should work with non-component classes', () => {
      class NonComponent {}

      const info = getDecoratorInfo(NonComponent);

      expect(info).toMatchSnapshot();
    });
  });
});
