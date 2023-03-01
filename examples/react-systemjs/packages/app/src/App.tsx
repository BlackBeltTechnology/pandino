import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { OBJECTCLASS } from '@pandino/pandino-api';
import { ComponentProxy, useTrackService } from '@pandino/react-hooks';
import { CUSTOM_COMPONENT_INTERFACE_KEY } from '@react-systemjs/component-api';
import { SOME_SERVICE_INTERFACE_KEY, SomeService } from './service';

export const App: FC = () => {
  const [firstName] = useState<string>('John');
  const { service: someService } = useTrackService<SomeService>(`(${OBJECTCLASS}=${SOME_SERVICE_INTERFACE_KEY})`);
  const text = useMemo<string | undefined>(() => someService?.someMethod(), [someService]);

  console.count('Rendering App.');

  useEffect(() => {
      console.info(`SomeService implementation: ${someService}`);
  }, [someService]);

  useEffect(() => {
    console.info(`text: ${text}`);
  }, [text]);

  return (
    <ComponentProxy filter={`(${OBJECTCLASS}=${CUSTOM_COMPONENT_INTERFACE_KEY})`} firstName={firstName}>
      <div className={'fallback'}>fallback for: {firstName}</div>
      <div className={'service'}>SomeService test: {someService?.someMethod()}</div>
      <div className={'text'}>Text: {text}</div>
    </ComponentProxy>
  );
};
