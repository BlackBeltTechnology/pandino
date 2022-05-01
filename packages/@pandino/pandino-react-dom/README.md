# pandino-react-dom

**EXPERIMENTAL TECHNOLOGY!**

A Pandino Bundle wrapping [React](https://reactjs.org/) itself with 
[React DOM](https://reactjs.org/docs/react-dom.html).

## Installation

### Install via adding it to `pandino-manifests`

> Only works, if *@pandino/pandino-bundle-installer-dom* is installed!

```html
<script type="pandino-manifests">
  [
    ...,
    "./pandino-react-dom-manifest.json"
  ]
</script>
```

### Install via BundleContext API

E.g.: directly via the Pandino instance.

```typescript
const pandino: Bundle;

// ...

pandino.getBundleContext().installBundle('./pandino-react-dom-manifest.json');
```

## Usage

TBA
