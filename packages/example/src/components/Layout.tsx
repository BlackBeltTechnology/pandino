import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { Link as RouterLink } from 'react-router-dom';
import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar variant="dense" sx={{ gap: 1 }}>
          <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Pandino Example
          </Typography>
          <Button component={RouterLink} to="/" size="small">
            Home
          </Button>
          <Button component={RouterLink} to="/alpha" size="small">
            Alpha
          </Button>
          <Button component={RouterLink} to="/beta" size="small">
            Beta
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ py: 2, flexGrow: 1 }}>
        {children}
      </Container>
      <Box component="footer" sx={{ textAlign: 'center', py: 1, color: 'text.secondary' }}>
        <Typography variant="caption">Powered by Pandino</Typography>
      </Box>
    </Box>
  );
}
