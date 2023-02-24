import { useState } from 'react';
import type { CustomComponent } from '@react-systemjs/component-api';

export const ComponentOne: CustomComponent = (props) => {
  const [data, setData] = useState<{ firstName: string; lastName?: string }>({ ...props });

  return (
    <div className="component-one" style={{ border: '1px solid black', padding: '1rem' }}>
      <h3>Component One</h3>
      <p>FirstName: {data.firstName}</p>
      <p>LastName: {data.lastName}</p>
    </div>
  );
};
