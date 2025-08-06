import { type ReactNode, createElement } from 'react';
import { useService } from '~/hooks';

export interface ComponentProxyProps {
  filter: string;
  serviceClass: string | Function;
  children?: ReactNode;
  [key: string]: any;
}

export function ComponentProxy(props: ComponentProxyProps): ReactNode {
  const { filter, serviceClass, children, ...restProps } = props;

  const { service, loading, error } = useService<any>(serviceClass, filter);

  if (loading || error || !service) {
    return <>{children}</>;
  }

  try {
    if (typeof service === 'function') {
      return createElement(service, {
        testProp: restProps.testProp || '',
        ...restProps,
      });
    }

    if (service && service.$$typeof) {
      const elementType = service.type;
      const mergedProps = {
        ...service.props,
        testProp: restProps.testProp || service.props?.testProp || '',
        ...restProps,
      };

      return createElement(elementType, mergedProps);
    }

    console.error('Service is neither a React element nor a function:', service);
    return <>{children}</>;
  } catch (err) {
    console.error('Error rendering service component:', err);
    console.error('Error details:', err instanceof Error ? err.message : String(err));
    console.error('Service:', service);
    return <>{children}</>;
  }
}
