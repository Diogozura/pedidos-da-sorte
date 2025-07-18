// theme.ts
import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#DF1616',
    },
    background: {
      default: '#f8f8f8ff',
      paper: '#ddddddff',
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#fcfcfcff',
    },
    background: {
      default: '#BA0100',
      paper: '#1d1d1d',
    },
  },
});
