# Pandino

[![build-test](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml/badge.svg)](https://github.com/BlackBeltTechnology/pandino/actions/workflows/build-test.yml)

An OSGi-lite JavaScript Framework.

## CMDs

```
# Install deps:
npm i

# Format code:
npm run format

# Build all packages (excluding example project):
npm run build

# Build single package, e.g.:
npm run build -- --scope @pandino/bundle-a

# Copy built sources to example package (cleans its dist):
./cp-dist-deps.sh

# Run example project:
npm start
```

> Dev server starts at [http://localhost:5001](http://localhost:5001).

## TODO

- refactor identifier/className(s) to resemble NPM standard scopes
- Update current example project to showcase a working web-app
- Add example project for NodeJS usage
  - Requires a "Deploy folder watcher" Bundle to be introduced to showcase real-time feature addition
- Add LastModified info to Bundles to support the below steps
- Introduce [ConfigAdmin](https://docs.osgi.org/specification/osgi.cmpn/8.0.0/service.cm.html)
- Introduce [EventAdmin](https://docs.osgi.org/specification/osgi.cmpn/8.0.0/service.event.html)

## Notes

- Do not export `enum`s, messes up tree-shaking, use `type`s instead...


## Sources
- https://docs.osgi.org/specification/osgi.core/8.0.0/framework.lifecycle.html
- https://docs.osgi.org/specification/osgi.core/8.0.0/framework.service.html
- https://docs.osgi.org/specification/osgi.core/8.0.0/framework.api.html
