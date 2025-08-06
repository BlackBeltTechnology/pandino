import React, { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { alpha, useTheme } from '@mui/material/styles';
import HistoryIcon from '@mui/icons-material/History';
import RefreshIcon from '@mui/icons-material/Refresh';
import { usePandinoContext } from '@pandino/react-hooks';
import { ConfigConsumerService } from '../bundles/config-consumer-bundle';

const ConfigHistoryDisplay: React.FC = () => {
  const theme = useTheme();
  const { bundleContext } = usePandinoContext();
  const [configConsumerService, setConfigConsumerService] = useState<ConfigConsumerService | null>(null);
  const [configHistory, setConfigHistory] = useState<
    Array<{
      timestamp: number;
      pid: string;
      type: 'UPDATED' | 'DELETED';
    }>
  >([]);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Get services when the component mounts or bundleContext changes
  useEffect(() => {
    if (!bundleContext) return;

    try {
      setLoading(true);

      // Get ConfigConsumerService
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
  }, [bundleContext]);

  // Fetch configuration history when service is available or refreshTrigger changes
  useEffect(() => {
    if (!configConsumerService) return;

    const fetchHistory = () => {
      try {
        setLoading(true);

        const history = configConsumerService.getConfigurationHistory();
        setConfigHistory(history);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching configuration history:', err);
        setError('Failed to fetch configuration history.');
        setLoading(false);
      }
    };

    fetchHistory();
  }, [configConsumerService, refreshTrigger]);

  return (
    <Card>
      <CardContent>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <HistoryIcon sx={{ mr: 1 }} />
            Configuration History Display
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
          This is a simple component that displays the configuration history directly from the ConfigConsumerService.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Loading configuration history...
          </Alert>
        ) : configHistory.length === 0 ? (
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
  );
};

export default ConfigHistoryDisplay;
