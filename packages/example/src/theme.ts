import { createTheme, alpha } from '@mui/material/styles';

// ============================================================================
// CENTRALIZED THEME SYSTEM
// ============================================================================

export const colors = {
  primary: {
    main: '#3d7af5', // Vibrant blue
    light: '#6d9df8',
    dark: '#2c5bc2',
  },
  secondary: {
    main: '#555555', // Dark grey
    light: '#777777',
    dark: '#333333',
  },
  success: {
    main: '#2e7d32', // Darker green
  },
  warning: {
    main: '#f9a825', // Muted amber
  },
  error: {
    main: '#d32f2f', // Less bright red
  },
  background: {
    default: '#1e1e1e', // Dark grey
    paper: '#2d2d2d',
    lighter: '#3a3a3a',
    card: 'rgba(45, 45, 45, 0.9)',
  },
  text: {
    primary: '#ffffff',
    secondary: '#b0b0cc',
  },
  common: {
    white: '#ffffff',
    black: '#000000',
  },
  grey: {
    400: '#444444',
    500: '#b0b0cc',
  },
};

export const spacing = {
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '13px',
  },
  borderWidth: {
    thin: '1px',
    medium: '2px',
  },
  fontSize: {
    small: '0.9em',
  },
};

export const effects = {
  opacity: {
    light: 0.1,
    medium: 0.3,
    high: 0.6,
    solid: 0.9,
  },
  shadows: {
    small: (color = colors.common.black) => `0 2px 6px ${alpha(color, 0.3)}`,
    medium: (color = colors.common.black) => `0 4px 20px ${alpha(color, 0.5)}`,
    large: (color = colors.common.black) => `0 8px 25px ${alpha(color, 0.6)}`,
  },
  glows: {
    small: (color = colors.primary.main) => `0 0 4px ${alpha(color, effects.opacity.medium)}`,
    medium: (color = colors.primary.main) => `0 0 10px ${alpha(color, effects.opacity.light)}`,
    large: (color = colors.primary.main) => `0 0 20px ${alpha(color, effects.opacity.high)}`,
  },
  textShadows: {
    small: (color = colors.primary.main) => `0 1px 2px ${alpha(color, 0.3)}`,
    medium: (color = colors.primary.main) => `0 1px 3px ${alpha(color, 0.4)}`,
  },
  gradients: {
    appBar: `linear-gradient(90deg, ${colors.background.paper} 0%, ${colors.background.lighter} 100%)`,
    drawer: `linear-gradient(180deg, ${colors.background.default} 0%, ${colors.background.paper} 100%)`,
    card: `linear-gradient(135deg, rgba(40, 40, 40, 0.9) 0%, rgba(50, 50, 50, 0.9) 100%)`,
    drawerHeader: `linear-gradient(135deg, ${colors.background.paper} 0%, ${colors.background.lighter} 100%)`,
    hero: `linear-gradient(135deg, rgba(30, 30, 30, 0.7) 0%, rgba(45, 45, 45, 0.7) 100%)`,
    grid: `linear-gradient(rgba(30, 30, 30, 0.97), rgba(30, 30, 30, 0.97)),
           linear-gradient(90deg, ${alpha(colors.primary.main, 0.08)} 1px, transparent 1px),
           linear-gradient(0deg, ${alpha(colors.primary.main, 0.08)} 1px, transparent 1px)`,
  },
  blurs: {
    light: '10px',
    medium: '15px',
  },
};

export const typography = {
  fontFamilies: {
    main: '"Roboto", "Helvetica", "Arial", sans-serif',
    code: '"Roboto Mono", monospace',
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semiBold: 600,
    bold: 700,
  },
  letterSpacings: {
    xs: '0.02em',
    sm: '0.03em',
    md: '0.04em',
    lg: '0.05em',
  },
};

export const featureColors = {
  serviceRegistry: colors.primary.main,
  bundleSystem: colors.secondary.main,
  eventSystem: colors.warning.main,
  configAdmin: colors.success.main,
  declarativeServices: colors.error.main,
  reactIntegration: colors.primary.main,
  dynamicDependencies: colors.secondary.main,
};

export const bundleStateColors = {
  ACTIVE: colors.success.main,
  STARTING: colors.warning.main,
  STOPPING: colors.error.main,
  RESOLVED: colors.primary.main,
  INSTALLED: colors.grey[500],
  UNINSTALLED: colors.error.main,
  UNKNOWN: colors.common.white,
};

export const heroStyles = {
  backgroundGradient: effects.gradients.hero,
  glowEffect: effects.glows.large,
  hoverBoxShadow: (color: string) => `${effects.shadows.large()}, ${effects.glows.large(color)}`,
  backdropBlur: effects.blurs.medium,
};

export const codeStyles = {
  backgroundColor: colors.background.card,
  color: colors.primary.main,
  borderRadius: spacing.borderRadius.sm,
  border: `${spacing.borderWidth.thin} solid ${alpha(colors.primary.main, effects.opacity.light)}`,
  fontFamily: typography.fontFamilies.code,
  fontWeight: typography.fontWeights.normal,
  padding: spacing.sm,
  fontSize: spacing.fontSize.small,
  blockPadding: spacing.lg,
};

