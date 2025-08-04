import React, { useState, useEffect } from 'react';
import {
  Notifications as NotificationsIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  FilterAlt as FilterAltIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  Computer as ComputerIcon,
  NotificationsActive as NotificationsActiveIcon,
} from '@mui/icons-material';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  useTheme,
  alpha,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useFeatureToggle } from '../contexts/FeatureToggleContext';
import { usePandinoContext } from '@pandino/react-hooks';
import { EventPublisherService } from '../bundles/event-publisher-bundle';
import { EventListenerService, EventRecord } from '../bundles/event-handler-bundle';
import { featureColors, heroStyles } from '../theme';
import CodeBlock from '../components/CodeBlock';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`event-tabpanel-${index}`}
      aria-labelledby={`event-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EventSystem: React.FC = () => {
  const theme = useTheme();
  const { isFeatureEnabled } = useFeatureToggle();
  const { bundleContext } = usePandinoContext();
  const [eventPublisherService, setEventPublisherService] = useState<EventPublisherService | null>(null);
  const [eventListenerService, setEventListenerService] = useState<EventListenerService | null>(null);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [eventStats, setEventStats] = useState<{ totalEvents: number; eventsByTopic: Record<string, number> }>({
    totalEvents: 0,
    eventsByTopic: {},
  });
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);

  const [userId, setUserId] = useState<string>('user123');
  const [userAction, setUserAction] = useState<string>('login');
  const [userName, setUserName] = useState<string>('John Doe');
  const [userEmail, setUserEmail] = useState<string>('john.doe@example.com');

  const [systemAction, setSystemAction] = useState<string>('status');
  const [systemStatus, setSystemStatus] = useState<string>('online');
  const [systemMessage, setSystemMessage] = useState<string>('System is running normally');

  const [notificationType, setNotificationType] = useState<string>('info');
  const [notificationMessage, setNotificationMessage] = useState<string>('This is an information message');
  const [notificationPriority, setNotificationPriority] = useState<number>(75);
  const [notificationUrgent, setNotificationUrgent] = useState<boolean>(false);

  const [topicFilter, setTopicFilter] = useState<string>('');

  const enabled = isFeatureEnabled('eventSystem');

  useEffect(() => {
    if (!enabled || !bundleContext) return;

    try {
      setLoading(true);

      const publisherRef = bundleContext.getServiceReference<EventPublisherService>('EventPublisherService');
      if (publisherRef) {
        const publisher = bundleContext.getService<EventPublisherService>(publisherRef);
        setEventPublisherService(publisher || null);
      } else {
        setEventPublisherService(null);
      }

      const listenerRef = bundleContext.getServiceReference<EventListenerService>('EventListenerService');
      if (listenerRef) {
        const listener = bundleContext.getService<EventListenerService>(listenerRef);
        setEventListenerService(listener || null);
      } else {
        setEventListenerService(null);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error getting services:', err);
      setError('Failed to get event services. Make sure the event bundles are loaded.');
      setLoading(false);
    }
  }, [bundleContext, enabled]);

  useEffect(() => {
    if (!eventListenerService) return;

    try {
      const allEvents = topicFilter
        ? eventListenerService.getEventsByTopic(topicFilter)
        : eventListenerService.getAllEvents();

      setEvents(allEvents);

      const stats = eventListenerService.getEventStats();
      setEventStats(stats);
    } catch (err) {
      console.error('Error refreshing events:', err);
      setError('Failed to refresh events.');
    }
  }, [eventListenerService, refreshTrigger, topicFilter]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const publishUserEvent = () => {
    if (!eventPublisherService) return;

    try {
      eventPublisherService.publishUserEvent(userAction, userId, {
        name: userName,
        email: userEmail,
      });

      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Error publishing user event:', err);
      setError('Failed to publish user event.');
    }
  };

  const publishSystemEvent = () => {
    if (!eventPublisherService) return;

    try {
      eventPublisherService.publishSystemEvent(systemAction, {
        status: systemStatus,
        message: systemMessage,
      });

      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Error publishing system event:', err);
      setError('Failed to publish system event.');
    }
  };

  const publishNotificationEvent = () => {
    if (!eventPublisherService) return;

    try {
      eventPublisherService.publishNotificationEvent(notificationType, notificationMessage, {
        priority: notificationPriority,
        urgent: notificationUrgent,
      });

      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Error publishing notification event:', err);
      setError('Failed to publish notification event.');
    }
  };

  const clearEvents = () => {
    if (!eventListenerService) return;

    try {
      eventListenerService.clearEvents();
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Error clearing events:', err);
      setError('Failed to clear events.');
    }
  };

  const applyTopicFilter = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const resetTopicFilter = () => {
    setTopicFilter('');
    setRefreshTrigger((prev) => prev + 1);
  };

  if (!enabled) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h4" gutterBottom>
          Event System Feature Disabled
        </Typography>
        <Typography variant="body1" paragraph>
          The Event System feature is currently disabled. Enable it from the sidebar to explore this feature.
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
          border: `1px solid ${alpha(featureColors.eventSystem, 0.3)}`,
          backdropFilter: heroStyles.backdropBlur,
          boxShadow: `0 4px 20px rgba(0, 0, 0, 0.3), 0 0 15px ${alpha(featureColors.eventSystem, 0.2)}`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `linear-gradient(135deg, ${alpha(featureColors.eventSystem, 0.15)} 0%, ${alpha(featureColors.eventSystem, 0.07)} 100%)`,
            zIndex: -1,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ color: featureColors.eventSystem, mr: 2 }}>
            <NotificationsIcon fontSize="large" />
          </Box>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              color: featureColors.eventSystem,
              textShadow: heroStyles.glowEffect(featureColors.eventSystem),
            }}
          >
            Event System
          </Typography>
        </Box>

        <Typography variant="body1" paragraph>
          Publish-subscribe messaging with topic-based routing for decoupled communication. The Event System allows
          components to communicate without direct dependencies, enhancing modularity and flexibility.
        </Typography>
      </Box>

      {/* Error message */}
      {error && (
        <Alert severity="error" variant="outlined" sx={{ mb: 4 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Service status */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress color="secondary" />
        </Box>
      ) : !eventPublisherService || !eventListenerService ? (
        <Alert severity="warning" sx={{ mb: 4 }}>
          Event services are not available. Make sure the event bundles are loaded and active.
        </Alert>
      ) : (
        <Grid container spacing={4}>
          {/* Left column - Event Publisher */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <SendIcon sx={{ mr: 1 }} />
                  Event Publisher
                </Typography>
                <Typography variant="body2" paragraph>
                  Publish events to the Event Admin service. Events are categorized by topic and can carry properties.
                </Typography>

                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={{
                      '& .MuiTab-root': {
                        color: theme.palette.text.secondary,
                      },
                      '& .MuiTab-root.Mui-selected': {
                        color: featureColors.eventSystem,
                        fontWeight: 'bold',
                      },
                      '& .MuiTabs-indicator': {
                        backgroundColor: featureColors.eventSystem,
                      },
                    }}
                  >
                    <Tab label="User Events" icon={<PersonIcon />} iconPosition="start" />
                    <Tab label="System Events" icon={<ComputerIcon />} iconPosition="start" />
                    <Tab label="Notifications" icon={<NotificationsActiveIcon />} iconPosition="start" />
                  </Tabs>
                </Box>

                {/* User Events Tab */}
                <TabPanel value={tabValue} index={0}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      User Action:
                    </Typography>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>Action</InputLabel>
                      <Select value={userAction} label="Action" onChange={(e) => setUserAction(e.target.value)}>
                        <MenuItem value="login">Login</MenuItem>
                        <MenuItem value="logout">Logout</MenuItem>
                        <MenuItem value="register">Register</MenuItem>
                        <MenuItem value="update">Update Profile</MenuItem>
                        <MenuItem value="delete">Delete Account</MenuItem>
                      </Select>
                    </FormControl>

                    <Typography variant="subtitle2" gutterBottom>
                      User ID:
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      sx={{ mb: 2 }}
                    />

                    <Typography variant="subtitle2" gutterBottom>
                      User Properties:
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Name"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Email"
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                        />
                      </Grid>
                    </Grid>

                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<SendIcon />}
                      onClick={publishUserEvent}
                      fullWidth
                    >
                      Publish User Event
                    </Button>
                  </Box>
                </TabPanel>

                {/* System Events Tab */}
                <TabPanel value={tabValue} index={1}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      System Action:
                    </Typography>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>Action</InputLabel>
                      <Select value={systemAction} label="Action" onChange={(e) => setSystemAction(e.target.value)}>
                        <MenuItem value="status">Status Update</MenuItem>
                        <MenuItem value="startup">System Startup</MenuItem>
                        <MenuItem value="shutdown">System Shutdown</MenuItem>
                        <MenuItem value="error">System Error</MenuItem>
                        <MenuItem value="maintenance">Maintenance</MenuItem>
                      </Select>
                    </FormControl>

                    <Typography variant="subtitle2" gutterBottom>
                      System Properties:
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid size={{ xs: 6 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Status</InputLabel>
                          <Select value={systemStatus} label="Status" onChange={(e) => setSystemStatus(e.target.value)}>
                            <MenuItem value="online">Online</MenuItem>
                            <MenuItem value="offline">Offline</MenuItem>
                            <MenuItem value="degraded">Degraded</MenuItem>
                            <MenuItem value="maintenance">Maintenance</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Message"
                          value={systemMessage}
                          onChange={(e) => setSystemMessage(e.target.value)}
                        />
                      </Grid>
                    </Grid>

                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<SendIcon />}
                      onClick={publishSystemEvent}
                      fullWidth
                    >
                      Publish System Event
                    </Button>
                  </Box>
                </TabPanel>

                {/* Notification Events Tab */}
                <TabPanel value={tabValue} index={2}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Notification Type:
                    </Typography>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={notificationType}
                        label="Type"
                        onChange={(e) => setNotificationType(e.target.value)}
                      >
                        <MenuItem value="info">Information</MenuItem>
                        <MenuItem value="warning">Warning</MenuItem>
                        <MenuItem value="error">Error</MenuItem>
                        <MenuItem value="success">Success</MenuItem>
                        <MenuItem value="alert">Alert</MenuItem>
                      </Select>
                    </FormControl>

                    <Typography variant="subtitle2" gutterBottom>
                      Message:
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      sx={{ mb: 2 }}
                    />

                    <Typography variant="subtitle2" gutterBottom>
                      Properties:
                    </Typography>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid size={{ xs: 6 }}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Priority (0-100)"
                          type="number"
                          value={notificationPriority}
                          onChange={(e) => setNotificationPriority(parseInt(e.target.value))}
                          inputProps={{ min: 0, max: 100 }}
                        />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={notificationUrgent}
                              onChange={(e) => setNotificationUrgent(e.target.checked)}
                            />
                          }
                          label="Urgent"
                        />
                      </Grid>
                    </Grid>

                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<SendIcon />}
                      onClick={publishNotificationEvent}
                      fullWidth
                    >
                      Publish Notification
                    </Button>
                  </Box>
                </TabPanel>
              </CardContent>
            </Card>

            {/* Event Concepts */}
            <Accordion sx={{ mb: 4 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Event System Concepts</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" paragraph>
                  The Event System provides a publish-subscribe messaging pattern:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <SendIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Publishers"
                      secondary="Send events to the EventAdmin service without knowing who will receive them"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <NotificationsIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Subscribers"
                      secondary="Register as EventHandlers to receive events they're interested in"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <FilterAltIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Topic-based Routing"
                      secondary="Events are routed to handlers based on their topic (e.g., 'user/login')"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Event Filtering"
                      secondary="Handlers can filter events based on their properties using LDAP filters"
                    />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Right column - Event Listener */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <NotificationsIcon sx={{ mr: 1 }} />
                    Event Listener
                  </Box>
                  <Box>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={() => setRefreshTrigger((prev) => prev + 1)}
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      Refresh
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={clearEvents}
                      size="small"
                    >
                      Clear
                    </Button>
                  </Box>
                </Typography>
                <Typography variant="body2" paragraph>
                  View events received by the event handlers. Events are categorized by topic and can be filtered.
                </Typography>

                {/* Event statistics */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Event Statistics:
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: alpha(theme.palette.background.paper, 0.6) }}>
                    <Typography variant="body2" component="div">
                      <strong>Total Events:</strong> {eventStats.totalEvents}
                    </Typography>
                    {Object.entries(eventStats.eventsByTopic).length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" component="div">
                          <strong>Events by Topic:</strong>
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                          {Object.entries(eventStats.eventsByTopic).map(([topic, count]) => (
                            <Chip
                              key={topic}
                              label={`${topic}: ${count}`}
                              size="small"
                              color={
                                topic.startsWith('user/') ? 'primary' : topic.startsWith('system/') ? 'info' : 'warning'
                              }
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Paper>
                </Box>

                {/* Topic filter */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Filter Events by Topic:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g., user/* or notification/info"
                      value={topicFilter}
                      onChange={(e) => setTopicFilter(e.target.value)}
                    />
                    <Button variant="contained" startIcon={<FilterAltIcon />} onClick={applyTopicFilter}>
                      Filter
                    </Button>
                    <Button variant="outlined" onClick={resetTopicFilter}>
                      Reset
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip label="user/*" onClick={() => setTopicFilter('user/*')} color="primary" variant="outlined" />
                    <Chip label="system/*" onClick={() => setTopicFilter('system/*')} color="info" variant="outlined" />
                    <Chip
                      label="notification/*"
                      onClick={() => setTopicFilter('notification/*')}
                      color="warning"
                      variant="outlined"
                    />
                  </Box>
                </Box>

                {/* Event list */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Received Events:
                  </Typography>
                  {events.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      No events received yet. Publish some events to see them here.
                    </Alert>
                  ) : (
                    <TableContainer
                      component={Paper}
                      sx={{
                        maxHeight: 400,
                        backgroundColor: alpha(theme.palette.background.paper, 0.6),
                      }}
                    >
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Topic</TableCell>
                            <TableCell>Timestamp</TableCell>
                            <TableCell>Properties</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {events.map((event) => (
                            <TableRow key={event.id}>
                              <TableCell>
                                <Chip
                                  label={event.topic}
                                  size="small"
                                  color={
                                    event.topic.startsWith('user/')
                                      ? 'primary'
                                      : event.topic.startsWith('system/')
                                        ? 'info'
                                        : 'warning'
                                  }
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>{new Date(event.receivedAt).toLocaleTimeString()}</TableCell>
                              <TableCell>
                                <Tooltip
                                  title={<CodeBlock code={JSON.stringify(event.properties, null, 2)} language="json" />}
                                  arrow
                                >
                                  <IconButton size="small">
                                    <InfoIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                {event.properties.message && <span>{event.properties.message}</span>}
                                {event.properties.name && <span>{event.properties.name}</span>}
                                {event.properties.status && (
                                  <Chip
                                    label={event.properties.status}
                                    size="small"
                                    color={
                                      event.properties.status === 'online'
                                        ? 'success'
                                        : event.properties.status === 'offline'
                                          ? 'error'
                                          : 'warning'
                                    }
                                    variant="outlined"
                                    sx={{ ml: 1 }}
                                  />
                                )}
                                {event.properties.priority && (
                                  <Chip
                                    label={`Priority: ${event.properties.priority}`}
                                    size="small"
                                    color={
                                      event.properties.priority >= 75
                                        ? 'error'
                                        : event.properties.priority >= 50
                                          ? 'warning'
                                          : 'info'
                                    }
                                    variant="outlined"
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Event Filtering Demo */}
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Event Filtering Demo
                </Typography>
                <Typography variant="body2" paragraph>
                  This demonstrates how event handlers can filter events based on their properties using LDAP filters.
                </Typography>

                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Note:</strong> The notification event handler is registered with the filter{' '}
                    <code>(priority&gt;=50)</code>. This means it will only receive notification events with a priority
                    of 50 or higher.
                  </Typography>
                </Alert>

                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Try it out:
                  </Typography>
                  <Typography variant="body2" paragraph>
                    1. Go to the "Notifications" tab in the Event Publisher
                  </Typography>
                  <Typography variant="body2" paragraph>
                    2. Set the priority to less than 50 and publish a notification
                  </Typography>
                  <Typography variant="body2" paragraph>
                    3. Notice that the event is not received by the handler
                  </Typography>
                  <Typography variant="body2" paragraph>
                    4. Set the priority to 50 or higher and publish another notification
                  </Typography>
                  <Typography variant="body2" paragraph>
                    5. Now the event should appear in the received events list
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default EventSystem;
