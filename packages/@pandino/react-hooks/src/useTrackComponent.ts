import { useMemo } from 'react';
import { type ServiceTrackerHook, useTrackService } from './useTrackService';

export type TrackComponentHook = ServiceTrackerHook;

export const useTrackComponent: TrackComponentHook = <T>(filter: string) => {
  const { service, properties } = useTrackService<T>(filter);

  return useMemo(() => ({ service, properties }), [service, properties]);
};
