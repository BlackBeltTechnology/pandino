import type { FC } from 'react';

export const CUSTOM_COMPONENT_INTERFACE_KEY = '@react-systemjs/component-api/CustomComponent';

export interface CustomComponent extends FC<ComponentProps> {}

export interface ComponentProps {
  firstName: string;
  lastName?: string;
}
