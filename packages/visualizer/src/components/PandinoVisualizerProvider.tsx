import { ReactNode } from 'react';
import { ReactFlowProvider } from '@xyflow/react';

export interface PandinoVisualizerProviderProps {
  children: ReactNode;
}

export function PandinoVisualizerProvider({ children }: PandinoVisualizerProviderProps) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>;
}

