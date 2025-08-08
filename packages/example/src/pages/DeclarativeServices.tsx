import React, { useState, useEffect } from 'react';
import CodeIcon from '@mui/icons-material/Code';
import SettingsIcon from '@mui/icons-material/Settings';
import LinkIcon from '@mui/icons-material/Link';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { alpha, useTheme } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
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
import { useFeatureToggle } from '../contexts/FeatureToggleContext';
import { featureColors, heroStyles } from '../theme';
import CodeBlock from '../components/CodeBlock';

const DeclarativeServices: React.FC = () => {
  const theme = useTheme();
  const { isFeatureEnabled, enableFeature } = useFeatureToggle();
  const enabled = isFeatureEnabled('declarativeServices');

  useEffect(() => {
    if (!enabled) {
      enableFeature('declarativeServices');
    }
  }, [enabled, enableFeature]);

  const [activeComponent, setActiveComponent] = useState<string | null>(null);

  if (!enabled) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h4" gutterBottom>
          Declarative Services Feature Disabled
        </Typography>
        <Typography variant="body1" paragraph>
          The Declarative Services feature is currently disabled. Enable it from the sidebar to explore this feature.
        </Typography>
      </Box>
    );
  }

  const handleActivateComponent = (component: string) => {
    setActiveComponent(component);
  };

  const handleDeactivateComponent = () => {
    setActiveComponent(null);
  };

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
          border: `1px solid ${alpha(featureColors.declarativeServices, 0.3)}`,
          backdropFilter: heroStyles.backdropBlur,
          boxShadow: `0 4px 20px rgba(0, 0, 0, 0.3), 0 0 15px ${alpha(featureColors.declarativeServices, 0.2)}`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `linear-gradient(135deg, ${alpha(featureColors.declarativeServices, 0.15)} 0%, ${alpha(
              featureColors.declarativeServices,
              0.07,
            )} 100%)`,
            zIndex: -1,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ color: featureColors.declarativeServices, mr: 2 }}>
            <CodeIcon fontSize="large" />
          </Box>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              color: featureColors.declarativeServices,
              textShadow: heroStyles.glowEffect(featureColors.declarativeServices),
            }}
          >
            Declarative Services
          </Typography>
        </Box>

        <Typography variant="body1" paragraph>
          Decorator-based dependency injection for simplified service wiring. Declarative Services allow you to define
          components, services, and dependencies using TypeScript decorators, reducing boilerplate and enhancing
          maintainability.
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
                Declarative Services simplify component wiring through TypeScript decorators, eliminating boilerplate
                code and enhancing maintainability.
              </Typography>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <CodeIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="@Component"
                    secondary="Defines a component with properties like name, immediate, and configurationPid"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="@Service" secondary="Specifies which interfaces the component implements" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LinkIcon fontSize="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="@Reference" secondary="Injects dependencies from the service registry" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PlayArrowIcon fontSize="small" color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="@Activate"
                    secondary="Marks a method to be called when the component is activated"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <StopIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary="@Deactivate"
                    secondary="Marks a method to be called when the component is deactivated"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Accordion sx={{ mb: 4 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Dependency Injection Patterns</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                Declarative Services support various dependency injection patterns:
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Cardinality:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label="1..1 (Required)" color="primary" variant="outlined" />
                  <Chip label="0..1 (Optional)" color="primary" variant="outlined" />
                  <Chip label="0..n (Multiple Optional)" color="primary" variant="outlined" />
                  <Chip label="1..n (Multiple Required)" color="primary" variant="outlined" />
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Policy:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label="static (Fixed)" color="secondary" variant="outlined" />
                  <Chip label="dynamic (Replaceable)" color="secondary" variant="outlined" />
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Service Component Runtime (SCR)
              </Typography>
              <Typography variant="body2" paragraph>
                The Service Component Runtime (SCR) is responsible for managing the lifecycle of declarative components:
              </Typography>

              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Automatic Component Registration"
                    secondary="SCR automatically detects and registers components from bundle configurations"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Lifecycle Management"
                    secondary="Handles component activation, deactivation, and dependency resolution"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Configuration Management"
                    secondary="Manages component configuration and updates"
                  />
                </ListItem>
              </List>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  SCR acts as an extender for Pandino, tracking bundle lifecycle and managing registered components
                  accordingly.
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
                This demo simulates the lifecycle of declarative components. Click "Activate" to see how components are
                activated and dependencies are resolved.
              </Typography>

              <Paper
                sx={{
                  p: 3,
                  mb: 3,
                  backgroundColor: alpha(theme.palette.background.paper, 0.6),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Component Lifecycle
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" paragraph>
                    Current state:{' '}
                    {activeComponent ? (
                      <Chip label={`${activeComponent} Active`} color="success" size="small" sx={{ ml: 1 }} />
                    ) : (
                      <Chip label="No Active Components" color="default" size="small" sx={{ ml: 1 }} />
                    )}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleActivateComponent('UserService')}
                    disabled={activeComponent === 'UserService'}
                    startIcon={<PlayArrowIcon />}
                  >
                    Activate UserService
                  </Button>

                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => handleActivateComponent('NotificationService')}
                    disabled={activeComponent === 'NotificationService'}
                    startIcon={<PlayArrowIcon />}
                  >
                    Activate NotificationService
                  </Button>

                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleDeactivateComponent}
                    disabled={!activeComponent}
                    startIcon={<StopIcon />}
                  >
                    Deactivate
                  </Button>
                </Box>
              </Paper>

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Lifecycle Events:
                </Typography>

                <Paper
                  sx={{
                    p: 2,
                    maxHeight: '200px',
                    overflow: 'auto',
                    backgroundColor: alpha(theme.palette.background.paper, 0.4),
                  }}
                >
                  {activeComponent ? (
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary={`@Component ${activeComponent} activated`}
                          secondary="Component instance created"
                          primaryTypographyProps={{ color: 'success.main' }}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Dependencies resolved" secondary="Required services injected" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="@Activate method called" secondary={`${activeComponent}.activate()`} />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Service registered"
                          secondary={`${activeComponent} registered in service registry`}
                        />
                      </ListItem>
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                      No lifecycle events. Activate a component to see events.
                    </Typography>
                  )}
                </Paper>
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
                  <Typography variant="subtitle1">Basic Component Definition</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <CodeBlock
                    code={`import { Component, Service, Activate, Deactivate } from '@pandino/decorators';

@Component({ name: 'user.service' })
@Service({ interfaces: ['UserService'] })
class UserService {
  private users = new Map<string, User>();

  @Activate
  activate() {
    console.log('User service started');
  }

  @Deactivate
  deactivate() {
    this.users.clear();
  }

  createUser(userData: UserData): User {
    const user = new User(userData);
    this.users.set(user.id, user);
    return user;
  }
}`}
                    language="typescript"
                    showLineNumbers={true}
                  />
                </AccordionDetails>
              </Accordion>

              <Accordion sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Dependency Injection</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <CodeBlock
                    code={`@Component({ name: 'order.service' })
@Service({ interfaces: ['OrderService'] })
class OrderService {
  @Reference({
    interface: 'UserService',
    cardinality: '1..1',
    policy: 'static'
  })
  private userService?: UserService;

  @Reference({
    interface: 'PaymentService',
    cardinality: '0..1',
    policy: 'dynamic'
  })
  private paymentService?: PaymentService;

  async createOrder(userId: string, items: OrderItem[]): Promise<Order> {
    const user = this.userService?.findUser(userId);
    const order = new Order(user, items);
    await this.paymentService?.processPayment(order);
    return order;
  }
}`}
                    language="typescript"
                    showLineNumbers={true}
                  />
                </AccordionDetails>
              </Accordion>

              <Accordion sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Component Registration</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <CodeBlock
                    code={`// Automatic registration in bundle.ts
export default {
  headers: {
    bundleSymbolicName: 'com.example.services',
    bundleVersion: '1.0.0',
  },
  // Components are automatically registered by SCR
  components: [UserService, OrderService]
};

// Manual registration
import type { BundleActivator, BundleContext, ServiceComponentRuntime } from '@pandino/pandino';

const activator: BundleActivator = {
  async start(context: BundleContext) {
    const scrRef = context.getServiceReference<ServiceComponentRuntime>('ServiceComponentRuntime');
    const scr = context.getService(scrRef)!;
    const bundleId = context.getBundle().getBundleId();

    // Register your components
    await scr.registerComponent(UserService, bundleId);
    await scr.registerComponent(OrderService, bundleId);
  }
};`}
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

export default DeclarativeServices;
