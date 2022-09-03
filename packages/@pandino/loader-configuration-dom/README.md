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

## Behaviour

Determining the "base" URL for Activator file loading based on manifest file location:

* if the manifest file's path starts with `http`, then the base path of the manifest 
  URL's head (ending at the last `/`) will be used
* in every other case it will take the Browser's `location.origin`, appends the value set in the `ìndex.html`'s
 `<base href="...">` (if present, otherwise will fall back to `/`) 

and lastly append whatever path is set in the manifest's `Bundle-Activator` property.

**Example:**

| index.html URL         | base-href  | Manifest file fetch() URL          | Activator path in Manifest | Calculated JS URL                       |
|------------------------|------------|------------------------------------|----------------------------|-----------------------------------------|
| http://host.com        | -          | http://lib.to/bundle-manifest.json | `./bundle.mjs`             | http://lib.to/bundle.js                 |
| http://host.com/my-app | -          | http://lib.to/bundle-manifest.json | `./bundle.mjs`             | http://lib.to/bundle.js                 |
| http://host.com        | -          | ./bundle-manifest.json             | `./bundle.mjs`             | http://host.com/bundle.js               |
| http://host.com/my-app | -          | ./bundle-manifest.json             | `./bundle.mjs`             | http://host.com/bundle.js               |
| http://host.com        | `/`        | ./bundle-manifest.json             | `./bundle.mjs`             | http://host.com/bundle.js               |
| http://host.com/my-app | `/my-app/` | ./bundle-manifest.json             | `./bundle.mjs`             | http://host.com/my-app/bundle.js        |
| http://host.com        | `/`        | ./deploy/bundle-manifest.json      | `./bundle.mjs`             | http://host.com/deploy/bundle.js        |
| http://host.com        | `/my-app/` | ./deploy/bundle-manifest.json      | `./bundle.mjs`             | http://host.com/my-app/deploy/bundle.js |


## License

Eclipse Public License - v 2.0
