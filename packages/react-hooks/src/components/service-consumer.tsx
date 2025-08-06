import type { ReactNode } from 'react';
import { useService } from '~/hooks';

export interface ServiceConsumerProps<T> {
  serviceClass: string | Function;
  filter?: string;
  children: (props: { service: T | null; loading: boolean; error: Error | null }) => ReactNode;
}

export function ServiceConsumer<T>({ serviceClass, filter, children }: ServiceConsumerProps<T>): ReactNode {
  const { service, loading, error } = useService<T>(serviceClass, filter);

  return <>{children({ service, loading, error })}</>;
}
