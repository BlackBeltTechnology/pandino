import type { FC } from 'react';
import { useState } from 'react';
import { OBJECTCLASS } from '@pandino/pandino-api';
import { CUSTOM_COMPONENT_INTERFACE_KEY } from '@react-systemjs/component-api';
import { ComponentProxy } from './ComponentProxy';

export const App: FC = () => {
  const [firstName] = useState<string>('John');

  return (
    <ComponentProxy filter={`(${OBJECTCLASS}=${CUSTOM_COMPONENT_INTERFACE_KEY})`} firstName={firstName}>
      <div className={'fallback'}>fallback</div>
    </ComponentProxy>
  );
};
