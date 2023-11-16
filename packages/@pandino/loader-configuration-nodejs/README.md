# loader-configuration-nodejs

[![build-test](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml/badge.svg)](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml)
[![license](https://img.shields.io/badge/license-EPL%20v2.0-blue.svg)](https://github.com/BlackBeltTechnology/pandino)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

This package is a first-party default Pandino loader configuration.

## Usage

Obtain the library from a CDN or NPM (`@pandino/loader-configuration-nodejs`). Import it, and provide it to the Pandino
constructor argument.

```javascript
import loaderConfiguration from '@pandino/loader-configuration-nodejs';
import Pandino from '@pandino/pandino';

const pandino = new Pandino({
    ...loaderConfiguration,
    'pandino.deployment.root': MY_DEPLOY_ROOT,
    // other properties may go here
});

await pandino.init();
await pandino.start();
```

## License

Eclipse Public License - v 2.0
