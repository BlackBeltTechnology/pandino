import { FC, ReactNode } from 'react';
import { useTrackComponent } from './useTrackComponent';

interface ProxyProps {
  filter: string;
  children?: ReactNode;
  [prop: string]: any;
}

export const ComponentProxy: FC<ProxyProps> = ({ children, filter, ...other }) => {
  const ExternalComponent = useTrackComponent<any>(filter);

  if (ExternalComponent) {
    return <ExternalComponent {...other} />;
  }

  return <>{children}</>;
};
