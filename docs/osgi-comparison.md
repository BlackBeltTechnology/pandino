# Highlighted differences compared to OSGI


| Feature                   | OSGi                                                                     | Pandino                                                                                                                     |
|---------------------------|--------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| `BundleActivator` methods | `sync`                                                                   | `async`                                                                                                                     |
| Bundle States             | A Bundle only goes to `RESOLVED` state once the class loader is prepared | Every Bundle goes to `RESOLVED` from `INSTALLED` instantly since there is no class loader in JavaScript                     |
| Service Scopes            | `SINGLETON`, `PROTOTYPE`, `BUNDLE`                                       | Only `SINGLETON` is supported currently                                                                                     |
| Version Type              | Self-defined `Version` type                                              | Full-blown `SemVer`                                                                                                         |
| `BundleContext` APIs      | Self-defined, full                                                       | Limited / modified set of the OSGi specification                                                                            |
| `Wiring` and `Wire` APIs  | Self-defined, full                                                       | Limited set of the OSGi specification                                                                                       |
| Persistent Storage        | Self-defined, e.g.: Configuration, Bundle-caches, etc...                 | None by default, but for "extras" a custom implementation of the `PersistenceManager` may persist to Browser storage / Disk |
| Caching in general        | Self-defined                                                             | Nothing is cached in a traditional sense, all core-information is stored in memory                                          |
| BundleArchive             | `.jar` file(s) containing manifests and Java classes                     | `json` file containing manifest headers, plus a mandatory reference to an activator file (`.js`)                            |
| `StartLevel` concept      | Self-defined, full                                                       | Completely omitted                                                                                                          |
| `Bundle-ActivationPolicy` header | `EAGER`, `LAZY`                                                   | Only `EAGER`                                                                                                                |
| `Require-Bundle` header   | Supported                                                                | Not supported yet                                                                                                           |
| `Import-Package`, `Export-Package` headers | Self-defined, full                                      | No support planned                                                                                                          |
| Requirement `Resolution` directive    | Self-defined, full                                           | Not implemented, every Requirement is considered `mandatory`                                                                |
