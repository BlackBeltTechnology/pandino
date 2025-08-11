import React, { useState, useEffect } from 'react';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { alpha, useTheme } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { useFeatureToggle } from '../contexts/FeatureToggleContext';
import { featureColors, heroStyles } from '../theme';
import CodeBlock from '../components/CodeBlock';

const ReactIntegration: React.FC = () => {
  const theme = useTheme();
  const { isFeatureEnabled, enableFeature } = useFeatureToggle();
  const enabled = isFeatureEnabled('reactIntegration');

  useEffect(() => {
    if (!enabled) {
      enableFeature('reactIntegration');
    }
  }, [enabled, enableFeature]);

  // Demo state
  const [name, setName] = useState<string>('React');
  const [greeting, setGreeting] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [serviceFound, setServiceFound] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('useService');

  // Simulate service discovery
  const handleDiscoverService = () => {
    setLoading(true);
    // Simulate async service discovery
    setTimeout(() => {
      setServiceFound(true);
      setLoading(false);
      setGreeting(`Hello, ${name}!`);
    }, 1000);
  };

  // Simulate random greeting
  const handleRandomGreeting = () => {
    if (!serviceFound) return;

    const greetings = [
      `Hey there, ${name}!`,
      `Greetings, ${name}!`,
      `Welcome, ${name}!`,
      `Good day, ${name}!`,
      `Hi ${name}, nice to meet you!`,
    ];

    setGreeting(greetings[Math.floor(Math.random() * greetings.length)]);
  };

  // Reset demo
  const handleReset = () => {
    setServiceFound(false);
    setGreeting('');
  };

  if (!enabled) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h4" gutterBottom>
          React Integration Feature Disabled
        </Typography>
        <Typography variant="body1" paragraph>
          The React Integration feature is currently disabled. Enable it from the sidebar to explore this feature.
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
          border: `1px solid ${alpha(featureColors.reactIntegration, 0.3)}`,
          backdropFilter: heroStyles.backdropBlur,
          boxShadow: `0 4px 20px rgba(0, 0, 0, 0.3), 0 0 15px ${alpha(featureColors.reactIntegration, 0.2)}`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `linear-gradient(135deg, ${alpha(featureColors.reactIntegration, 0.15)} 0%, ${alpha(
              featureColors.reactIntegration,
              0.07,
            )} 100%)`,
            zIndex: -1,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ color: featureColors.reactIntegration, mr: 2 }}>
            <ViewModuleIcon fontSize="large" />
          </Box>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              color: featureColors.reactIntegration,
              textShadow: heroStyles.glowEffect(featureColors.reactIntegration),
            }}
          >
            React Integration
          </Typography>
        </Box>

        <Typography variant="body1" paragraph>
          Hook-based service discovery for React components. The React Integration allows React components to easily
          discover and use Pandino services through custom hooks, providing a seamless integration between Pandino and
          React.
        </Typography>
      </Box>

      {/* Main content */}
      <Grid container spacing={4}>
        {/* Left column - Concepts and Examples */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Key Concepts
              </Typography>
              <Typography variant="body2" paragraph>
                The React Integration provides hooks and components for seamless integration with the Pandino framework:
              </Typography>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <SearchIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="useService"
                    secondary="Hook for discovering and using services in React components"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="usePandinoContext"
                    secondary="Hook for accessing the framework instance and bundle context"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <ViewModuleIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="PandinoProvider"
                    secondary="Root provider component that initializes the framework with bundles"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Accordion sx={{ mb: 4 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">React Hooks API</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="subtitle2" gutterBottom>
                useService&lt;T&gt;(interface: string)
              </Typography>
              <Typography variant="body2" paragraph>
                Discovers and provides a service of the specified interface.
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                  Returns:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label="service: T | null" color="primary" variant="outlined" />
                  <Chip label="loading: boolean" color="primary" variant="outlined" />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                usePandinoContext()
              </Typography>
              <Typography variant="body2" paragraph>
                Provides access to the framework instance and bundle context.
              </Typography>
              <Box>
                <Typography variant="body2" component="div" sx={{ mb: 1 }}>
                  Returns:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label="bundleContext: BundleContext" color="secondary" variant="outlined" />
                  <Chip label="isInitialized: boolean" color="secondary" variant="outlined" />
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Advanced Patterns
              </Typography>
              <Typography variant="body2" paragraph>
                The React Integration supports several advanced patterns:
              </Typography>

              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Dynamic Service Switching"
                    secondary="Automatically use the highest-ranked service implementation"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Service Availability Gates"
                    secondary="Conditionally render components based on service availability"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Bundle Lifecycle Management"
                    secondary="Start, stop, and monitor bundles from React components"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Conditional Service Loading"
                    secondary="Only load services when needed for better performance"
                  />
                </ListItem>
              </List>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  React components can dynamically adapt to service availability, making your application more
                  resilient.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Right column - Interactive Demo and Code Examples */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Interactive Demo
              </Typography>
              <Typography variant="body2" paragraph>
                This demo simulates how React components can discover and use Pandino services through hooks.
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Button
                    variant={activeTab === 'useService' ? 'contained' : 'outlined'}
                    onClick={() => setActiveTab('useService')}
                  >
                    useService Demo
                  </Button>
                  <Button
                    variant={activeTab === 'usePandinoContext' ? 'contained' : 'outlined'}
                    onClick={() => setActiveTab('usePandinoContext')}
                  >
                    usePandinoContext Demo
                  </Button>
                </Box>

                {activeTab === 'useService' && (
                  <Paper
                    sx={{
                      p: 3,
                      backgroundColor: alpha(theme.palette.background.paper, 0.6),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      useService Hook Demo
                    </Typography>

                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" paragraph>
                        This simulates the <code>useService</code> hook discovering a GreetingService.
                      </Typography>

                      <TextField
                        label="Your Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        margin="normal"
                        variant="outlined"
                        size="small"
                      />

                      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleDiscoverService}
                          disabled={loading || serviceFound}
                          startIcon={<SearchIcon />}
                        >
                          Discover Service
                        </Button>

                        <Button
                          variant="contained"
                          color="secondary"
                          onClick={handleRandomGreeting}
                          disabled={!serviceFound}
                        >
                          Random Greeting
                        </Button>

                        <Button
                          variant="outlined"
                          color="error"
                          onClick={handleReset}
                          disabled={!serviceFound && !loading}
                        >
                          Reset
                        </Button>
                      </Box>
                    </Box>

                    <Box sx={{ minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {loading ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <CircularProgress size={40} />
                          <Typography variant="body2" color="text.secondary">
                            Discovering GreetingService...
                          </Typography>
                        </Box>
                      ) : serviceFound ? (
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h5" color="primary" gutterBottom>
                            {greeting}
                          </Typography>
                          <Chip label="GreetingService discovered" color="success" variant="outlined" />
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Click "Discover Service" to simulate the useService hook
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ mt: 3, p: 2, backgroundColor: alpha(theme.palette.background.paper, 0.4) }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Equivalent Code:
                      </Typography>
                      <CodeBlock
                        code={`function GreetingComponent() {
  const [name, setName] = useState('React');
  const { service: greetingService, loading } =
    useService<GreetingService>('GreetingService');

  if (loading) {
    return <CircularProgress />;
  }

  if (!greetingService) {
    return <div>Service not available</div>;
  }

  return (
    <div>
      <h2>{greetingService.greet(name)}</h2>
      <button onClick={() =>
        greetingService.getRandomGreeting(name)
      }>
        Random Greeting
      </button>
    </div>
  );
}`}
                        language="typescript"
                        showLineNumbers={false}
                      />
                    </Box>
                  </Paper>
                )}

                {activeTab === 'usePandinoContext' && (
                  <Paper
                    sx={{
                      p: 3,
                      backgroundColor: alpha(theme.palette.background.paper, 0.6),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      usePandinoContext Hook Demo
                    </Typography>

                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" paragraph>
                        The <code>usePandinoContext</code> hook provides direct access to the framework instance and
                        bundle context.
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        p: 3,
                        border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                        borderRadius: 1,
                        mb: 3,
                      }}
                    >
                      <Typography variant="subtitle2" gutterBottom>
                        Framework Status:
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: 'success.main',
                            boxShadow: '0 0 10px rgba(76, 175, 80, 0.5)',
                          }}
                        />
                        <Typography variant="body2">Connected</Typography>
                      </Box>

                      <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>
                        Bundle Information:
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemText primary="@pandino/pandino" secondary="Active (Bundle ID: 0)" />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="@pandino/react-hooks" secondary="Active (Bundle ID: 1)" />
                        </ListItem>
                        <ListItem>
                          <ListItemText primary="@example/greeting-service" secondary="Active (Bundle ID: 2)" />
                        </ListItem>
                      </List>
                    </Box>

                    <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.background.paper, 0.4) }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Equivalent Code:
                      </Typography>
                      <CodeBlock
                        code={`function BundleInfo() {
  const { bundleContext, isInitialized } = usePandinoContext();
  const [bundles, setBundles] = useState([]);

  useEffect(() => {
    if (bundleContext && isInitialized) {
      setBundles(bundleContext.getBundles());
    }
  }, [bundleContext, isInitialized]);

  if (!isInitialized) {
    return <div>Framework initializing...</div>;
  }

  return (
    <div>
      <h3>Bundle Status</h3>
      {bundles.map(bundle => (
        <div key={bundle.getBundleId()}>
          <span>{bundle.getSymbolicName()}</span>
          <span>{bundle.getState()}</span>
        </div>
      ))}
    </div>
  );
}`}
                        language="typescript"
                        showLineNumbers={false}
                      />
                    </Box>
                  </Paper>
                )}
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Code Examples
              </Typography>

              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">PandinoProvider Setup</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <CodeBlock
                    code={`// main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PandinoProvider } from '@pandino/react-hooks';
import App from './App';

// The provider handles framework initialization automatically
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PandinoProvider bundles={[
      import('./bundles/greeting-service-bundle.ts'),
      import('./bundles/user-service-bundle.ts')
    ]}>
      <App />
    </PandinoProvider>
  </StrictMode>
);`}
                    language="typescript"
                    showLineNumbers={true}
                  />
                </AccordionDetails>
              </Accordion>

              <Accordion sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Service Discovery with useService</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <CodeBlock
                    code={`import React, { useState, useEffect } from 'react';
import { useService } from '@pandino/react-hooks';

interface UserService {
  getUser(id: string): Promise<User>;
  getAllUsers(): Promise<User[]>;
}

function UserProfile({ userId }: { userId: string }) {
  const { service: userService, loading } = useService<UserService>('UserService');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (userService) {
      userService.getUser(userId).then(setUser);
    }
  }, [userService, userId]);

  if (loading || !userService) {
    return <div>Loading user service...</div>;
  }

  if (!user) return <div>Loading user...</div>;

  return <div>Welcome, {user.name}!</div>;
}`}
                    language="typescript"
                    showLineNumbers={true}
                  />
                </AccordionDetails>
              </Accordion>

              <Accordion sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Advanced Pattern: Service Availability Gates</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <CodeBlock
                    code={`function ProtectedFeature({ children }: { children: React.ReactNode }) {
  const { service: authService } = useService<AuthService>('AuthService');
  const { service: featureService } = useService<FeatureToggleService>('FeatureToggleService');

  if (!authService || !featureService) {
    return <div>Loading required services...</div>;
  }

  if (!authService.isAuthenticated()) {
    return <div>Please log in to access this feature.</div>;
  }

  if (!featureService.isEnabled('premium-features')) {
    return <div>This feature is not available.</div>;
  }

  return <>{children}</>;
}`}
                    language="typescript"
                    showLineNumbers={true}
                  />
                </AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReactIntegration;
