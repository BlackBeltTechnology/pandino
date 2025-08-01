import type { ReactNode } from 'react';
import { useService } from '~/hooks';

/**
 * Props for the ServiceConsumer component
 */
export interface ServiceConsumerProps<T> {
  /**
   * The class or interface name of the service to consume
   */
  serviceClass: string | Function;

  /**
   * Optional LDAP filter to further refine the service lookup
   */
  filter?: string;

  /**
   * Render function that receives the service, loading state, and any error
   */
  children: (props: { service: T | null; loading: boolean; error: Error | null }) => ReactNode;
}

/**
 * Component for consuming services from the Pandino service registry
 *
 * @example
 * ```tsx
 * <ServiceConsumer serviceClass="LogService">
 *   {({ service, loading, error }) => {
 *     if (loading) return <div>Loading...</div>;
 *     if (error) return <div>Error: {error.message}</div>;
 *     if (!service) return <div>Service not found</div>;
 *
 *     return <div>Log level: {service.getLogLevel()}</div>;
 *   }}
 * </ServiceConsumer>
 * ```
 */
export function ServiceConsumer<T>({ serviceClass, filter, children }: ServiceConsumerProps<T>): ReactNode {
  const { service, loading, error } = useService<T>(serviceClass, filter);

  return <>{children({ service, loading, error })}</>;
}
