# pandino-persistence-manager-localstorage

Localstorage implementation of the Pandino Persistence Manager API

## Usage

```javascript
export default class Activator {
  async start(context) {
    this.persistenceManagerReference = context.getServiceReference('@pandino/persistence-manager/PersistenceManager');
    this.persistenceManager = context.getService(this.persistenceManagerReference);

    console.log(this.persistenceManager.exists('test.pid'));

    return Promise.resolve();
  }

  stop(context) {
    context.ungetService(this.persistenceManagerReference);

    return Promise.resolve();
  }
}
```
