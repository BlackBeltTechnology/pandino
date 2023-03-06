import { useMemo } from 'react';
import { OBJECTCLASS } from '@pandino/pandino-api';
import { useTrackService } from '@pandino/react-hooks';
import type { CustomComponent } from '@react-systemjs/component-api';
import { SOME_SERVICE_INTERFACE_KEY, SomeService } from './service';

export const FallbackComponent: CustomComponent = (props) => {
  const { service: someService } = useTrackService<SomeService>(`(${OBJECTCLASS}=${SOME_SERVICE_INTERFACE_KEY})`);
  const text = useMemo<string | undefined>(() => someService?.someMethod(), [someService]);

  console.count('Rendering FallbackComponent.');
  console.info(`SomeService implementation: ${someService}`);

  return (
    <div>
      <div className={'fallback'}>fallback for: {props.firstName}</div>
      <div className={'service'}>SomeService test: {someService?.someMethod()}</div>
      <div className={'text'}>Text: {text}</div>
    </div>
  );
};
