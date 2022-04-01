import { FC, Component } from 'react';

export interface ComponentProxyProps extends Record<any, any> {
  identifier: string;
  defaultComponent: FC<any> | typeof Component;
}
