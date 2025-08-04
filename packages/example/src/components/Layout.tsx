import React, { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Container,
  Switch,
  FormControlLabel,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Api as ApiIcon,
  Extension as ExtensionIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Code as CodeIcon,
  ViewModule as ViewModuleIcon,
  ToggleOn as ToggleOnIcon,
} from '@mui/icons-material';
import { useFeatureToggle, Feature, featureDescriptions } from '../contexts/FeatureToggleContext';
import { featureColors } from '../theme';

const navItems = [
  { text: 'Home', icon: <HomeIcon />, path: '/' },
  { text: 'Service Registry', icon: <ApiIcon />, path: '/service-registry', feature: 'serviceRegistry' as Feature },
  { text: 'Bundle System', icon: <ExtensionIcon />, path: '/bundle-system', feature: 'bundleSystem' as Feature },
  { text: 'Event System', icon: <NotificationsIcon />, path: '/event-system', feature: 'eventSystem' as Feature },
  { text: 'Config Admin', icon: <SettingsIcon />, path: '/config-admin', feature: 'configAdmin' as Feature },
  {
    text: 'Declarative Services',
    icon: <CodeIcon />,
    path: '/declarative-services',
    feature: 'declarativeServices' as Feature,
  },
  {
    text: 'React Integration',
    icon: <ViewModuleIcon />,
    path: '/react-integration',
    feature: 'reactIntegration' as Feature,
  },
  {
    text: 'Dynamic Dependencies',
    icon: <ExtensionIcon />,
    path: '/dynamic-dependencies',
    feature: 'dynamicDependencies' as Feature,
  },
];

const drawerWidth = 280;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { enabledFeatures, toggleFeature } = useFeatureToggle();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box className="drawer-header">
        <Typography variant="h6" component="div" className="drawer-title">
          PANDINO SHOWCASE
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          OSGi-Style Framework for TypeScript
        </Typography>
      </Box>

      <List sx={{ flexGrow: 1, pt: 0 }}>
        {navItems.map((item) => {
          const isFeatureRoute = !!item.feature;
          const isFeatureEnabled = isFeatureRoute ? enabledFeatures[item.feature] : true;
          const isActive = location.pathname === item.path;

          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={RouterLink}
                to={isFeatureEnabled ? item.path : '#'}
                disabled={isFeatureRoute && !isFeatureEnabled}
                sx={{
                  py: 1.5,
                  ...(isActive && {
                    backgroundColor: alpha(
                      item.feature ? featureColors[item.feature] : theme.palette.primary.main,
                      0.15,
                    ),
                    borderLeft: `4px solid ${item.feature ? featureColors[item.feature] : theme.palette.primary.main}`,
                    '&:hover': {
                      backgroundColor: alpha(
                        item.feature ? featureColors[item.feature] : theme.palette.primary.main,
                        0.25,
                      ),
                    },
                  }),
                  ...(!isFeatureEnabled &&
                    isFeatureRoute && {
                      opacity: 0.5,
                    }),
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive
                      ? item.feature
                        ? featureColors[item.feature]
                        : theme.palette.primary.main
                      : 'inherit',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    '& .MuiListItemText-primary': {
                      color: isActive
                        ? item.feature
                          ? featureColors[item.feature]
                          : theme.palette.primary.main
                        : 'inherit',
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ my: 1 }} />

      <Box sx={{ p: 2 }}>
        <Typography
          variant="subtitle2"
          gutterBottom
          sx={{
            color: theme.palette.text.primary,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}
        >
          <ToggleOnIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
          Feature Toggles
        </Typography>

        <List dense>
          {Object.entries(featureDescriptions).map(([feature, description]) => (
            <ListItem key={feature} disablePadding>
              <Tooltip title={description} placement="left" arrow>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={enabledFeatures[feature as Feature]}
                      onChange={() => toggleFeature(feature as Feature)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: featureColors[feature as Feature],
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: featureColors[feature as Feature],
                        },
                      }}
                    />
                  }
                  label={
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '180px',
                        color: enabledFeatures[feature as Feature] ? featureColors[feature as Feature] : 'inherit',
                        fontWeight: enabledFeatures[feature as Feature] ? 500 : 400,
                      }}
                    >
                      {feature.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                    </Typography>
                  }
                  sx={{ ml: 0, mr: 0 }}
                />
              </Tooltip>
            </ListItem>
          ))}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {navItems.find((item) => item.path === location.pathname)?.text || 'Pandino Showcase'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          pt: { xs: 8, sm: 10 },
        }}
      >
        <Container maxWidth="lg">{children}</Container>
      </Box>
    </Box>
  );
};

export default Layout;
