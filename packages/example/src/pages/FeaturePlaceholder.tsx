import React from 'react';
import { Typography, Box, Card, CardContent, useTheme, alpha, Paper, Divider, Alert } from '@mui/material';
import { useFeatureToggle, Feature } from '../contexts/FeatureToggleContext';
import { heroStyles } from '../theme';
import CodeBlock from '../components/CodeBlock';

interface FeaturePlaceholderProps {
  title: string;
  description: string;
  feature: Feature;
  icon: React.ReactNode;
  color: string;
}

const FeaturePlaceholder: React.FC<FeaturePlaceholderProps> = ({ title, description, feature, icon, color }) => {
  const theme = useTheme();
  const { isFeatureEnabled } = useFeatureToggle();
  const enabled = isFeatureEnabled(feature);

  if (!enabled) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h4" gutterBottom>
          Feature Disabled
        </Typography>
        <Typography variant="body1" paragraph>
          The {title} feature is currently disabled. Enable it from the sidebar to explore this feature.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Feature header */}
      <Box
        sx={{
          mb: 4,
          p: 3,
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
          border: `1px solid ${alpha(color, 0.3)}`,
          backdropFilter: heroStyles.backdropBlur,
          boxShadow: `0 4px 20px rgba(0, 0, 0, 0.3), 0 0 15px ${alpha(color, 0.2)}`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `linear-gradient(135deg, ${alpha(color, 0.15)} 0%, ${alpha(color, 0.07)} 100%)`,
            zIndex: -1,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ color: color, mr: 2 }}>{icon}</Box>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              color,
              textShadow: heroStyles.glowEffect(color),
            }}
          >
            {title}
          </Typography>
        </Box>

        <Typography variant="body1" paragraph>
          {description}
        </Typography>
      </Box>

      {/* Coming soon message */}
      <Alert
        severity="info"
        variant="outlined"
        sx={{
          mb: 4,
          borderColor: alpha(theme.palette.info.main, 0.5),
          '& .MuiAlert-icon': {
            color: theme.palette.info.main,
          },
        }}
      >
        This feature showcase is under development. Check back soon for a complete implementation!
      </Alert>

      {/* Placeholder content */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          backgroundColor: alpha(theme.palette.background.paper, 0.5),
        }}
      >
        <Typography variant="h5" gutterBottom>
          What you'll learn in this showcase:
        </Typography>
        <Typography variant="body2" component="div" sx={{ mb: 2 }}>
          <ul>
            <li>How to use the {title} feature in your applications</li>
            <li>Best practices for implementing {title}</li>
            <li>Common patterns and use cases</li>
            <li>Integration with other Pandino features</li>
          </ul>
        </Typography>
      </Paper>

      {/* Interactive elements placeholder */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Interactive Demo
          </Typography>
          <Typography variant="body2" paragraph>
            This area will contain interactive examples of the {title} feature.
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Box
            sx={{
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px dashed ${alpha(theme.palette.text.secondary, 0.3)}`,
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Interactive demo will be implemented here
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Code example placeholder */}
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Code Examples
          </Typography>
          <Typography variant="body2" paragraph>
            Sample code snippets demonstrating the {title} feature will be shown here.
          </Typography>
          <Box>
            <CodeBlock
              code={`// Example ${title} implementation
import { ... } from '@pandino/pandino';

// This is a placeholder for actual code examples
// that will demonstrate the ${title} feature`}
              language="typescript"
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FeaturePlaceholder;
