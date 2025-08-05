import React, { useState, useEffect } from 'react';
import ApiIcon from '@mui/icons-material/Api';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SearchIcon from '@mui/icons-material/Search';
import InfoIcon from '@mui/icons-material/Info';
import CheckIcon from '@mui/icons-material/Check';
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useFeatureToggle } from '../contexts/FeatureToggleContext';
import { featureColors, heroStyles } from '../theme';
import { usePandinoContext } from '@pandino/react-hooks';
import { GreetingService } from '../bundles/greeting-service-bundle';
import CodeBlock from '../components/CodeBlock';

const ServiceRegistry: React.FC = () => {
  const theme = useTheme();
  const { isFeatureEnabled } = useFeatureToggle();
  const { bundleContext } = usePandinoContext();
  const [serviceReferences, setServiceReferences] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [serviceInstance, setServiceInstance] = useState<GreetingService | null>(null);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [name, setName] = useState<string>('Visitor');
  const [greeting, setGreeting] = useState<string>('');
  const [serviceType, setServiceType] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const enabled = isFeatureEnabled('serviceRegistry');

  useEffect(() => {
    if (!enabled || !bundleContext) return;

    try {
      setLoading(true);
      const refs = bundleContext.getServiceReferences<GreetingService>('GreetingService', null);
      setServiceReferences(refs || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching service references:', err);
      setError('Failed to fetch service references. Make sure the service bundle is loaded.');
      setLoading(false);
    }
  }, [bundleContext, enabled]);

  const applyFilter = () => {
    if (!enabled || !bundleContext) return;

    try {
      setLoading(true);
      const refs = bundleContext.getServiceReferences<GreetingService>('GreetingService', filterQuery || null);
      setServiceReferences(refs || []);
      setSelectedService(null);
      setServiceInstance(null);
      setLoading(false);
    } catch (err) {
      console.error('Error applying filter:', err);
      setError('Invalid filter query. Please check the syntax.');
      setLoading(false);
    }
  };

  const selectService = (serviceRef: any) => {
    if (!bundleContext) return;

    try {
      const service = bundleContext.getService<GreetingService>(serviceRef);
      setSelectedService(serviceRef);
      setServiceInstance(service);

      if (service) {
        setGreeting(service.greet(name));
        setServiceType(service.getServiceType());
      }
    } catch (err) {
      console.error('Error getting service:', err);
      setError('Failed to get service instance.');
    }
  };

  useEffect(() => {
    if (serviceInstance) {
      setGreeting(serviceInstance.greet(name));
    }
  }, [name, serviceInstance]);

  const getRandomGreeting = () => {
    if (serviceInstance) {
      setGreeting(serviceInstance.getRandomGreeting(name));
    }
  };

  const resetFilter = () => {
    setFilterQuery('');
    if (bundleContext) {
      setLoading(true);
      const refs = bundleContext.getServiceReferences<GreetingService>('GreetingService', null);
      setServiceReferences(refs || []);
      setLoading(false);
    }
  };

  if (!enabled) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h4" gutterBottom>
          Service Registry Feature Disabled
        </Typography>
        <Typography variant="body1" paragraph>
          The Service Registry feature is currently disabled. Enable it from the sidebar to explore this feature.
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
          border: `1px solid ${alpha(featureColors.serviceRegistry, 0.3)}`,
          backdropFilter: heroStyles.backdropBlur,
          boxShadow: `0 4px 20px rgba(0, 0, 0, 0.3), 0 0 15px ${alpha(featureColors.serviceRegistry, 0.2)}`,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `linear-gradient(135deg, ${alpha(featureColors.serviceRegistry, 0.15)} 0%, ${alpha(featureColors.serviceRegistry, 0.07)} 100%)`,
            zIndex: -1,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ color: featureColors.serviceRegistry, mr: 2 }}>
            <ApiIcon fontSize="large" />
          </Box>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              color: featureColors.serviceRegistry,
              textShadow: heroStyles.glowEffect(featureColors.serviceRegistry),
            }}
          >
            Service Registry
          </Typography>
        </Box>

        <Typography variant="body1" paragraph>
          Dynamic service discovery and LDAP filtering for loosely coupled components. The Service Registry is the core
          of Pandino, allowing services to be registered, discovered, and used without direct dependencies.
        </Typography>
      </Box>

      {/* Error message */}
      {error && (
        <Alert severity="error" variant="outlined" sx={{ mb: 4 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Service Discovery Section */}
      <Grid container spacing={4}>
        {/* Left column - Service References */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <SearchIcon sx={{ mr: 1 }} />
                Service Discovery
              </Typography>
              <Typography variant="body2" paragraph>
                Discover services by interface name and filter by properties using LDAP syntax.
              </Typography>

              {/* Filter input */}
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="LDAP Filter"
                  variant="outlined"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="e.g. (greeting.type=casual)"
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" startIcon={<FilterAltIcon />} onClick={applyFilter} disabled={loading}>
                    Apply Filter
                  </Button>
                  <Button variant="outlined" onClick={resetFilter} disabled={loading}>
                    Reset
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Filter examples */}
              <Typography variant="subtitle2" gutterBottom>
                Filter Examples:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip
                  label="(greeting.type=casual)"
                  onClick={() => setFilterQuery('(greeting.type=casual)')}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label="(greeting.style=professional)"
                  onClick={() => setFilterQuery('(greeting.style=professional)')}
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label="(service.ranking>=100)"
                  onClick={() => setFilterQuery('(service.ranking>=100)')}
                  color="primary"
                  variant="outlined"
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Service references list */}
              <Typography variant="subtitle1" gutterBottom>
                Available Services:
              </Typography>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress color="secondary" />
                </Box>
              ) : serviceReferences.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No services found matching the filter criteria.
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
                        <TableCell>Type</TableCell>
                        <TableCell>Style</TableCell>
                        <TableCell>Ranking</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {serviceReferences.map((ref, index) => {
                        const isSelected = selectedService === ref;
                        const properties = ref.getProperties();

                        return (
                          <TableRow
                            key={index}
                            sx={{
                              cursor: 'pointer',
                              backgroundColor: isSelected ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                              },
                            }}
                            onClick={() => selectService(ref)}
                          >
                            <TableCell>{properties['greeting.type']}</TableCell>
                            <TableCell>{properties['greeting.style']}</TableCell>
                            <TableCell>{properties['service.ranking']}</TableCell>
                            <TableCell>
                              <Tooltip title="Select Service">
                                <IconButton
                                  size="small"
                                  color={isSelected ? 'primary' : 'default'}
                                  onClick={() => selectService(ref)}
                                >
                                  {isSelected ? <CheckIcon /> : <InfoIcon />}
                                </IconButton>
                              </Tooltip>
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

          {/* LDAP Filter Explanation */}
          <Accordion sx={{ mb: 4 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">LDAP Filter Syntax</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                LDAP filters allow you to query services based on their properties:
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Filter</TableCell>
                      <TableCell>Matches</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <code>(greeting.type=casual)</code>
                      </TableCell>
                      <TableCell>Casual greeting services</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <code>(service.ranking&gt;=100)</code>
                      </TableCell>
                      <TableCell>High-priority services</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <code>(&(greeting.type=formal)(service.ranking&gt;=50))</code>
                      </TableCell>
                      <TableCell>Formal services with ranking ≥ 50</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <code>(|(greeting.type=casual)(greeting.type=standard))</code>
                      </TableCell>
                      <TableCell>Casual OR standard services</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Right column - Service Usage */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Service Usage
              </Typography>
              <Typography variant="body2" paragraph>
                Once a service is discovered, it can be used without knowing its implementation details.
              </Typography>

              {selectedService ? (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Selected Service:
                    </Typography>
                    <Paper sx={{ p: 2, backgroundColor: alpha(theme.palette.background.paper, 0.6) }}>
                      <Typography variant="body2" component="div">
                        <strong>Type:</strong> {selectedService.getProperties()['greeting.type']}
                      </Typography>
                      <Typography variant="body2" component="div">
                        <strong>Style:</strong> {selectedService.getProperties()['greeting.style']}
                      </Typography>
                      <Typography variant="body2" component="div">
                        <strong>Ranking:</strong> {selectedService.getProperties()['service.ranking']}
                      </Typography>
                      <Typography variant="body2" component="div">
                        <strong>Description:</strong> {selectedService.getProperties()['service.description']}
                      </Typography>
                    </Paper>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Try the Service:
                    </Typography>
                    <TextField
                      fullWidth
                      label="Your Name"
                      variant="outlined"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      sx={{ mb: 2 }}
                    />
                    <Button variant="contained" onClick={getRandomGreeting} sx={{ mb: 2 }}>
                      Get Random Greeting
                    </Button>
                    <Paper
                      sx={{
                        p: 3,
                        mt: 2,
                        backgroundColor: alpha(theme.palette.background.paper, 0.6),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        borderRadius: 2,
                        minHeight: '80px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 'normal',
                          textAlign: 'center',
                          color:
                            serviceType === 'casual'
                              ? theme.palette.warning.main
                              : serviceType === 'formal'
                                ? theme.palette.info.main
                                : theme.palette.primary.main,
                        }}
                      >
                        {greeting || "Click 'Get Random Greeting' to see a greeting"}
                      </Typography>
                    </Paper>
                  </Box>
                </>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Select a service from the list to use it.
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Code Example */}
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Code Example
              </Typography>
              <Typography variant="body2" paragraph>
                This is how you would discover and use a service in your code:
              </Typography>
              <Box>
                <CodeBlock
                  code={`// Get service references with LDAP filtering
const refs = context.getServiceReferences<GreetingService>(
  'GreetingService',
  '(greeting.type=casual)'
);

// Get the highest-ranked service
if (refs && refs.length > 0) {
  const service = context.getService(refs[0]);

  // Use the service without knowing its implementation
  console.log(service.greet('World'));
}`}
                  language="typescript"
                  showLineNumbers={true}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ServiceRegistry;
