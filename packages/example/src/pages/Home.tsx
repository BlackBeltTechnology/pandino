import React from 'react';
import { Typography, Box, Card, CardContent, Grid, Button, useTheme, alpha } from '@mui/material';
import {
  Api as ApiIcon,
  Extension as ExtensionIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Code as CodeIcon,
  ViewModule as ViewModuleIcon,
} from '@mui/icons-material';
import { useFeatureToggle, Feature } from '../contexts/FeatureToggleContext';
import { Link as RouterLink } from 'react-router-dom';
import { featureColors, heroStyles } from '../theme';

const features = [
  {
    title: 'Service Registry',
    description: 'Dynamic service discovery and LDAP filtering for loosely coupled components',
    icon: <ApiIcon fontSize="large" />,
    path: '/service-registry',
    feature: 'serviceRegistry' as Feature,
    color: featureColors.serviceRegistry,
  },
  {
    title: 'Bundle System',
    description: 'Self-contained modules with independent lifecycles and dynamic dependencies',
    icon: <ExtensionIcon fontSize="large" />,
    path: '/bundle-system',
    feature: 'bundleSystem' as Feature,
    color: featureColors.bundleSystem,
  },
  {
    title: 'Event System',
    description: 'Publish-subscribe messaging with topic-based routing for decoupled communication',
    icon: <NotificationsIcon fontSize="large" />,
    path: '/event-system',
    feature: 'eventSystem' as Feature,
    color: featureColors.eventSystem,
  },
  {
    title: 'Config Admin',
    description: 'Runtime configuration updates without application restarts',
    icon: <SettingsIcon fontSize="large" />,
    path: '/config-admin',
    feature: 'configAdmin' as Feature,
    color: featureColors.configAdmin,
  },
  {
    title: 'Declarative Services',
    description: 'Decorator-based dependency injection for simplified service wiring',
    icon: <CodeIcon fontSize="large" />,
    path: '/declarative-services',
    feature: 'declarativeServices' as Feature,
    color: featureColors.declarativeServices,
  },
  {
    title: 'React Integration',
    description: 'Hook-based service discovery for React components',
    icon: <ViewModuleIcon fontSize="large" />,
    path: '/react-integration',
    feature: 'reactIntegration' as Feature,
    color: featureColors.reactIntegration,
  },
];

const Home: React.FC = () => {
  const theme = useTheme();
  const { enabledFeatures, toggleFeature } = useFeatureToggle();

  return (
    <Box>
      {/* Hero section */}
      <Box
        sx={{
          textAlign: 'center',
          mb: 6,
          p: 4,
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: heroStyles.backgroundGradient,
            backdropFilter: 'blur(10px)',
            zIndex: -1,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `radial-gradient(circle at 50% 50%, ${alpha(theme.palette.primary.main, 0.2)} 0%, transparent 70%)`,
            zIndex: -1,
          },
        }}
      >
        <Typography
          variant="h1"
          gutterBottom
          sx={{
            fontSize: { xs: '2.5rem', md: '3.5rem' },
            fontWeight: 'bold',
          }}
        >
          PANDINO
        </Typography>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontSize: { xs: '1.2rem', md: '1.5rem' },
            mb: 3,
            color: theme.palette.secondary.main,
          }}
        >
          OSGi-Style Framework for TypeScript
        </Typography>
        <Typography variant="body1" paragraph sx={{ maxWidth: '800px', mx: 'auto', mb: 4 }}>
          A lightweight TypeScript framework that brings modular architecture to your applications. Build
          loosely-coupled, maintainable applications where different parts can communicate without knowing about each
          other directly.
        </Typography>
      </Box>

      {/* Feature cards */}
      <Grid container spacing={3}>
        {features.map((feature) => {
          const isEnabled = enabledFeatures[feature.feature];

          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={feature.title}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  opacity: isEnabled ? 1 : 0.7,
                  '&:hover': {
                    transform: isEnabled ? 'translateY(-5px)' : 'none',
                    boxShadow: isEnabled ? heroStyles.hoverBoxShadow(alpha(feature.color, 0.4)) : 'none',
                  },
                  '&::before': isEnabled
                    ? {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '4px',
                        background: feature.color,
                        boxShadow: heroStyles.glowEffect(feature.color),
                      }
                    : {},
                }}
              >
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      mb: 2,
                      color: isEnabled ? feature.color : theme.palette.text.secondary,
                    }}
                  >
                    {feature.icon}
                    <Typography variant="h5" component="div" sx={{ ml: 1 }}>
                      {feature.title}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 2, flexGrow: 1 }}>
                    {feature.description}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                    <Button
                      variant="outlined"
                      component={RouterLink}
                      to={isEnabled ? feature.path : '#'}
                      disabled={!isEnabled}
                      sx={{
                        borderColor: isEnabled ? feature.color : theme.palette.text.disabled,
                        color: isEnabled ? feature.color : theme.palette.text.secondary,
                        '&:hover': {
                          borderColor: feature.color,
                          backgroundColor: alpha(feature.color, 0.1),
                        },
                      }}
                    >
                      Explore
                    </Button>

                    <Button
                      variant="text"
                      size="small"
                      onClick={() => toggleFeature(feature.feature)}
                      sx={{
                        color: isEnabled ? theme.palette.success.main : theme.palette.error.main,
                      }}
                    >
                      {isEnabled ? 'Enabled' : 'Disabled'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default Home;
