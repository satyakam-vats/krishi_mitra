import React from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  CameraAlt,
  WaterDrop,
  TrendingUp,
  Agriculture,
  CloudOff,
  Sync,
  LocationOn,
  Phone,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';

const Home: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { isOnline, pendingSync } = useOffline();

  const features = [
    {
      title: 'Crop Disease Detection',
      description: 'AI-powered analysis of crop images to identify diseases and pests',
      icon: <CameraAlt sx={{ fontSize: 40 }} />,
      path: '/diagnostics',
      color: '#4caf50',
      benefits: ['Instant diagnosis', 'Treatment recommendations', 'Works offline'],
    },
    {
      title: 'Smart Irrigation',
      description: 'Weather-based irrigation recommendations for optimal water usage',
      icon: <WaterDrop sx={{ fontSize: 40 }} />,
      path: '/irrigation',
      color: '#2196f3',
      benefits: ['Water conservation', 'Weather integration', 'Crop-specific advice'],
    },
  ];


  return (
    <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box textAlign="center" mb={6}>
          <Typography variant="h1" component="h1" gutterBottom>
            Smart Farming Solutions 
          </Typography>
          <Typography variant="h5" color="text.secondary" paragraph>
            AI-powered agricultural advisory platform for smallholder farmers
          </Typography>
          
          {/* Status Indicators */}
          <Box display="flex" justifyContent="center" gap={2} mb={3}>
            <Chip
              icon={isOnline ? <Sync /> : <CloudOff />}
              label={isOnline ? 'Online' : 'Offline Mode'}
              color={isOnline ? 'success' : 'warning'}
              variant="outlined"
            />
            {pendingSync.length > 0 && (
              <Chip
                icon={<Sync />}
                label={`${pendingSync.length} items to sync`}
                color="info"
                variant="outlined"
              />
            )}
          </Box>

          {!isAuthenticated && (
            <Box display="flex" justifyContent="center" gap={2}>
              <Button
                component={Link}
                to="/register"
                variant="contained"
                size="large"
                className="farmer-button farmer-button-primary"
              >
                Get Started
              </Button>
              <Button
                component={Link}
                to="/login"
                variant="outlined"
                size="large"
                className="farmer-button farmer-button-secondary"
              >
                Login
              </Button>
            </Box>
          )}
        </Box>
      </motion.div>

      {/* Welcome Message for Authenticated Users */}
      {isAuthenticated && user && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Welcome back, {user.name}! 🌱
              </Typography>
              <Typography variant="body1">
                Ready to optimize your farming today? Check your crops, plan irrigation, or explore market opportunities.
              </Typography>
              {user.farmDetails && (
                <Box mt={2}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Farm: {user.farmDetails.size} acres • Crops: {user.farmDetails.crops.join(', ')}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Features Grid */}
      <Grid container spacing={4} mb={6}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={4} key={feature.title}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
            >
              <Card className="card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: '12px',
                        backgroundColor: `${feature.color}20`,
                        color: feature.color,
                        mr: 2,
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" component="h3">
                      {feature.title}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {feature.description}
                  </Typography>

                  <Box>
                    {feature.benefits.map((benefit, idx) => (
                      <Chip
                        key={idx}
                        label={benefit}
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </CardContent>
                
                <CardActions>
                  <Button
                    component={Link}
                    to={feature.path}
                    variant="contained"
                    fullWidth
                    className="farmer-button farmer-button-primary"
                    sx={{ backgroundColor: feature.color }}
                  >
                    Get Started
                  </Button>
                </CardActions>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>


      {/* How It Works Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.0 }}
      >
        <Typography variant="h4" textAlign="center" gutterBottom>
          How It Works
        </Typography>
        <Grid container spacing={4} mb={6}>
          <Grid item xs={12} md={4}>
            <Card className="card" sx={{ textAlign: 'center', p: 3 }}>
              <Box sx={{ fontSize: 48, mb: 2 }}>📸</Box>
              <Typography variant="h6" gutterBottom>
                1. Capture
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Take photos of your crops using your phone camera or upload existing images
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card className="card" sx={{ textAlign: 'center', p: 3 }}>
              <Box sx={{ fontSize: 48, mb: 2 }}>🧠</Box>
              <Typography variant="h6" gutterBottom>
                2. Analyze
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Our AI analyzes your images and provides instant diagnosis and recommendations
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card className="card" sx={{ textAlign: 'center', p: 3 }}>
              <Box sx={{ fontSize: 48, mb: 2 }}>🌱</Box>
              <Typography variant="h6" gutterBottom>
                3. Act
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Follow personalized recommendations to improve crop health and maximize yield
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </motion.div>

      {/* Offline Capabilities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
      >
        <Card className="glass" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Works Offline Too! 📡
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            No internet? No problem! AgriAdvisor works offline with basic disease detection,
            data storage, and automatic sync when you're back online.
          </Typography>
          
          <Box display="flex" justifyContent="center" gap={2} mt={3}>
            <Chip icon={<CameraAlt />} label="Offline Camera" variant="outlined" />
            <Chip icon={<Agriculture />} label="Basic AI Models" variant="outlined" />
            <Chip icon={<Sync />} label="Auto Sync" variant="outlined" />
          </Box>
        </Card>
      </motion.div>

      {/* Emergency Contact */}
      <Box textAlign="center" mt={6}>
        <Typography variant="body2" color="text.secondary">
          Need help? Contact our agricultural experts
        </Typography>
        <Button
          startIcon={<Phone />}
          sx={{ mt: 1 }}
          href="tel:+911234567890"
        >
          Call Support: +91 123 456 7890
        </Button>
      </Box>
    </Container>
  );
};

export default Home;
