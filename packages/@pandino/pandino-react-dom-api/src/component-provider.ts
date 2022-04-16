import { FC, Component } from 'react';

// This interface and the corresponding mechanics are required due to a currently mystical React behavior where if we
// don't wrap Components coming from the Service Registry, React blows up.
export interface ComponentProvider {
  getIdentifier(): string;
  getComponent(): FC<any> | typeof Component;
  getFilter(): string | undefined;
}
