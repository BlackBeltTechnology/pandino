# pandino-mission-control-dom

**EXPERIMENTAL TECHNOLOGY!**

A Pandino Bundle which can display Pandino stats and other useful info to the DOM, to help developers.

## Installation

### Install via adding it to `pandino-manifests`

> Only works, if *@pandino/pandino-bundle-installer-dom* is installed!

```html
<script type="pandino-manifests">
  [
    ...,
    "./pandino-mission-control-dom-manifest.json"
  ]
</script>
```

### Install via BundleContext API

E.g.: directly via the Pandino instance.

```typescript
const pandino: Bundle;

// ...

pandino.getBundleContext().installBundle('./pandino-mission-control-dom-manifest.json');
```
