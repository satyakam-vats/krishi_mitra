import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Components
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Diagnostics from './pages/Diagnostics';
import Irrigation from './pages/Irrigation';
import Market from './pages/Market';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';

// Context
import { AuthProvider } from './context/AuthContext';
import { OfflineProvider } from './context/OfflineContext';

// Create custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    secondary: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    background: {
      default: '#e8f5e9',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#555555',
    },
  },
  typography: {
    fontFamily: '"Noto Sans", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      color: '#2e7d32',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#2e7d32',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 500,
      color: '#2e7d32',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: '60px',
          fontSize: '18px',
          fontWeight: 500,
          borderRadius: '12px',
          textTransform: 'none',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <OfflineProvider>
          <Router>
            <div className="App">
              {/* Animated background */}
              <div className="animated-bg">
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
              </div>
              
              <Navbar />
              
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/diagnostics" element={<Diagnostics />} />
                <Route path="/irrigation" element={<Irrigation />} />
                <Route path="/market" element={<Market />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Routes>
            </div>
          </Router>
        </OfflineProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
