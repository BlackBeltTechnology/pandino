import { SemVer } from 'semver';
import { Bundle, BundleContext, FilterParser, Logger, SemverFactory } from '@pandino/pandino-api';
import { ConfigurationManager } from './configuration-manager';
import { MockBundleContext } from './__mocks__/mock-bundle-context';
import { MockBundle } from './__mocks__/mock-bundle';
import { MockPersistenceManager } from './__mocks__/mock-persistence-manager';

describe('ConfigurationManager', function () {
  const semverFactory: SemverFactory = {
    build: (version) => new SemVer(version),
  };
  let persistenceManager: MockPersistenceManager;
  let context: BundleContext;
  let bundle: Bundle;
  let cm: ConfigurationManager;
  let mockFilterParser: FilterParser = {
    parse: jest.fn(),
  };
  let mockDebug = jest.fn();
  let logger: Logger = {
    debug: mockDebug,
  } as unknown as Logger;

  beforeEach(() => {
    mockDebug.mockClear();
    context = new MockBundleContext();
    bundle = new MockBundle(
      context as MockBundleContext,
      'test.bundle.location',
      '@test/my-bundle',
      new SemVer('0.0.0'),
    );
    persistenceManager = new MockPersistenceManager(`{
      "my.component.pid": {
        "service.pid": "my.component.pid",
        "port" : 300
      }
    }`);
    cm = new ConfigurationManager(context, logger, mockFilterParser, persistenceManager, semverFactory);
  });

  it('listConfigurations()', () => {
    persistenceManager = new MockPersistenceManager(`{
      "my.component.pid": {
        "service.pid": "my.component.pid",
        "port" : 300, 
        "collection" : [2, 3, 4],  
        "complex": { 
          "a" : 1, 
          "b" : "two"
        }
      },
      "my.other.pid": {
        "service.pid": "my.other.pid",
        "key": "value"
      }
    }`);
    cm = new ConfigurationManager(context, logger, mockFilterParser, persistenceManager, semverFactory);

    expect(cm.listConfigurations().length).toEqual(2);

    const [config1, config2] = cm.listConfigurations();

    expect(config1.getPid()).toEqual('my.component.pid');
    expect(config1.getProperties()).toEqual({
      collection: [2, 3, 4],
      complex: { a: 1, b: 'two' },
      port: 300,
      'service.pid': 'my.component.pid',
    });

    expect(config2.getPid()).toEqual('my.other.pid');
    expect(config2.getProperties()).toEqual({ key: 'value', 'service.pid': 'my.other.pid' });
  });

  it('getConfiguration()', () => {
    cm = new ConfigurationManager(context, logger, mockFilterParser, persistenceManager, semverFactory);

    const config = cm.getConfiguration('my.component.pid');

    expect(config.getPid()).toEqual('my.component.pid');
    expect(config.getBundleLocation()).toEqual('test.bundle.location');
    expect(persistenceManager.dump()).toMatchSnapshot();
  });

  it('configuration update()', () => {
    cm = new ConfigurationManager(context, logger, mockFilterParser, persistenceManager, semverFactory);

    const config = cm.getConfiguration('my.component.pid');

    expect(persistenceManager.dump()).toMatchSnapshot();

    config.update({
      ...config.getProperties(),
      'new-prop': 'new-value',
    });

    expect(persistenceManager.dump()).toMatchSnapshot();
  });

  it('configuration delete()', () => {
    cm = new ConfigurationManager(context, logger, mockFilterParser, persistenceManager, semverFactory);

    const config = cm.getConfiguration('my.component.pid');

    expect(persistenceManager.dump()).toMatchSnapshot();

    config.delete();

    expect(() => config.getPid()).toThrow();
    expect(persistenceManager.dump()).toMatchSnapshot();
  });
});
