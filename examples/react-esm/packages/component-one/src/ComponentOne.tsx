import { useState } from 'react';
import { CustomComponent } from '@react-esm/component-api';

export const ComponentOne: CustomComponent = (props) => {
  const [data, setData] = useState<{ firstName: string; lastName?: string }>({ ...props });

  return (
    <>
      <h3>Component One:</h3>
      <p>FirstName: {data.firstName}</p>
      <p>LastName: {data.lastName}</p>
    </>
  );
};
