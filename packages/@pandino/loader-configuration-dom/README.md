# loader-configuration-dom

This package is a first-party default Pandino loader configuration.

## Usage

Obtain the library from a CDN or NPM (`@pandino/loader-configuration-dom`). Import it, and provide it to the Pandino
constructor argument.

```javascript
import loaderConfiguration from './loader-configuration-dom.mjs';
import Pandino from './pandino.mjs';

const pandino = new Pandino({
    ...loaderConfiguration,
    // other properties may go here
});

await pandino.init();
await pandino.start();
```

## License

Eclipse Public License - v 2.0
