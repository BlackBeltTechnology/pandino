import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Feature =
  | 'serviceRegistry'
  | 'bundleSystem'
  | 'eventSystem'
  | 'configAdmin'
  | 'declarativeServices'
  | 'reactIntegration'
  | 'dynamicDependencies';

interface FeatureToggleContextType {
  enabledFeatures: Record<Feature, boolean>;
  toggleFeature: (feature: Feature) => void;
  enableFeature: (feature: Feature) => void;
  disableFeature: (feature: Feature) => void;
  isFeatureEnabled: (feature: Feature) => boolean;
}

const FeatureToggleContext = createContext<FeatureToggleContextType | undefined>(undefined);

interface FeatureToggleProviderProps {
  children: ReactNode;
}

export const FeatureToggleProvider: React.FC<FeatureToggleProviderProps> = ({ children }) => {
  const [enabledFeatures, setEnabledFeatures] = useState<Record<Feature, boolean>>({
    serviceRegistry: false,
    bundleSystem: false,
    eventSystem: false,
    configAdmin: false,
    declarativeServices: false,
    reactIntegration: false,
    dynamicDependencies: false,
  });

  const toggleFeature = (feature: Feature) => {
    setEnabledFeatures((prev) => ({
      ...prev,
      [feature]: !prev[feature],
    }));
  };

  const enableFeature = (feature: Feature) => {
    setEnabledFeatures((prev) => ({
      ...prev,
      [feature]: true,
    }));
  };

  const disableFeature = (feature: Feature) => {
    setEnabledFeatures((prev) => ({
      ...prev,
      [feature]: false,
    }));
  };

  const isFeatureEnabled = (feature: Feature) => {
    return enabledFeatures[feature];
  };

  const value = {
    enabledFeatures,
    toggleFeature,
    enableFeature,
    disableFeature,
    isFeatureEnabled,
  };

  return <FeatureToggleContext.Provider value={value}>{children}</FeatureToggleContext.Provider>;
};

export const useFeatureToggle = () => {
  const context = useContext(FeatureToggleContext);
  if (context === undefined) {
    throw new Error('useFeatureToggle must be used within a FeatureToggleProvider');
  }
  return context;
};

export const featureDescriptions: Record<Feature, string> = {
  serviceRegistry: 'Service Registry - Dynamic service discovery and LDAP filtering',
  bundleSystem: 'Bundle System - Bundle lifecycle management and fragment bundles',
  eventSystem: 'Event System - Publish-subscribe messaging with topic-based routing',
  configAdmin: 'Configuration Admin - Runtime configuration updates',
  declarativeServices: 'Declarative Services - Decorator-based dependency injection',
  reactIntegration: 'React Integration - Hook-based service discovery in components',
  dynamicDependencies: 'Dynamic Dependencies - Bundles depending on services from other bundles',
};
