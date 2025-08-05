import React, { Suspense } from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import theme from './theme';
import Layout from './components/Layout';

const Home = React.lazy(() => import('./pages/Home'));
const ServiceRegistry = React.lazy(() => import('./pages/ServiceRegistry'));
const BundleSystem = React.lazy(() => import('./pages/BundleSystem'));
const EventSystem = React.lazy(() => import('./pages/EventSystem'));
const ConfigAdmin = React.lazy(() => import('./pages/ConfigAdmin'));
const DeclarativeServices = React.lazy(() => import('./pages/DeclarativeServices'));
const ReactIntegration = React.lazy(() => import('./pages/ReactIntegration'));
const DynamicDependencies = React.lazy(() => import('./pages/DynamicDependencies'));

const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
    <CircularProgress />
  </Box>
);

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Layout>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/service-registry" element={<ServiceRegistry />} />
              <Route path="/bundle-system" element={<BundleSystem />} />
              <Route path="/event-system" element={<EventSystem />} />
              <Route path="/config-admin" element={<ConfigAdmin />} />
              <Route path="/declarative-services" element={<DeclarativeServices />} />
              <Route path="/react-integration" element={<ReactIntegration />} />
              <Route path="/dynamic-dependencies" element={<DynamicDependencies />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
