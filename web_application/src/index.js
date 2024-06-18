import React from 'react';
import ReactDOM from 'react-dom';
import {
  createBrowserRouter,
  RouterProvider
} from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { purple, blue, grey } from '@mui/material/colors';
import Dashboard from './pages/dashboard/Dashboard';
import Login from './pages/login/Login';
import Review from './pages/review/Review';

const palette = {
  primary: {
    light: purple[300],
    main: purple[500],
    dark: purple[700]
  },
  secondary: {
    light: blue[300],
    main: blue[500],
    dark: blue[700]
  },
  white: {
    main: grey[100]
  }
};
const theme = createTheme({
  palette,
  spacing: 0,
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          color: 'white', //text color
          backgroundColor: palette.primary.light,
          padding: 10
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          color: 'white',
          backgroundColor: palette.secondary.main,
          '&:hover': {
            backgroundColor: palette.primary.light
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          color: 'white',
          backgroundColor: palette.primary.light,
          '& label.Mui-focused': {
            color: 'white'
          },
          '& label': {
            color: 'white',
            borderColor: 'white',
            'border-color': 'white'
          },
          '& .MuiOutlinedInput-root': {
            '& .Mui-focused fieldset': {
              borderColor: 'white',
              'border-color': 'white'
            }
          }
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        sizeMedium: {
          color: 'white'
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          color: 'white'
        }
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: 'white'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          color: 'white'
        }
      }
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          color: 'white',
          '&:before': {
            borderColor: 'white'
          },
          '&:after': {
            borderColor: 'white'
          }
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: 'white'
        }
      }
    }
  }
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <Dashboard/>,
  },
  {
    path: "/login",
    element: <Login/>,
  },
  {
    path: "/review",
    element: <Review/>,
  }
]);

// TODO - when fixing the React 18 error, check that address selection still works
ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
);