import type { ReactNode, FC } from 'react';
import { PandinoContext } from '../../context/pandino-context';
import { PandinoTestUtils } from './pandino-test-utils';

export const PandinoTestWrapper: FC<{
  children: ReactNode;
  pandinoUtils: PandinoTestUtils;
}> = ({ children, pandinoUtils }) => {
  const contextValue = pandinoUtils.createContextValue();
  return <PandinoContext.Provider value={contextValue}>{children}</PandinoContext.Provider>;
};

export async function setupPandinoTest(): Promise<PandinoTestUtils> {
  const pandinoUtils = new PandinoTestUtils();
  await pandinoUtils.initialize();
  return pandinoUtils;
}

export async function cleanupPandinoTest(pandinoUtils: PandinoTestUtils): Promise<void> {
  await pandinoUtils.cleanup();
}
