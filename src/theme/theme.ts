// theme.ts
import { createTheme } from '@mui/material/styles';

const bordaRadius = 12;

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#DF1616', // vermelho da identidade
    },
    secondary: {
      main: '#000000', // para botões escuros
    },
    background: {
      default: '#ffffff',
      paper: '#f0f0f0',
    },
    text: {
      primary: '#000000',
      secondary: '#ffffff',
    },
  },
  shape: {
    borderRadius: bordaRadius,
  },
  typography: {
    fontFamily: 'Poppins, sans-serif',
    fontWeightRegular: 400,
    fontWeightMedium: 600,
    fontWeightBold: 700,
    button: {
      textTransform: 'none', // mantém texto normal nos botões
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: bordaRadius,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ffffff',
    },
    background: {
      default: '#BA0100',
      paper: '#1d1d1d',
    },
    text: {
      primary: '#ffffff',
      secondary: '#000000',
    },
  },
  shape: {
    borderRadius: bordaRadius,
  },
  typography: {
    fontFamily: 'Poppins, sans-serif',
    fontWeightRegular: 400,
    fontWeightMedium: 600,
    fontWeightBold: 700,
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: bordaRadius,
          boxShadow: '0 2px 4px rgba(255,255,255,0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
  },
});
