import { useEffect, useState } from 'react';
import { useTrackService } from './useTrackService';

// React crashes when we are trying to load components, unless the component is wrapped in a function call
export interface ComponentProvider<T> {
  getComponent: () => T | undefined;
}
export type TrackComponentHook = <T>(filter: string) => T | undefined;

export const useTrackComponent: TrackComponentHook = <T>(filter: string) => {
  const tracker = useTrackService<T>(filter);
  const [componentProvider, setComponentProvider] = useState<ComponentProvider<T>>({
    getComponent: () => undefined,
  });

  useEffect(() => {
    setComponentProvider({ getComponent: () => tracker.service });
  }, [tracker]);

  return componentProvider.getComponent();
};
