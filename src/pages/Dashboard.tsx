import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Button,
  Alert,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Agriculture,
  WaterDrop,
  CameraAlt,
  TrendingUp,
  LocationOn,
  Phone,
  Email,
  CalendarToday,
  Notifications,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';

interface DashboardStats {
  totalDiagnoses: number;
  recentDiseases: string[];
  irrigationAlerts: number;
  weatherAlerts: number;
}

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { isOnline, pendingSync } = useOffline();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalDiagnoses: 0,
    recentDiseases: [],
    irrigationAlerts: 0,
    weatherAlerts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    fetchDashboardData();
  }, [isAuthenticated, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Mock dashboard data - in production, fetch from API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalDiagnoses: 15,
        recentDiseases: ['Brown Spot', 'Leaf Blight', 'Powdery Mildew'],
        irrigationAlerts: 2,
        weatherAlerts: 1,
      });
      
      setRecentActivity([
        {
          id: 1,
          type: 'diagnosis',
          title: 'Crop Disease Detected',
          description: 'Brown spot detected in paddy field',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          severity: 'high',
        },
        {
          id: 2,
          type: 'irrigation',
          title: 'Irrigation Recommended',
          description: 'Water your tomato crops - high priority',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          severity: 'medium',
        },
        {
          id: 3,
          type: 'weather',
          title: 'Weather Alert',
          description: 'Heavy rainfall expected in 6 hours',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          severity: 'low',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'diagnosis': return <CameraAlt color="primary" />;
      case 'irrigation': return <WaterDrop color="info" />;
      case 'weather': return <TrendingUp color="warning" />;
      default: return <Notifications />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box display="flex" alignItems="center" gap={2} mb={4}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              backgroundColor: 'primary.main',
              fontSize: '1.5rem',
            }}
          >
            {user.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h3" component="h1">
              Welcome back, {user.name}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Here's what's happening on your farm today
            </Typography>
          </Box>
        </Box>

        {!isOnline && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            You're offline. Some data may not be up to date. {pendingSync.length > 0 && `${pendingSync.length} items will sync when online.`}
          </Alert>
        )}
      </motion.div>

      <Grid container spacing={4}>
        {/* Quick Stats */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Typography variant="h5" gutterBottom>
              Farm Overview
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card className="card">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <CameraAlt sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4" color="primary.main">
                      {stats.totalDiagnoses}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Diagnoses
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card className="card">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Warning sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h4" color="warning.main">
                      {stats.recentDiseases.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Diseases
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card className="card">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <WaterDrop sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                    <Typography variant="h4" color="info.main">
                      {stats.irrigationAlerts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Irrigation Alerts
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card className="card">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="h4" color="success.main">
                      {stats.weatherAlerts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Weather Alerts
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </motion.div>
        </Grid>

        {/* Farm Details */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="card">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Farm Information
                </Typography>
                
                {user.farmDetails ? (
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Agriculture color="primary" />
                      <Typography variant="body1">
                        {user.farmDetails.size} acres • {user.farmDetails.soilType} soil
                      </Typography>
                    </Box>
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Crops:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
                      {user.farmDetails.crops.map((crop, index) => (
                        <Chip key={index} label={crop} size="small" variant="outlined" />
                      ))}
                    </Box>
                    
                    {user.location?.address && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <LocationOn color="primary" />
                        <Typography variant="body2" color="text.secondary">
                          {user.location.address}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Complete your farm profile to get personalized recommendations.
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/settings')}
                      className="farmer-button farmer-button-secondary"
                    >
                      Update Farm Details
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className="card">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                
                {loading ? (
                  <LinearProgress />
                ) : (
                  <List>
                    {recentActivity.map((activity, index) => (
                      <React.Fragment key={activity.id}>
                        <ListItem>
                          <ListItemIcon>
                            {getActivityIcon(activity.type)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="subtitle2">
                                  {activity.title}
                                </Typography>
                                <Chip
                                  label={activity.severity}
                                  size="small"
                                  color={getSeverityColor(activity.severity) as any}
                                  variant="outlined"
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {activity.description}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {activity.timestamp.toLocaleString()}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < recentActivity.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Card className="glass" sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<CameraAlt />}
                    onClick={() => navigate('/diagnostics')}
                    className="farmer-button farmer-button-primary"
                  >
                    Scan Crop
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<WaterDrop />}
                    onClick={() => navigate('/irrigation')}
                    className="farmer-button farmer-button-secondary"
                  >
                    Check Irrigation
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Agriculture />}
                    onClick={() => navigate('/settings')}
                    className="farmer-button farmer-button-secondary"
                  >
                    Farm Settings
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Phone />}
                    href="tel:+911234567890"
                    className="farmer-button farmer-button-secondary"
                  >
                    Get Help
                  </Button>
                </Grid>
              </Grid>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
