import type { FC, ReactNode } from 'react';
import { useTrackComponent } from './useTrackComponent';

interface ProxyProps {
  filter: string;
  children?: ReactNode;
  [prop: string]: any;
}

export const ComponentProxy: FC<ProxyProps> = ({ children, filter, ...other }) => {
  const { service: ExternalComponent } = useTrackComponent<any>(filter);

  if (ExternalComponent && typeof ExternalComponent === 'function') {
    return <ExternalComponent {...other} />;
  }

  return <>{children}</>;
};
