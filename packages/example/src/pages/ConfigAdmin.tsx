import React, { useState, useEffect } from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { alpha, useTheme } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
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
import CircularProgress from '@mui/material/CircularProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useFeatureToggle } from '../contexts/FeatureToggleContext';
import { usePandinoContext } from '@pandino/react-hooks';
import { ConfigManagerService } from '../bundles/config-manager-bundle';
import { ConfigConsumerService } from '../bundles/config-consumer-bundle';
import { featureColors, heroStyles } from '../theme';

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
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ConfigAdmin: React.FC = () => {
  const theme = useTheme();
  const { isFeatureEnabled } = useFeatureToggle();
  const { bundleContext } = usePandinoContext();
  const [configManagerService, setConfigManagerService] = useState<ConfigManagerService | null>(null);
  const [configConsumerService, setConfigConsumerService] = useState<ConfigConsumerService | null>(null);
  const [configurations, setConfigurations] = useState<Record<string, any>[]>([]);
  const [configHistory, setConfigHistory] = useState<
    Array<{
      timestamp: number;
      pid: string;
      type: 'UPDATED' | 'DELETED';
    }>
  >([]);
  const [selectedConfig, setSelectedConfig] = useState<Record<string, any> | null>(null);
  const [editedConfig, setEditedConfig] = useState<Record<string, any> | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);

  const enabled = isFeatureEnabled('configAdmin');

  useEffect(() => {
    if (!enabled || !bundleContext) return;

    try {
      setLoading(true);

      const managerRef = bundleContext.getServiceReference<ConfigManagerService>('ConfigManagerService');
      if (managerRef) {
        const manager = bundleContext.getService<ConfigManagerService>(managerRef);
        setConfigManagerService(manager || null);
      } else {
        setConfigManagerService(null);
      }

      const consumerRef = bundleContext.getServiceReference<ConfigConsumerService>('ConfigConsumerService');
      if (consumerRef) {
        const consumer = bundleContext.getService<ConfigConsumerService>(consumerRef);
        setConfigConsumerService(consumer || null);
      } else {
        setConfigConsumerService(null);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error getting services:', err);
      setError('Failed to get configuration services. Make sure the configuration bundles are loaded.');
      setLoading(false);
    }
  }, [bundleContext, enabled]);

  useEffect(() => {
    if (!configManagerService || !configConsumerService) return;

    const fetchConfigurations = async () => {
      try {
        setLoading(true);

        const configs = await configManagerService.getAllConfigurations();
        setConfigurations(configs);

        const history = configConsumerService.getConfigurationHistory();
        console.log(`[DEBUG_LOG] ConfigAdmin component received history with ${history.length} items:`, history);
        setConfigHistory(history);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching configurations:', err);
        setError('Failed to fetch configurations.');
        setLoading(false);
      }
    };

    fetchConfigurations();
  }, [configManagerService, configConsumerService, refreshTrigger]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const selectConfiguration = (config: Record<string, any>) => {
    setSelectedConfig(config);
    setEditedConfig(null);
    setIsEditing(false);
  };

  const startEditing = () => {
    if (!selectedConfig) return;

    setEditedConfig({ ...selectedConfig });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditedConfig(null);
    setIsEditing(false);
  };

  const saveConfiguration = async () => {
    if (!configManagerService || !editedConfig) return;

    try {
      const pid = editedConfig.pid;
      const properties = { ...editedConfig };
      delete properties.pid;

      await configManagerService.updateConfiguration(pid, properties);

      setSelectedConfig({ ...editedConfig });
      setIsEditing(false);
      setEditedConfig(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Error saving configuration:', err);
      setError('Failed to save configuration.');
    }
  };

  const deleteConfiguration = async (pid: string) => {
    if (!configManagerService) return;

    try {
      await configManagerService.deleteConfiguration(pid);

      if (selectedConfig?.pid === pid) {
        setSelectedConfig(null);
        setEditedConfig(null);
        setIsEditing(false);
      }

      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error('Error deleting configuration:', err);
      setError('Failed to delete configuration.');
    }
  };

  if (!enabled) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h4" gutterBottom>
          Configuration Admin Feature Disabled
        </Typography>
        <Typography variant="body1" paragraph>
          The Configuration Admin feature is currently disabled. Enable it from the sidebar to explore this feature.
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
          border: `1px solid ${alpha(featureColors.configAdmin, 0.3)}`,
          backdropFilter: heroStyles.backdropBlur,
          boxShadow: `0 4px 20px rgba(0, 0, 0, 0.3), 0 0 15px ${alpha(featureColors.configAdmin, 0.2)}`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `linear-gradient(135deg, ${alpha(featureColors.configAdmin, 0.15)} 0%, ${alpha(featureColors.configAdmin, 0.07)} 100%)`,
            zIndex: -1,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ color: featureColors.configAdmin, mr: 2 }}>
            <SettingsIcon fontSize="large" />
          </Box>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              color: featureColors.configAdmin,
              textShadow: heroStyles.glowEffect(featureColors.configAdmin),
            }}
          >
            Configuration Admin
          </Typography>
        </Box>

        <Typography variant="body1" paragraph>
          Runtime configuration updates without application restarts. The Configuration Admin service allows for dynamic
          configuration of services and components, enabling flexible and adaptable applications.
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
      ) : !configManagerService || !configConsumerService ? (
        <Alert severity="warning" sx={{ mb: 4 }}>
          Configuration services are not available. Make sure the configuration bundles are loaded and active.
        </Alert>
      ) : (
        <Grid container spacing={4}>
          {/* Left column - Configuration List */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SettingsIcon sx={{ mr: 1 }} />
                    Configurations
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={() => setRefreshTrigger((prev) => prev + 1)}
                    size="small"
                  >
                    Refresh
                  </Button>
                </Typography>
                <Typography variant="body2" paragraph>
                  View and manage configurations. Select a configuration to view its details and make changes.
                </Typography>

                {/* Configuration list */}
                {configurations.length === 0 ? (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No configurations found.
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
                          <TableCell>PID</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {configurations.map((config) => {
                          const isSelected = selectedConfig?.pid === config.pid;

                          return (
                            <TableRow
                              key={config.pid}
                              sx={{
                                cursor: 'pointer',
                                backgroundColor: isSelected ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                },
                              }}
                              onClick={() => selectConfiguration(config)}
                            >
                              <TableCell>{config.pid}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex' }}>
                                  <Tooltip title="Delete Configuration">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteConfiguration(config.pid);
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
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

            {/* Configuration History */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography
                  variant="h5"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <HistoryIcon sx={{ mr: 1 }} />
                    Configuration History
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={() => setRefreshTrigger((prev) => prev + 1)}
                    size="small"
                  >
                    Refresh
                  </Button>
                </Typography>
                <Typography variant="body2" paragraph>
                  View the history of configuration changes. Click the refresh button to update the history after making
                  changes.
                </Typography>

                {/* History list */}
                {configHistory.length === 0 ? (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No configuration changes recorded.
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
                          <TableCell>Timestamp</TableCell>
                          <TableCell>PID</TableCell>
                          <TableCell>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {configHistory.map((event, index) => (
                          <TableRow key={index}>
                            <TableCell>{new Date(event.timestamp).toLocaleTimeString()}</TableCell>
                            <TableCell>{event.pid}</TableCell>
                            <TableCell>
                              <Chip
                                label={event.type}
                                size="small"
                                color={event.type === 'UPDATED' ? 'success' : 'error'}
                                variant="outlined"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right column - Configuration Details */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Configuration Details
                </Typography>

                {selectedConfig ? (
                  <>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        {selectedConfig.pid}
                      </Typography>

                      {!isEditing ? (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Button variant="contained" startIcon={<EditIcon />} onClick={startEditing}>
                              Edit
                            </Button>
                          </Box>

                          <TableContainer
                            component={Paper}
                            sx={{
                              backgroundColor: alpha(theme.palette.background.paper, 0.6),
                            }}
                          >
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Property</TableCell>
                                  <TableCell>Value</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {Object.entries(selectedConfig)
                                  .filter(([key]) => key !== 'pid')
                                  .map(([key, value]) => (
                                    <TableRow key={key}>
                                      <TableCell>{key}</TableCell>
                                      <TableCell>
                                        {typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </>
                      ) : (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
                            <Button variant="outlined" onClick={cancelEditing}>
                              Cancel
                            </Button>
                            <Button
                              variant="contained"
                              startIcon={<SaveIcon />}
                              onClick={saveConfiguration}
                              color="success"
                            >
                              Save
                            </Button>
                          </Box>

                          <Box sx={{ mb: 3 }}>
                            {editedConfig &&
                              Object.entries(editedConfig)
                                .filter(([key]) => key !== 'pid')
                                .map(([key, value]) => {
                                  if (typeof value === 'boolean') {
                                    return (
                                      <Box key={key} sx={{ mb: 2 }}>
                                        <FormControlLabel
                                          control={
                                            <Switch
                                              checked={value as boolean}
                                              onChange={(e) => {
                                                if (editedConfig) {
                                                  setEditedConfig({
                                                    ...editedConfig,
                                                    [key]: e.target.checked,
                                                  });
                                                }
                                              }}
                                            />
                                          }
                                          label={key}
                                        />
                                      </Box>
                                    );
                                  } else if (typeof value === 'number') {
                                    return (
                                      <Box key={key} sx={{ mb: 2 }}>
                                        <TextField
                                          fullWidth
                                          label={key}
                                          type="number"
                                          value={value}
                                          onChange={(e) => {
                                            if (editedConfig) {
                                              setEditedConfig({
                                                ...editedConfig,
                                                [key]: Number(e.target.value),
                                              });
                                            }
                                          }}
                                        />
                                      </Box>
                                    );
                                  } else {
                                    return (
                                      <Box key={key} sx={{ mb: 2 }}>
                                        <TextField
                                          fullWidth
                                          label={key}
                                          value={value as string}
                                          onChange={(e) => {
                                            if (editedConfig) {
                                              setEditedConfig({
                                                ...editedConfig,
                                                [key]: e.target.value,
                                              });
                                            }
                                          }}
                                        />
                                      </Box>
                                    );
                                  }
                                })}
                          </Box>
                        </>
                      )}
                    </Box>
                  </>
                ) : (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Select a configuration from the list to view its details.
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Configuration Consumers */}
            <Card>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Configuration Consumers
                </Typography>
                <Typography variant="body2" paragraph>
                  View how services consume and react to configuration changes.
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
                        color: featureColors.configAdmin,
                        fontWeight: 'bold',
                      },
                      '& .MuiTabs-indicator': {
                        backgroundColor: featureColors.configAdmin,
                      },
                    }}
                  >
                    <Tab label="UI Settings" />
                    <Tab label="Database Settings" />
                    <Tab label="Logging Settings" />
                    <Tab label="Email Settings" />
                  </Tabs>
                </Box>

                <TabPanel value={tabValue} index={0}>
                  <Typography variant="subtitle1" gutterBottom>
                    Current UI Settings:
                  </Typography>
                  <TableContainer
                    component={Paper}
                    sx={{
                      backgroundColor: alpha(theme.palette.background.paper, 0.6),
                    }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Property</TableCell>
                          <TableCell>Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(configConsumerService.getUISettings()).map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell>{key}</TableCell>
                            <TableCell>
                              {typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                  <Typography variant="subtitle1" gutterBottom>
                    Current Database Settings:
                  </Typography>
                  <TableContainer
                    component={Paper}
                    sx={{
                      backgroundColor: alpha(theme.palette.background.paper, 0.6),
                    }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Property</TableCell>
                          <TableCell>Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(configConsumerService.getDatabaseSettings()).map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell>{key}</TableCell>
                            <TableCell>
                              {typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                  <Typography variant="subtitle1" gutterBottom>
                    Current Logging Settings:
                  </Typography>
                  <TableContainer
                    component={Paper}
                    sx={{
                      backgroundColor: alpha(theme.palette.background.paper, 0.6),
                    }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Property</TableCell>
                          <TableCell>Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(configConsumerService.getLoggingSettings()).map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell>{key}</TableCell>
                            <TableCell>
                              {typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </TabPanel>

                <TabPanel value={tabValue} index={3}>
                  <Typography variant="subtitle1" gutterBottom>
                    Current Email Settings:
                  </Typography>
                  <TableContainer
                    component={Paper}
                    sx={{
                      backgroundColor: alpha(theme.palette.background.paper, 0.6),
                    }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Property</TableCell>
                          <TableCell>Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(configConsumerService.getEmailSettings()).map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell>{key}</TableCell>
                            <TableCell>
                              {typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </TabPanel>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default ConfigAdmin;
