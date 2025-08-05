import React, { useState, useEffect } from 'react';
import ExtensionIcon from '@mui/icons-material/Extension';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import LinkIcon from '@mui/icons-material/Link';
import CodeIcon from '@mui/icons-material/Code';
import TimelineIcon from '@mui/icons-material/Timeline';
import CheckIcon from '@mui/icons-material/Check';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { alpha, useTheme } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useFeatureToggle } from '../contexts/FeatureToggleContext';
import { usePandinoContext } from '@pandino/react-hooks';
import { BUNDLE_STATES, type BundleListener } from '@pandino/pandino';
import { LoggerService } from '../bundles/logger-bundle';
import { TaskManagerService } from '../bundles/task-manager-bundle';
import { featureColors, bundleStateColors, heroStyles } from '../theme';

const getBundleStateName = (state: number): keyof typeof bundleStateColors => {
  return (Object.entries(BUNDLE_STATES).find(([_, value]) => value === state)?.[0] ||
    'UNKNOWN') as keyof typeof bundleStateColors;
};

const getBundleStateColor = (state: number): string => {
  const stateName = getBundleStateName(state);
  return bundleStateColors[stateName] || bundleStateColors.UNKNOWN;
};

const BundleSystem: React.FC = () => {
  const theme = useTheme();
  const { isFeatureEnabled, enableFeature } = useFeatureToggle();
  const { bundleContext } = usePandinoContext();
  const [bundles, setBundles] = useState<any[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [loggerService, setLoggerService] = useState<LoggerService | null>(null);
  const [taskManagerService, setTaskManagerService] = useState<TaskManagerService | null>(null);
  const [logs, setLogs] = useState<Array<{ level: string; message: string; timestamp: number }>>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [taskName, setTaskName] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');

  useEffect(() => {
    if (!isFeatureEnabled('bundleSystem')) {
      enableFeature('bundleSystem');
    }
  }, [enableFeature, isFeatureEnabled]);

  // Periodically check for services until they're available
  useEffect(() => {
    if (!isFeatureEnabled('bundleSystem') || !bundleContext) return;

    // If services are already available, no need for the interval
    if (loggerService && taskManagerService) return;

    // Set up an interval to check for services
    const intervalId = setInterval(() => {
      setRefreshTrigger((prev) => prev + 1);
    }, 1000); // Check every second

    // Clean up the interval when component unmounts or services become available
    return () => {
      clearInterval(intervalId);
    };
  }, [bundleContext, isFeatureEnabled, loggerService, taskManagerService]);

  const enabled = isFeatureEnabled('bundleSystem');

  // Refresh bundle list and listen for bundle changes
  useEffect(() => {
    if (!enabled || !bundleContext) return;

    try {
      setLoading(true);
      const allBundles = bundleContext.getBundles();
      setBundles(allBundles);
      setLoading(false);

      const bundleListener: BundleListener = {
        bundleChanged: () => {
          setRefreshTrigger((prev) => prev + 1);
        },
      };

      bundleContext.addBundleListener(bundleListener);

      return () => {
        bundleContext.removeBundleListener(bundleListener);
      };
    } catch (err) {
      console.error('Error fetching bundles:', err);
      setError('Failed to fetch bundles.');
      setLoading(false);
    }
  }, [bundleContext, enabled, refreshTrigger]);

  useEffect(() => {
    if (!enabled || !bundleContext) return;

    try {
      const loggerRef = bundleContext.getServiceReference<LoggerService>('LoggerService');
      if (loggerRef) {
        const logger = bundleContext.getService<LoggerService>(loggerRef);
        setLoggerService(logger || null);

        if (logger) {
          setLogs(logger.getLogs());
        }
      } else {
        setLoggerService(null);
        setLogs([]);
      }

      const taskManagerRef = bundleContext.getServiceReference<TaskManagerService>('TaskManagerService');
      if (taskManagerRef) {
        const taskManager = bundleContext.getService<TaskManagerService>(taskManagerRef);
        setTaskManagerService(taskManager || null);

        if (taskManager) {
          setTasks(taskManager.getAllTasks());
        }
      } else {
        setTaskManagerService(null);
        setTasks([]);
      }
    } catch (err) {
      console.error('Error getting services:', err);
    }
  }, [bundleContext, enabled, refreshTrigger]);

  // Select a bundle
  const selectBundle = (bundle: any) => {
    setSelectedBundle(bundle);
  };

  const startBundle = async (bundle: any) => {
    if (!bundleContext) return;

    try {
      await bundle.start();
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Error starting bundle:', err);
      setError(`Failed to start bundle: ${bundle.getSymbolicName()}`);
    }
  };

  const stopBundle = async (bundle: any) => {
    if (!bundleContext) return;

    try {
      await bundle.stop();
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Error stopping bundle:', err);
      setError(`Failed to stop bundle: ${bundle.getSymbolicName()}`);
    }
  };

  const createTask = () => {
    if (!taskManagerService) return;

    try {
      const task = taskManagerService.createTask(taskName, taskDescription);
      setTasks([...tasks, task]);
      setTaskName('');
      setTaskDescription('');
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task.');
    }
  };

  const updateTaskStatus = (id: string, status: 'pending' | 'in-progress' | 'completed') => {
    if (!taskManagerService) return;

    try {
      taskManagerService.updateTaskStatus(id, status);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task.');
    }
  };

  const deleteTask = (id: string) => {
    if (!taskManagerService) return;

    try {
      taskManagerService.deleteTask(id);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task.');
    }
  };

  if (!enabled) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h4" gutterBottom>
          Bundle System Feature Disabled
        </Typography>
        <Typography variant="body1" paragraph>
          The Bundle System feature is currently disabled. Enable it from the sidebar to explore this feature.
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
          border: `1px solid ${alpha(featureColors.bundleSystem, 0.3)}`,
          backdropFilter: heroStyles.backdropBlur,
          boxShadow: `0 4px 20px rgba(0, 0, 0, 0.3), 0 0 15px ${alpha(featureColors.bundleSystem, 0.2)}`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `linear-gradient(135deg, ${alpha(featureColors.bundleSystem, 0.15)} 0%, ${alpha(featureColors.bundleSystem, 0.07)} 100%)`,
            zIndex: -1,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ color: featureColors.bundleSystem, mr: 2 }}>
            <ExtensionIcon fontSize="large" />
          </Box>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              color: featureColors.bundleSystem,
              textShadow: heroStyles.glowEffect(featureColors.bundleSystem),
            }}
          >
            Bundle System
          </Typography>
        </Box>

        <Typography variant="body1" paragraph>
          Self-contained modules with independent lifecycles and dynamic dependencies. Bundles are the building blocks
          of a Pandino application, allowing for modular architecture and runtime flexibility.
        </Typography>
      </Box>

      {/* Error message */}
      {error && (
        <Alert severity="error" variant="outlined" sx={{ mb: 4 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Bundle System Section */}
      <Grid container spacing={4}>
        {/* Left column - Bundle List */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <ExtensionIcon sx={{ mr: 1 }} />
                Bundle Management
              </Typography>
              <Typography variant="body2" paragraph>
                View and manage bundles in the system. Bundles can be started, stopped, and inspected.
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => setRefreshTrigger((prev) => prev + 1)}
                  size="small"
                >
                  Refresh
                </Button>
              </Box>

              {/* Bundle list */}
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress color="secondary" />
                </Box>
              ) : bundles.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No bundles found.
                </Alert>
              ) : (
                <TableContainer
                  component={Paper}
                  sx={{
                    maxHeight: 300,
                    backgroundColor: alpha(theme.palette.background.paper, 0.6),
                  }}
                >
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>State</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bundles.map((bundle) => {
                        const isSelected = selectedBundle === bundle;
                        const bundleState = bundle.getState();
                        const stateName = getBundleStateName(bundleState);
                        const stateColor = getBundleStateColor(bundleState);
                        const isFragment = bundle.getHeaders().fragmentHost !== undefined;

                        return (
                          <TableRow
                            key={bundle.getBundleId()}
                            sx={{
                              cursor: 'pointer',
                              backgroundColor: isSelected ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                              },
                            }}
                            onClick={() => selectBundle(bundle)}
                          >
                            <TableCell>{bundle.getBundleId()}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {isFragment && (
                                  <Tooltip title="Fragment Bundle">
                                    <LinkIcon fontSize="small" sx={{ mr: 1, color: theme.palette.info.main }} />
                                  </Tooltip>
                                )}
                                {bundle.getSymbolicName()}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={stateName}
                                size="small"
                                sx={{
                                  backgroundColor: alpha(stateColor, 0.2),
                                  color: stateColor,
                                  fontWeight: 'bold',
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex' }}>
                                <Tooltip title="Select Bundle">
                                  <IconButton
                                    size="small"
                                    color={isSelected ? 'primary' : 'default'}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      selectBundle(bundle);
                                    }}
                                  >
                                    <InfoIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>

                                {bundleState !== BUNDLE_STATES.ACTIVE && !isFragment && (
                                  <Tooltip title="Start Bundle">
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startBundle(bundle);
                                      }}
                                    >
                                      <PlayArrowIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}

                                {bundleState === BUNDLE_STATES.ACTIVE && !isFragment && (
                                  <Tooltip title="Stop Bundle">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        stopBundle(bundle);
                                      }}
                                    >
                                      <StopIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* Bundle Concepts */}
          <Accordion sx={{ mb: 4 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Bundle Concepts</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                Bundles are the building blocks of a Pandino application:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <ExtensionIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Self-contained Modules"
                    secondary="Bundles encapsulate code, resources, and dependencies"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TimelineIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Independent Lifecycle"
                    secondary="Bundles can be installed, started, stopped, and uninstalled at runtime"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <LinkIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Fragment Bundles"
                    secondary="Special bundles that attach to a host bundle and contribute resources"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CodeIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Dynamic Dependencies"
                    secondary="Bundles can depend on services from other bundles without direct references"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Right column - Bundle Details and Services */}
        <Grid size={{ xs: 12, md: 7 }}>
          {/* Bundle Details */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Bundle Details
              </Typography>

              {selectedBundle ? (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {selectedBundle.getSymbolicName()} (ID: {selectedBundle.getBundleId()})
                    </Typography>
                    <Paper sx={{ p: 2, backgroundColor: alpha(theme.palette.background.paper, 0.6) }}>
                      <Typography variant="body2" component="div">
                        <strong>Version:</strong> {selectedBundle.getVersion()}
                      </Typography>
                      <Typography variant="body2" component="div">
                        <strong>State:</strong> {getBundleStateName(selectedBundle.getState())}
                      </Typography>
                      <Typography variant="body2" component="div">
                        <strong>Location:</strong> {selectedBundle.getLocation()}
                      </Typography>

                      {selectedBundle.getHeaders().fragmentHost && (
                        <Typography variant="body2" component="div">
                          <strong>Fragment Host:</strong> {selectedBundle.getHeaders().fragmentHost}
                        </Typography>
                      )}
                    </Paper>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Bundle Headers:
                    </Typography>
                    <TableContainer
                      component={Paper}
                      sx={{
                        maxHeight: 200,
                        backgroundColor: alpha(theme.palette.background.paper, 0.6),
                      }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Key</TableCell>
                            <TableCell>Value</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(selectedBundle.getHeaders())
                            .filter(([key]) => key !== 'Bundle-Activator')
                            .map(([key, value]) => (
                              <TableRow key={key}>
                                <TableCell>{key}</TableCell>
                                <TableCell>{String(value)}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Select a bundle from the list to view its details.
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Dynamic Dependencies Demo */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Dynamic Dependencies Demo
              </Typography>
              <Typography variant="body2" paragraph>
                This demonstrates how bundles can depend on services from other bundles. The Task Manager bundle depends
                on the Logger bundle.
              </Typography>

              {taskManagerService ? (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Create a Task:
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" gutterBottom>
                            Task Name:
                          </Typography>
                          <input
                            type="text"
                            value={taskName}
                            onChange={(e) => setTaskName(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px',
                              backgroundColor: alpha(theme.palette.background.paper, 0.6),
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                              borderRadius: '4px',
                              color: theme.palette.text.primary,
                            }}
                          />
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" gutterBottom>
                            Task Description:
                          </Typography>
                          <input
                            type="text"
                            value={taskDescription}
                            onChange={(e) => setTaskDescription(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px',
                              backgroundColor: alpha(theme.palette.background.paper, 0.6),
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                              borderRadius: '4px',
                              color: theme.palette.text.primary,
                            }}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                    <Button
                      variant="contained"
                      onClick={createTask}
                      disabled={!taskName || !taskDescription}
                      sx={{ mt: 1 }}
                    >
                      Create Task
                    </Button>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Tasks:
                    </Typography>
                    {tasks.length === 0 ? (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        No tasks created yet.
                      </Alert>
                    ) : (
                      <TableContainer
                        component={Paper}
                        sx={{
                          maxHeight: 200,
                          backgroundColor: alpha(theme.palette.background.paper, 0.6),
                        }}
                      >
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Name</TableCell>
                              <TableCell>Description</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {tasks.map((task) => (
                              <TableRow key={task.id}>
                                <TableCell>{task.name}</TableCell>
                                <TableCell>{task.description}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={task.status}
                                    size="small"
                                    color={
                                      task.status === 'completed'
                                        ? 'success'
                                        : task.status === 'in-progress'
                                          ? 'warning'
                                          : 'default'
                                    }
                                    variant="outlined"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex' }}>
                                    {task.status !== 'in-progress' && (
                                      <Tooltip title="Start Task">
                                        <IconButton
                                          size="small"
                                          color="warning"
                                          onClick={() => updateTaskStatus(task.id, 'in-progress')}
                                        >
                                          <PlayArrowIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    )}

                                    {task.status !== 'completed' && (
                                      <Tooltip title="Complete Task">
                                        <IconButton
                                          size="small"
                                          color="success"
                                          onClick={() => updateTaskStatus(task.id, 'completed')}
                                        >
                                          <CheckIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    )}

                                    <Tooltip title="Delete Task">
                                      <IconButton size="small" color="error" onClick={() => deleteTask(task.id)}>
                                        <StopIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                </>
              ) : (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Task Manager Service is not available. Make sure the Task Manager Bundle is active.
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Fragment Bundle Demo */}
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Fragment Bundle Demo
              </Typography>
              <Typography variant="body2" paragraph>
                This demonstrates how fragment bundles can extend the functionality of a host bundle. The Logger
                Formatter Fragment extends the Logger Bundle.
              </Typography>

              {loggerService ? (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Logs:
                  </Typography>
                  {logs.length === 0 ? (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      No logs recorded yet.
                    </Alert>
                  ) : (
                    <TableContainer
                      component={Paper}
                      sx={{
                        maxHeight: 200,
                        backgroundColor: alpha(theme.palette.background.paper, 0.6),
                      }}
                    >
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Timestamp</TableCell>
                            <TableCell>Level</TableCell>
                            <TableCell>Message</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {logs.map((log, index) => (
                            <TableRow key={index}>
                              <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                              <TableCell>
                                <Chip
                                  label={log.level}
                                  size="small"
                                  color={log.level === 'info' ? 'success' : log.level === 'warn' ? 'warning' : 'error'}
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>{log.message}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              ) : (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Logger Service is not available. Make sure the Logger Bundle is active.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BundleSystem;
