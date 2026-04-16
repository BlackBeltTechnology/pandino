import { type ReactNode, createElement } from 'react';
import { useService } from '../hooks';

/** Props accepted by {@link ComponentProxy}. */
export interface ComponentProxyProps {
  filter: string;
  serviceClass: string | Function;
  children?: ReactNode;
  [key: string]: any;
}

/**
 * Renders a React component that is registered as a Pandino service.
 * While the service is loading or unavailable, `children` is rendered as a
 * fallback. Any extra props are forwarded to the resolved component.
 *
 * @param props.serviceClass - Interface name or constructor to look up.
 * @param props.filter - LDAP filter expression identifying the component service.
 * @param props.children - Optional fallback content shown while the service is unavailable.
 */
export function ComponentProxy(props: ComponentProxyProps): ReactNode {
  const { filter, serviceClass, children, ...restProps } = props;

  const { service, loading, error } = useService<any>(serviceClass, filter);

  if (loading || error || !service) {
    return <>{children}</>;
  }

  try {
    if (typeof service === 'function') {
      return createElement(service, {
        ...restProps,
      });
    }

    if (service && service.$$typeof) {
      const elementType = service.type;
      const mergedProps = {
        ...service.props,
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
