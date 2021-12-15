# Pandino

OSGi - lite web framework.

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

## Notes

- Do not export `enum`s, messes up tree-shaking, use `type`s instead...


## Sources
- https://docs.osgi.org/specification/osgi.core/8.0.0/framework.lifecycle.html
- https://docs.osgi.org/specification/osgi.core/8.0.0/framework.service.html
- https://docs.osgi.org/specification/osgi.core/8.0.0/framework.api.html
