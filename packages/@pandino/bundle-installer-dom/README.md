# bundle-installer-dom

A Pandino Bundle which can load external Bundles defined in a dedicated DOM node.

## Context

This package is part of the [pandino-root](https://github.com/BlackBeltTechnology/pandino) monorepo. For detailed
information about what is Pandino / how this package fits into the ecosystem, please consult with the related
documentation(s).

## Usage

### Define manifests
Define a `<script type="pandino-manifests" />` tag in your `index.html`, e.g.:

```html
<script type="pandino-manifests">
  [
    "./bundle-a-manifest.json",
    "./bundle-b-manifest.json"
  ]
</script>
```

### Install this Bundle in your Application

E.g.: directly via the Pandino instance.

```javascript
let pandino: Bundle;

// ...

pandino.getBundleContext().installBundle('./bundle-installer-dom-manifest.json');
```

## License

Eclipse Public License - v 2.0
