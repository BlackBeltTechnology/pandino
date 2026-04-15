import { useState } from 'react';
import { useService } from '@pandino/react-hooks';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

// Shape of the WelcomeService used via DI
type WelcomeService = {
  sayHello: (name: string) => string;
};

export default function AlphaPage() {
  const [name, setName] = useState('World');
  const [message, setMessage] = useState('');
  const { service, loading, error } = useService<WelcomeService>('WelcomeService');

  const handleGreet = () => {
    if (service) {
      setMessage(service.sayHello(name));
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Alpha: WelcomeService
      </Typography>
      {loading && <Typography variant="body2">Loading service…</Typography>}
      {error && (
        <Typography color="error" variant="body2">
          {String(error)}
        </Typography>
      )}
      {!loading && !service && <Typography variant="body2">Service not available.</Typography>}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: 'center' }}>
        <TextField
          size="small"
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ width: { xs: '100%', sm: 200 } }}
        />
        <Button variant="contained" size="small" onClick={handleGreet} disabled={!service}>
          Say hello
        </Button>
      </Stack>
      {message && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1">{message}</Typography>
        </Box>
      )}
    </Paper>
  );
}
