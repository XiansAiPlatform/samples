import { createTheme } from '@mui/material/styles';

// Enhanced Scandinavian design principles: extreme simplicity, generous white space, subtle typography hierarchy
// Color palette inspired by Nordic nature: crisp whites, soft grays, muted earth tones

// Central Color Palette - All colors used throughout the application
export const colorPalette = {
  // Core Nordic palette
  nordic: {
    storm: '#2E3440',      // Primary dark
    charcoal: '#242933',   // Primary dark variant
    slate: '#4C566A',      // Primary light
    sky: '#5E81AC',        // Secondary blue
    lightSky: '#81A1C1',   // Secondary light
    darkSky: '#4A6491',    // Secondary dark
    ice: '#88C0D0',        // Info blue
    lightIce: '#9BCAD7',   // Info light
    darkIce: '#75ACBE',    // Info dark
    forest: '#A3BE8C',     // Success green
    lightForest: '#B8CCA3', // Success light
    darkForest: '#8CA176', // Success dark
    sun: '#EBCB8B',        // Warning yellow
    lightSun: '#F0D49C',   // Warning light
    darkSun: '#E5C078',    // Warning dark
    aurora: '#BF616A',     // Error red
    lightAurora: '#CC7B83', // Error light
    darkAurora: '#B34A55', // Error dark
    snow: '#FDFDFD',       // Background default
    paper: '#FEFEFE',      // Background paper
  },
  
  // Semantic grays (based on Tailwind-like scale but Nordic-tuned)
  gray: {
    50: '#FCFCFC',   // Lightest
    100: '#F8F9FA',  // Very light
    200: '#F1F3F4',  // Light
    300: '#E8EAED',  // Light-medium
    400: '#BDC1C6',  // Medium
    500: '#80868B',  // Medium-dark
    600: '#5F6368',  // Dark
    700: '#3C4043',  // Very dark
    800: '#202124',  // Darker
    900: '#0D1117',  // Darkest
  },
  
  // Extended grays for better coverage (matching found hardcoded colors)
  slate: {
    50: '#F9FAFB',   // bg-slate-50
    100: '#F3F4F6',  // bg-slate-100  
    200: '#E5E7EB',  // bg-slate-200, border colors
    300: '#D1D5DB',  // bg-slate-300, border colors
    400: '#9CA3AF',  // text-slate-400
    500: '#6B7280',  // text-slate-500
    600: '#4B5563',  // text-slate-600
    700: '#374151',  // text-slate-700, bg-slate-700
    800: '#1F2937',  // bg-slate-800
    900: '#111827',  // text-slate-900, very dark text
  },
  
  // Surface colors for different UI elements
  surface: {
    primary: '#FFFFFF',     // Main background
    secondary: '#FEFEFE',   // Cards, panels
    tertiary: '#FAFBFC',    // Subtle backgrounds
    muted: '#F9FAFB',       // Muted sections
    accent: '#F8F9FA',      // Accent backgrounds
  },
  
  // Border colors
  border: {
    primary: '#E5E7EB',     // Main borders
    secondary: '#D1D5DB',   // Secondary borders  
    accent: '#F1F3F4',      // Subtle borders
    muted: '#F8F9FA',       // Very subtle borders
    focus: '#5E81AC',       // Focus states
  },
  
  // Text colors
  text: {
    primary: '#111827',     // Main text
    secondary: '#374151',   // Secondary text
    muted: '#6B7280',       // Muted text
    placeholder: '#9CA3AF', // Placeholder text
    inverse: '#FFFFFF',     // White text
    accent: '#556B7D',      // Themed secondary text
  },
  
  // Special component colors
  worklog: {
    primary: '#8B5CF6',     // Purple for worklog
    secondary: '#7C3AED',   // Darker purple
    background: 'rgba(139, 92, 246, 0.08)', // Light purple background
  },
  
  // Alert/state colors with backgrounds
  state: {
    success: {
      main: '#A3BE8C',
      background: '#F0F8F0',
      border: '#B8CCA3',
    },
    warning: {
      main: '#EBCB8B', 
      background: '#FFF9E6',
      altBackground: '#FFF6D9',
      strongBackground: '#FFF2D9',
      border: '#F0D49C',
      text: '#B8860B',
    },
    error: {
      main: '#BF616A',
      background: '#FFF0F0', 
      border: '#CC7B83',
    },
    info: {
      main: '#88C0D0',
      background: '#F0F7FF',
      border: '#9BCAD7',
    },
  },
  
  // Interactive states
  interactive: {
    primary: '#2E3440',
    primaryHover: '#242933',
    secondary: '#F3F4F6',
    secondaryHover: '#E5E7EB',
    border: '#D1D5DB',
    borderHover: '#9CA3AF',
    borderFocus: '#6B7280',
  },
} as const;

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colorPalette.nordic.storm,
      light: colorPalette.nordic.slate,
      dark: colorPalette.nordic.charcoal,
      contrastText: colorPalette.text.inverse,
    },
    secondary: {
      main: colorPalette.nordic.sky,
      light: colorPalette.nordic.lightSky,
      dark: colorPalette.nordic.darkSky,
      contrastText: colorPalette.text.inverse,
    },
    background: {
      default: colorPalette.nordic.snow,
      paper: colorPalette.nordic.paper,
    },
    text: {
      primary: colorPalette.nordic.storm,
      secondary: colorPalette.text.accent,
    },
    grey: colorPalette.gray,
    success: {
      main: colorPalette.nordic.forest,
      light: colorPalette.nordic.lightForest,
      dark: colorPalette.nordic.darkForest,
    },
    warning: {
      main: colorPalette.nordic.sun,
      light: colorPalette.nordic.lightSun,
      dark: colorPalette.nordic.darkSun,
    },
    error: {
      main: colorPalette.nordic.aurora,
      light: colorPalette.nordic.lightAurora,
      dark: colorPalette.nordic.darkAurora,
    },
    info: {
      main: colorPalette.nordic.ice,
      light: colorPalette.nordic.lightIce,
      dark: colorPalette.nordic.darkIce,
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    // Main headers - simplified scale
    h1: {
      fontSize: '2rem',
      fontWeight: 500,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 500,
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    // Body text - two consistent sizes
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      letterSpacing: '0.01em',
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.8rem',
      lineHeight: 1.5,
      letterSpacing: '0.01em',
      fontWeight: 400,
    },
    // Small text for metadata
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      letterSpacing: '0.02em',
      fontWeight: 400,
      color: '#80868B',
    },
  },
  spacing: 8, // Generous 8px base spacing for better rhythm
  shape: {
    borderRadius: 12, // Slightly more rounded for softer feel
  },
  shadows: [
    'none',
    '0 1px 3px rgba(46, 52, 64, 0.02)', // Very subtle shadows
    '0 2px 6px rgba(46, 52, 64, 0.03)',
    '0 4px 12px rgba(46, 52, 64, 0.04)',
    '0 6px 16px rgba(46, 52, 64, 0.05)',
    // Continue with minimal shadows...
    '0 8px 20px rgba(46, 52, 64, 0.06)',
    '0 12px 28px rgba(46, 52, 64, 0.07)',
    '0 16px 36px rgba(46, 52, 64, 0.08)',
    '0 20px 44px rgba(46, 52, 64, 0.09)',
    '0 24px 52px rgba(46, 52, 64, 0.10)',
    '0 28px 60px rgba(46, 52, 64, 0.11)',
    '0 32px 68px rgba(46, 52, 64, 0.12)',
    '0 36px 76px rgba(46, 52, 64, 0.13)',
    '0 40px 84px rgba(46, 52, 64, 0.14)',
    '0 44px 92px rgba(46, 52, 64, 0.15)',
    '0 48px 100px rgba(46, 52, 64, 0.16)',
    '0 52px 108px rgba(46, 52, 64, 0.17)',
    '0 56px 116px rgba(46, 52, 64, 0.18)',
    '0 60px 124px rgba(46, 52, 64, 0.19)',
    '0 64px 132px rgba(46, 52, 64, 0.20)',
    '0 68px 140px rgba(46, 52, 64, 0.21)',
    '0 72px 148px rgba(46, 52, 64, 0.22)',
    '0 76px 156px rgba(46, 52, 64, 0.23)',
    '0 80px 164px rgba(46, 52, 64, 0.24)',
    '0 84px 172px rgba(46, 52, 64, 0.25)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#FDFDFD',
          margin: 0,
          padding: 0,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          fontWeight: 500,
          padding: '10px 20px',
          boxShadow: 'none',
          fontSize: '0.875rem', // Matches body1
          letterSpacing: '0.01em',
          '&:hover': {
            boxShadow: '0 2px 12px rgba(46, 52, 64, 0.08)',
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          background: '#2E3440',
          '&:hover': {
            background: '#242933',
          },
        },
        outlined: {
          borderColor: '#F1F3F4',
          borderWidth: '0.5px',
          color: '#556B7D',
          '&:hover': {
            borderColor: '#E8EAED',
            backgroundColor: 'rgba(46, 52, 64, 0.02)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: 'none',
          border: '0.5px solid #F8F9FA',
          backgroundColor: '#FEFEFE',
          '&:hover': {
            border: '0.5px solid #F1F3F4',
            boxShadow: '0 2px 12px rgba(46, 52, 64, 0.04)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: 'none',
          border: '0.5px solid #F8F9FA',
          backgroundColor: '#FEFEFE',
        },
        elevation0: {
          boxShadow: 'none',
          border: 'none',
        },
        elevation1: {
          boxShadow: 'none',
          border: '0.5px solid #F8F9FA',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#FEFEFE',
            '& fieldset': {
              borderColor: '#F1F3F4',
              borderWidth: '0.5px',
            },
            '&:hover fieldset': {
              borderColor: '#E8EAED',
              borderWidth: '0.5px',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#5E81AC',
              borderWidth: '0.5px',
            },
          },
          '& .MuiInputBase-input': {
            padding: '12px 14px',
            lineHeight: '1.4375em',
            boxSizing: 'border-box',
            width: '100%',
            height: '100%',
          },
          '& .MuiInputBase-inputSizeSmall': {
            padding: '8px 12px',
          },
          '& .MuiInputBase-inputMultiline': {
            padding: '12px 14px',
            resize: 'none',
            width: '100%',
            minHeight: '1.4375em',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontSize: '0.75rem',
          fontWeight: 500,
          height: 26,
        },
        outlined: {
          borderColor: '#F1F3F4',
          borderWidth: '0.5px',
          backgroundColor: 'transparent',
          color: '#556B7D',
          '&:hover': {
            backgroundColor: 'rgba(46, 52, 64, 0.02)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FEFEFE',
          color: '#2E3440',
          boxShadow: 'none',
          borderBottom: '0.5px solid #F8F9FA',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '&:hover': {
            backgroundColor: 'rgba(46, 52, 64, 0.04)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '0.5px solid #F8F9FA',
          padding: '16px 20px',
        },
        head: {
          backgroundColor: '#FCFCFC',
          fontWeight: 600,
          fontSize: '0.75rem', // Matches caption
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#80868B',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: 'none',
          fontSize: '0.875rem', // Matches body1
        },
        standardInfo: {
          backgroundColor: '#F0F7FF',
          color: '#2E3440',
        },
        standardWarning: {
          backgroundColor: '#FFF8E7',
          color: '#2E3440',
        },
        standardError: {
          backgroundColor: '#FFF0F0',
          color: '#2E3440',
        },
        standardSuccess: {
          backgroundColor: '#F0F8F0',
          color: '#2E3440',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem', // Matches body1
          fontWeight: 500,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          borderRadius: 12,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#F1F3F4',
            borderWidth: '0.5px',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#E8EAED',
            borderWidth: '0.5px',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#5E81AC',
            borderWidth: '0.5px',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#F8F9FA',
          borderWidth: '0.5px',
        },
      },
    },
  },
});

// Hook to access colors easily in components
export const useAppColors = () => colorPalette;

// Direct access for non-hook usage
export const colors = colorPalette;

export default theme; 