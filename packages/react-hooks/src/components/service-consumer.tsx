import type { ReactNode } from 'react';
import { useService } from '../hooks';

/** Props accepted by {@link ServiceConsumer}. */
export interface ServiceConsumerProps<T> {
  serviceClass: string | Function;
  filter?: string;
  children: (props: { service: T | null; loading: boolean; error: Error | null }) => ReactNode;
}

/**
 * Render-prop component that resolves a single service and passes it to a
 * `children` function. Useful when you prefer a component-based API over hooks.
 *
 * @param props.serviceClass - Interface name or constructor to look up.
 * @param props.filter - Optional LDAP filter expression.
 * @param props.children - Render function receiving `{ service, loading, error }`.
 */
export function ServiceConsumer<T>({ serviceClass, filter, children }: ServiceConsumerProps<T>): ReactNode {
  const { service, loading, error } = useService<T>(serviceClass, filter);

  return <>{children({ service, loading, error })}</>;
}
