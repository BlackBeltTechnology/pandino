import { BundleContext } from '@pandino/pandino-api';
import { DefaultApp } from './DefaultApp';
import { ComponentProxy } from './component-proxy';

interface ReactWrapperProps {
  context: BundleContext;
  applicationObjectClass: string;
}

export function ReactWrapper({ context, applicationObjectClass }: ReactWrapperProps) {
  return (
    <div className="react-wrapper">
      <ComponentProxy bundleContext={context} identifier={applicationObjectClass} defaultComponent={DefaultApp} />
    </div>
  );
}
