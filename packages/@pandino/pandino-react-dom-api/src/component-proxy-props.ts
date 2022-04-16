import { FC, Component } from 'react';
import { BundleContext } from '@pandino/pandino-api';

export interface ComponentProxyProps extends Record<any, any> {
  identifier: string;
  bundleContext: BundleContext;
  defaultComponent: FC<any> | typeof Component | any;
}
