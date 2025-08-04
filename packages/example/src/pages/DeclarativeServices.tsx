import React from 'react';
import { Code as CodeIcon } from '@mui/icons-material';
import FeaturePlaceholder from './FeaturePlaceholder';
import { featureColors } from '../theme';

const DeclarativeServices: React.FC = () => {
  return (
    <FeaturePlaceholder
      title="Declarative Services"
      description="Decorator-based dependency injection for simplified service wiring. Declarative Services allow you to define components, services, and dependencies using TypeScript decorators, reducing boilerplate and enhancing maintainability."
      feature="declarativeServices"
      icon={<CodeIcon fontSize="large" />}
      color={featureColors.declarativeServices}
    />
  );
};

export default DeclarativeServices;
