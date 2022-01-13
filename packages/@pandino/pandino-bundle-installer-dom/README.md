# pandino-bundle-installer-dom

A Pandino Bundle which can load external Bundles defined in a dedicated DOM node.

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

pandino.getBundleContext().installBundle('./pandino-bundle-installer-dom-manifest.json');
```