export const theme = createTheme({
  // ============================================================================
  // PALETTE
  // ============================================================================
  palette: {
    mode: 'dark',
    primary: {
      main: colors.primary.main,
      light: colors.primary.light,
      dark: colors.primary.dark,
      contrastText: colors.common.white,
    },
    secondary: {
      main: colors.secondary.main,
      light: colors.secondary.light,
      dark: colors.secondary.dark,
      contrastText: colors.common.white,
    },
    background: {
      default: colors.background.default,
      paper: colors.background.paper,
    },
    error: {
      main: colors.error.main,
    },
    warning: {
      main: colors.warning.main,
    },
    info: {
      main: colors.primary.main,
    },
    success: {
      main: colors.success.main,
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
    },
  },

  // ============================================================================
  // TYPOGRAPHY
  // ============================================================================
  typography: {
    fontFamily: typography.fontFamilies.main,
    h1: {
      fontWeight: typography.fontWeights.bold,
      letterSpacing: typography.letterSpacings.lg,
      textShadow: effects.textShadows.medium(),
    },
    h2: {
      fontWeight: typography.fontWeights.bold,
      letterSpacing: typography.letterSpacings.lg,
      textShadow: effects.textShadows.small(),
    },
    h3: {
      fontWeight: typography.fontWeights.semiBold,
      letterSpacing: typography.letterSpacings.md,
    },
    h4: {
      fontWeight: typography.fontWeights.semiBold,
      letterSpacing: typography.letterSpacings.sm,
    },
    h5: {
      fontWeight: typography.fontWeights.medium,
      letterSpacing: typography.letterSpacings.xs,
    },
    h6: {
      fontWeight: typography.fontWeights.medium,
      letterSpacing: typography.letterSpacings.xs,
    },
    button: {
      fontWeight: typography.fontWeights.semiBold,
      letterSpacing: typography.letterSpacings.lg,
    },
  },

  // ============================================================================
  // COMPONENT OVERRIDES
  // ============================================================================
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: colors.background.default,
          backgroundImage: effects.gradients.grid,
          backgroundSize: '100%, 30px 30px, 30px 30px',
          backgroundPosition: '0 0, 0 0, 0 0',
          backgroundAttachment: 'fixed',
        },
        // Code block styling
        pre: {
          backgroundColor: codeStyles.backgroundColor,
          color: codeStyles.color,
          borderRadius: codeStyles.borderRadius,
          border: codeStyles.border,
          fontFamily: codeStyles.fontFamily,
          fontWeight: codeStyles.fontWeight,
          padding: codeStyles.blockPadding,
          fontSize: codeStyles.fontSize,
          overflow: 'auto',
          margin: 0,
        },
        code: {
          backgroundColor: codeStyles.backgroundColor,
          color: codeStyles.color,
          borderRadius: codeStyles.borderRadius,
          border: codeStyles.border,
          fontFamily: codeStyles.fontFamily,
          fontWeight: codeStyles.fontWeight,
          padding: codeStyles.padding,
          fontSize: codeStyles.fontSize,
        },
        // Custom classes for drawer components
        '.drawer-header': {
          padding: spacing.lg,
          backgroundImage: effects.gradients.drawerHeader,
          boxShadow: `${effects.shadows.medium()}, ${effects.glows.medium()}`,
        },
        '.drawer-title': {
          fontWeight: typography.fontWeights.bold,
          letterSpacing: typography.letterSpacings.lg,
          textShadow: effects.textShadows.medium(),
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: effects.gradients.appBar,
          boxShadow: `${effects.shadows.small()}, ${effects.glows.small()}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: effects.gradients.drawer,
          borderRight: `${spacing.borderWidth.thin} solid ${alpha(colors.primary.main, effects.opacity.light)}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: effects.gradients.card,
          backdropFilter: `blur(${effects.blurs.light})`,
          border: `${spacing.borderWidth.thin} solid ${alpha(colors.primary.main, effects.opacity.light)}`,
          boxShadow: `${effects.shadows.medium()}, ${effects.glows.medium()}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: spacing.borderRadius.sm,
          textTransform: 'none',
          padding: `${spacing.md} ${spacing.lg}`,
        },
        contained: {
          boxShadow: `${effects.shadows.small()}, ${effects.glows.small()}`,
          '&:hover': {
            boxShadow: `${effects.shadows.medium()}, ${effects.glows.small(colors.primary.main)}`,
          },
        },
        outlined: {
          borderWidth: spacing.borderWidth.medium,
          '&:hover': {
            borderWidth: spacing.borderWidth.medium,
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 42,
          height: 26,
          padding: 0,
        },
        switchBase: {
          padding: 1,
          '&.Mui-checked': {
            '& + .MuiSwitch-track': {
              backgroundColor: colors.primary.main,
              opacity: effects.opacity.solid,
            },
          },
        },
        thumb: {
          width: 24,
          height: 24,
        },
        track: {
          borderRadius: spacing.borderRadius.lg,
          backgroundColor: colors.grey[400],
        },
      },
    },
  },
});

export default theme;
