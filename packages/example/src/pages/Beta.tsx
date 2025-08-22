import { useState } from 'react';
import { useService } from '@pandino/react-hooks';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

// Shape of CounterService methods we use
interface CounterService {
  increment: () => number;
  decrement: () => number;
  getCount: () => number;
}

export default function BetaPage() {
  const { service, loading, error } = useService<CounterService>('CounterService');
  const [count, setCount] = useState<number | null>(null);

  const onInc = () => {
    if (!service) return;
    setCount(service.increment());
  };
  const onDec = () => {
    if (!service) return;
    setCount(service.decrement());
  };
  const onSync = () => {
    if (!service) return;
    setCount(service.getCount());
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Beta: CounterService
      </Typography>
      {loading && <Typography variant="body2">Loading service…</Typography>}
      {error && (
        <Typography color="error" variant="body2">
          {String(error)}
        </Typography>
      )}
      {!loading && !service && <Typography variant="body2">Service not available.</Typography>}
      <Stack direction="row" spacing={1} alignItems="center">
        <Button variant="outlined" size="small" onClick={onDec} disabled={!service}>
          −
        </Button>
        <Typography variant="body1" sx={{ minWidth: 40, textAlign: 'center' }}>
          {count ?? (service ? service.getCount() : '—')}
        </Typography>
        <Button variant="outlined" size="small" onClick={onInc} disabled={!service}>
          ＋
        </Button>
        <Button variant="text" size="small" onClick={onSync} disabled={!service}>
          sync
        </Button>
      </Stack>
    </Paper>
  );
}
