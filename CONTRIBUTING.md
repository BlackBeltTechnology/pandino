# Contributing to Pandino

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
```

## Notes

### Tree-shaking
Do not export `enum`s, messes up tree-shaking, use `type`s instead!

### Testing

In order for IDEs to be able to provide proper breakpoints and debugging support, JEST needs a dedicated
`tsconfig.test.json` file in every project.

The reason is that in bundle outputs we usually do not provide source-maps, but IDEs rely on them.

## Sources

- https://docs.osgi.org/specification/osgi.core/8.0.0/framework.lifecycle.html
- https://docs.osgi.org/specification/osgi.core/8.0.0/framework.service.html
- https://docs.osgi.org/specification/osgi.core/8.0.0/framework.api.html
