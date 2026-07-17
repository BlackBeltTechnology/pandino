# fragment-pattern.agent.md — digest of `docs/fragment-pattern.md`

Explains the OSGi Fragment pattern as implemented in Pandino.

## Gist
- A **fragment** attaches to a **host** bundle and contributes resources directly to it. Fragments have **no independent lifecycle** and **no activator**; they share the host's identity/classloading.
- **How it works**: fragment declaration → fragment resolution (attach to host) → resource merging → host-driven resource discovery (`resources` map + resource API) → lifecycle binding (fragment lives/dies with host).
- **Use cases**: localization bundles, platform-specific code, adding declarative components, theming/UI customization.
- **Custom resource processors**: implement the `FragmentResourceProcessor` interface; examples for translation and theme processors; register the processor as a service.
- **Best practices**: fragment naming, version ranges, component design, testing.

## Key symbols
`FragmentResourceProcessor`, host `resources` map, resource API.

## When to open the full file
Writing a fragment or a custom resource processor; exact API signatures and examples.
