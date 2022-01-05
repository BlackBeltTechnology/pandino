# App

## Warning

When working with Webpack, we need to make sure that it doesn't do any black magic with dynamic ES `import()`s.

To achieve this we need to inline a comment for it, e.g.:

```typescript
{
    import: (activator: string) => import(/* webpackIgnore: true */ activator),
}
```
