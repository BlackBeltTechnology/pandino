import type { FC } from 'react';
import { useState } from 'react';
import { OBJECTCLASS } from '@pandino/pandino-api';
import { ComponentProxy } from '@pandino/react-hooks';
import { CUSTOM_COMPONENT_INTERFACE_KEY } from '@react-systemjs/component-api';
import { FallbackComponent } from './FallbackComponent';

export const App: FC = () => {
  const [firstName] = useState<string>('John');

  console.count('Rendering App.');

  return (
    <ComponentProxy filter={`(${OBJECTCLASS}=${CUSTOM_COMPONENT_INTERFACE_KEY})`} firstName={firstName}>
        <FallbackComponent firstName={firstName} />
    </ComponentProxy>
  );
};
