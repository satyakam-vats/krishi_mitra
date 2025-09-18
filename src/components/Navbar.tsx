import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  CameraAlt,
  LocationOn,
  AccountCircle,
  Menu as MenuIcon,
  Agriculture,
  WaterDrop,
  TrendingUp,
  Settings,
  Logout,
  Wifi,
  WifiOff,
  Warning,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useCamera } from '../hooks/useCamera';
import { useLocation as useGeolocation } from '../hooks/useLocation';
import { useOffline } from '../context/OfflineContext';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { captureImage } = useCamera();
  const { getCurrentLocation } = useGeolocation();
  const { isOnline, toggleOnlineMode } = useOffline();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleMenuClose();
  };

  const handleCameraClick = async () => {
    try {
      const image = await captureImage();
      if (image) {
        navigate('/diagnostics', { state: { capturedImage: image } });
      }
    } catch (error) {
      console.error('Camera capture failed:', error);
    }
  };

  const handleLocationClick = async () => {
    try {
      const location = await getCurrentLocation();
      if (location) {
        // Store location for use in other components
        localStorage.setItem('currentLocation', JSON.stringify(location));
      }
    } catch (error) {
      console.error('Location access failed:', error);
    }
  };

  const navItems = [
    { path: '/', label: 'Home', icon: <Agriculture /> },
    ...(isAuthenticated ? [{ path: '/dashboard', label: 'Dashboard', icon: <AccountCircle /> }] : []),
    { path: '/diagnostics', label: 'Scan Crop', icon: <CameraAlt /> },
    { path: '/irrigation', label: 'Irrigation', icon: <WaterDrop /> },
    { path: '/outbreak-map', label: 'Disease Map', icon: <Warning /> },
  ];

  return (
    <AppBar 
      position="fixed" 
      sx={{
        background: 'rgba(46, 125, 50, 0.25)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(46, 125, 50, 0.18)',
        boxShadow: '0 8px 32px 0 rgba(46, 125, 50, 0.37)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Logo and Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              textDecoration: 'none',
              color: 'white',
              fontWeight: 700,
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            🌱 AgriAdvisor
          </Typography>
        </Box>

        {/* Desktop Navigation */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              component={Link}
              to={item.path}
              startIcon={item.icon}
              sx={{
                color: 'white',
                minHeight: '48px',
                px: 2,
                borderRadius: '12px',
                backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Camera Button */}
          <Tooltip title="Capture Crop Image">
            <IconButton
              onClick={handleCameraClick}
              sx={{
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              <CameraAlt />
            </IconButton>
          </Tooltip>

          {/* Location Button */}
          <Tooltip title="Get Current Location">
            <IconButton
              onClick={handleLocationClick}
              sx={{
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              <LocationOn />
            </IconButton>
          </Tooltip>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Online/Offline Toggle */}
          <Tooltip title={isOnline ? "Go Offline" : "Go Online"}>
            <IconButton
              onClick={toggleOnlineMode}
              sx={{
                color: 'white',
                backgroundColor: isOnline ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                '&:hover': {
                  backgroundColor: isOnline ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)',
                },
              }}
            >
              {isOnline ? <Wifi /> : <WifiOff />}
            </IconButton>
          </Tooltip>

          {/* User Menu */}
          {isAuthenticated ? (
            <>
              <Tooltip title="Account">
                <IconButton onClick={handleProfileMenuOpen}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: 'white',
                      color: 'primary.main',
                      fontSize: '0.875rem',
                    }}
                  >
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    mt: 1,
                  },
                }}
              >
                <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}>
                  <Settings sx={{ mr: 1 }} />
                  Settings
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <Logout sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              component={Link}
              to="/login"
              variant="contained"
              sx={{
                backgroundColor: 'white',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                },
              }}
            >
              Login
            </Button>
          )}

          {/* Mobile Menu */}
          <IconButton
            sx={{ display: { xs: 'block', md: 'none' }, color: 'white' }}
            onClick={handleMobileMenuOpen}
          >
            <MenuIcon />
          </IconButton>
        </Box>

        {/* Mobile Menu */}
        <Menu
          anchorEl={mobileMenuAnchor}
          open={Boolean(mobileMenuAnchor)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              mt: 1,
              minWidth: 200,
            },
          }}
        >
          {navItems.map((item) => (
            <MenuItem
              key={item.path}
              component={Link}
              to={item.path}
              onClick={handleMenuClose}
              sx={{
                backgroundColor: location.pathname === item.path ? 'rgba(46, 125, 50, 0.1)' : 'transparent',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {item.icon}
                {item.label}
              </Box>
            </MenuItem>
          ))}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
