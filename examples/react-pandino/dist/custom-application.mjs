class Activator {
  useReactBundleContextRef;
  jsxsRef;
  FragmentRef;
  jsxRef;
  provideCustomApplicationRegistration;

  start(context) {
    this.useReactBundleContextRef = context.getServiceReference('@pandino/pandino-react-dom/useReactBundleContext');
    const useBundleContext = context.getService(this.useReactBundleContextRef);

    this.jsxsRef = context.getServiceReference('@pandino/pandino-react-dom/react/jsx-runtime/jsxs');
    const jsxs = context.getService(this.jsxsRef);

    this.jsxRef = context.getServiceReference('@pandino/pandino-react-dom/react/jsx-runtime/jsx');
    const jsx = context.getService(this.jsxRef);

    function CustomApplication() {
      const { bundleContext } = useBundleContext();
      console.log(bundleContext);

      return jsxs('div', {
        className: 'page',
        children: [
          jsx('h3', { children: 'Hello!' }),
          jsx('p', { children: 'Custom Application loaded.' }),
        ],
      });
    }

    const provideCustomApplicationComponent = {
      getComponent: () => CustomApplication,
      getFilter: () => undefined,
      getIdentifier: () => '@pandino/pandino-react-dom/application',
    };

    this.provideCustomApplicationRegistration = context.registerService(
      provideCustomApplicationComponent.getIdentifier(),
      provideCustomApplicationComponent,
      { 'service.ranking': 90 },
    );

    // Simulating our implementation going away at runtime:
    // window.setTimeout(() => {
    //   this.provideCustomApplicationRegistration?.unregister();
    // }, 3000);

    return Promise.resolve();
  }

  stop(context) {
    context.ungetService(this.useReactBundleContextRef);
    context.ungetService(this.jsxsRef);
    context.ungetService(this.FragmentRef);
    context.ungetService(this.jsxRef);
    this.provideCustomApplicationRegistration?.unregister();
    return Promise.resolve();
  }
}

export { Activator as default };
