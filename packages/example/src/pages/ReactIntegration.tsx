import React from 'react';
import { ViewModule as ViewModuleIcon } from '@mui/icons-material';
import FeaturePlaceholder from './FeaturePlaceholder';
import { featureColors } from '../theme';

const ReactIntegration: React.FC = () => {
  return (
    <FeaturePlaceholder
      title="React Integration"
      description="Hook-based service discovery for React components. The React Integration allows React components to easily discover and use Pandino services through custom hooks, providing a seamless integration between Pandino and React."
      feature="reactIntegration"
      icon={<ViewModuleIcon fontSize="large" />}
      color={featureColors.reactIntegration}
    />
  );
};

export default ReactIntegration;
