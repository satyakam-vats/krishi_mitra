import React, { useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Person,
  Notifications,
  Language,
  Storage,
  Security,
  Help,
  Info,
  CloudSync,
  Delete,
  Download,
  Logout,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const { pendingSync, clearSyncedData } = useOffline();
  
  const [settings, setSettings] = useState({
    notifications: true,
    offlineMode: true,
    autoSync: true,
    highQualityImages: false,
    voiceCommands: false,
    darkMode: false,
  });
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);

  const handleSettingChange = (setting: string) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev],
    }));
  };

  const handleLogout = () => {
    logout();
    setShowLogoutDialog(false);
  };

  const handleClearData = async () => {
    try {
      await clearSyncedData();
      setShowClearDataDialog(false);
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  };

  const exportData = () => {
    // Mock data export functionality
    const data = {
      user: user,
      settings: settings,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agri-advisor-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography variant="h2" component="h1" textAlign="center" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" textAlign="center" color="text.secondary" paragraph>
          Customize your AgriAdvisor experience
        </Typography>
      </motion.div>

      <Grid container spacing={4}>
        {/* Profile Information */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="card">
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Person color="primary" />
                  <Typography variant="h5">Profile Information</Typography>
                </Box>

                {user && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {user.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {user.email}
                    </Typography>
                    {user.phone && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {user.phone}
                      </Typography>
                    )}
                    
                    {user.farmDetails && (
                      <Box mt={2}>
                        <Typography variant="subtitle2" gutterBottom>
                          Farm Details:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Size: {user.farmDetails.size} acres
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Soil: {user.farmDetails.soilType}
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={0.5} mt={1}>
                          {user.farmDetails.crops.map((crop, index) => (
                            <Chip key={index} label={crop} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </Box>
                    )}

                    <Button
                      variant="outlined"
                      sx={{ mt: 2 }}
                      className="farmer-button farmer-button-secondary"
                    >
                      Edit Profile
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* App Settings */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="card">
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Notifications color="primary" />
                  <Typography variant="h5">App Settings</Typography>
                </Box>

                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Notifications />
                    </ListItemIcon>
                    <ListItemText
                      primary="Push Notifications"
                      secondary="Receive alerts for weather, prices, and recommendations"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.notifications}
                        onChange={() => handleSettingChange('notifications')}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <CloudSync />
                    </ListItemIcon>
                    <ListItemText
                      primary="Auto Sync"
                      secondary="Automatically sync data when online"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.autoSync}
                        onChange={() => handleSettingChange('autoSync')}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <Storage />
                    </ListItemIcon>
                    <ListItemText
                      primary="High Quality Images"
                      secondary="Use higher resolution for better AI analysis"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.highQualityImages}
                        onChange={() => handleSettingChange('highQualityImages')}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <Language />
                    </ListItemIcon>
                    <ListItemText
                      primary="Voice Commands"
                      secondary="Enable voice control for accessibility"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={settings.voiceCommands}
                        onChange={() => handleSettingChange('voiceCommands')}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Data & Storage */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className="card">
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Storage color="primary" />
                  <Typography variant="h5">Data & Storage</Typography>
                </Box>

                {pendingSync.length > 0 && (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    You have {pendingSync.length} items waiting to sync when you're back online.
                  </Alert>
                )}

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Download />}
                      onClick={exportData}
                      className="farmer-button farmer-button-secondary"
                    >
                      Export Data
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<CloudSync />}
                      disabled={pendingSync.length === 0}
                      className="farmer-button farmer-button-secondary"
                    >
                      Sync Now
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Delete />}
                      onClick={() => setShowClearDataDialog(true)}
                      className="farmer-button farmer-button-secondary"
                    >
                      Clear Cache
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      color="error"
                      fullWidth
                      startIcon={<Logout />}
                      onClick={() => setShowLogoutDialog(true)}
                      className="farmer-button"
                    >
                      Logout
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Help & Support */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Card className="card">
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Help color="primary" />
                  <Typography variant="h5">Help & Support</Typography>
                </Box>

                <List>
                  <ListItem button>
                    <ListItemIcon>
                      <Help />
                    </ListItemIcon>
                    <ListItemText
                      primary="User Guide"
                      secondary="Learn how to use AgriAdvisor effectively"
                    />
                  </ListItem>

                  <ListItem button component="a" href="tel:+911234567890">
                    <ListItemIcon>
                      <Help />
                    </ListItemIcon>
                    <ListItemText
                      primary="Contact Support"
                      secondary="+91 123 456 7890"
                    />
                  </ListItem>

                  <ListItem button>
                    <ListItemIcon>
                      <Info />
                    </ListItemIcon>
                    <ListItemText
                      primary="Privacy Policy"
                      secondary="How we protect your data"
                    />
                  </ListItem>

                  <ListItem button>
                    <ListItemIcon>
                      <Security />
                    </ListItemIcon>
                    <ListItemText
                      primary="Terms of Service"
                      secondary="Usage terms and conditions"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* App Information */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <Card className="card">
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Info color="primary" />
                  <Typography variant="h5">App Information</Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Version: 1.0.0
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Build: 2024.01.15
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Last Updated: January 15, 2024
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    AgriAdvisor is an AI-powered agricultural advisory platform designed to help smallholder farmers optimize their farming practices through technology.
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Developed with ❤️ for farmers worldwide
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onClose={() => setShowLogoutDialog(false)}>
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to logout? Any unsaved changes will be lost.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLogoutDialog(false)}>Cancel</Button>
          <Button onClick={handleLogout} color="error" variant="contained">
            Logout
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear Data Confirmation Dialog */}
      <Dialog open={showClearDataDialog} onClose={() => setShowClearDataDialog(false)}>
        <DialogTitle>Clear Cache Data</DialogTitle>
        <DialogContent>
          <Typography>
            This will remove all cached data including images and offline content. 
            Your account data will remain safe. Continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowClearDataDialog(false)}>Cancel</Button>
          <Button onClick={handleClearData} color="warning" variant="contained">
            Clear Cache
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Settings;
