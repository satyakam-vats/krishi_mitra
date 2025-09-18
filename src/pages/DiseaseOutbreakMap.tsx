import React, { useState, useEffect } from 'react';
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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Warning,
  LocationOn,
  Agriculture,
  TrendingUp,
  Refresh,
  ExpandMore,
  Notifications,
  Phone,
  Info,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { useTranslation } from 'react-i18next';

interface DiseaseOutbreak {
  id: string;
  disease: string;
  crop: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    region: string;
  };
  reportedBy: number; // Number of farmers
  severity: 'low' | 'medium' | 'high' | 'critical';
  firstReported: Date;
  lastUpdated: Date;
  affectedArea: number; // in acres
  status: 'active' | 'contained' | 'resolved';
}

interface RegionalAlert {
  region: string;
  totalOutbreaks: number;
  criticalOutbreaks: number;
  affectedFarmers: number;
  mainDiseases: string[];
}

const DiseaseOutbreakMap: React.FC = () => {
  const { user } = useAuth();
  const { isOnline } = useOffline();
  const { t } = useTranslation();
  
  const [outbreaks, setOutbreaks] = useState<DiseaseOutbreak[]>([]);
  const [regionalAlerts, setRegionalAlerts] = useState<RegionalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutbreak, setSelectedOutbreak] = useState<DiseaseOutbreak | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [userRegionAlert, setUserRegionAlert] = useState<string | null>(null);

  useEffect(() => {
    fetchOutbreakData();
    checkUserRegionAlerts();
  }, []);

  const fetchOutbreakData = async () => {
    try {
      setLoading(true);
      
      // Mock outbreak data - in production, fetch from real API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockOutbreaks: DiseaseOutbreak[] = [
        {
          id: 'outbreak_1',
          disease: 'Brown Spot',
          crop: 'Paddy',
          location: {
            latitude: 12.9716,
            longitude: 77.5946,
            address: 'Bangalore Rural, Karnataka',
            region: 'Karnataka',
          },
          reportedBy: 15,
          severity: 'high',
          firstReported: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000),
          affectedArea: 250,
          status: 'active',
        },
        {
          id: 'outbreak_2',
          disease: 'Leaf Blight',
          crop: 'Wheat',
          location: {
            latitude: 28.7041,
            longitude: 77.1025,
            address: 'Delhi NCR, Delhi',
            region: 'Delhi',
          },
          reportedBy: 8,
          severity: 'medium',
          firstReported: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          lastUpdated: new Date(Date.now() - 6 * 60 * 60 * 1000),
          affectedArea: 120,
          status: 'active',
        },
        {
          id: 'outbreak_3',
          disease: 'Powdery Mildew',
          crop: 'Tomato',
          location: {
            latitude: 19.0760,
            longitude: 72.8777,
            address: 'Pune District, Maharashtra',
            region: 'Maharashtra',
          },
          reportedBy: 22,
          severity: 'critical',
          firstReported: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          lastUpdated: new Date(Date.now() - 30 * 60 * 1000),
          affectedArea: 400,
          status: 'active',
        },
      ];

      const mockRegionalAlerts: RegionalAlert[] = [
        {
          region: 'Karnataka',
          totalOutbreaks: 3,
          criticalOutbreaks: 1,
          affectedFarmers: 45,
          mainDiseases: ['Brown Spot', 'Bacterial Wilt'],
        },
        {
          region: 'Maharashtra',
          totalOutbreaks: 5,
          criticalOutbreaks: 2,
          affectedFarmers: 78,
          mainDiseases: ['Powdery Mildew', 'Leaf Curl'],
        },
        {
          region: 'Punjab',
          totalOutbreaks: 2,
          criticalOutbreaks: 0,
          affectedFarmers: 23,
          mainDiseases: ['Rust Disease'],
        },
      ];

      setOutbreaks(mockOutbreaks);
      setRegionalAlerts(mockRegionalAlerts);
    } catch (error) {
      console.error('Failed to fetch outbreak data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserRegionAlerts = () => {
    // Check if user's region has any critical outbreaks
    if (user?.location?.address) {
      const userRegion = extractRegionFromAddress(user.location.address);
      const regionAlert = regionalAlerts.find(alert => 
        alert.region.toLowerCase().includes(userRegion.toLowerCase()) && 
        alert.criticalOutbreaks > 0
      );
      
      if (regionAlert) {
        setUserRegionAlert(
          `${regionAlert.criticalOutbreaks} critical disease outbreak(s) detected in your region. ${regionAlert.affectedFarmers} farmers affected.`
        );
        setShowAlert(true);
      }
    }
  };

  const extractRegionFromAddress = (address: string): string => {
    // Simple extraction - in production, use proper geocoding
    const parts = address.split(',');
    return parts[parts.length - 1]?.trim() || 'Unknown';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'error';
      case 'contained': return 'warning';
      case 'resolved': return 'success';
      default: return 'default';
    }
  };

  const handleReportDisease = () => {
    // Navigate to disease reporting (would integrate with diagnostics)
    alert('Disease reporting feature - would integrate with crop diagnostics');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography variant="h2" component="h1" textAlign="center" gutterBottom>
          {t('notifications.outbreakWarning')} Map
        </Typography>
        <Typography variant="body1" textAlign="center" color="text.secondary" paragraph>
          Real-time disease outbreak monitoring and regional alerts for farmers
        </Typography>

        {!isOnline && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            You're offline. Showing cached outbreak data. Connect to internet for real-time updates.
          </Alert>
        )}

        {userRegionAlert && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={() => setShowAlert(false)}>
                Dismiss
              </Button>
            }
          >
            <strong>Regional Alert:</strong> {userRegionAlert}
          </Alert>
        )}
      </motion.div>

      <Grid container spacing={4}>
        {/* Regional Alerts Summary */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="card">
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Regional Outbreak Summary
                </Typography>
                
                {loading ? (
                  <LinearProgress />
                ) : (
                  <Grid container spacing={3}>
                    {regionalAlerts.map((alert, index) => (
                      <Grid item xs={12} md={4} key={index}>
                        <Card variant="outlined" sx={{ height: '100%' }}>
                          <CardContent>
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                              <LocationOn color="primary" />
                              <Typography variant="h6">{alert.region}</Typography>
                            </Box>
                            
                            <Box mb={2}>
                              <Typography variant="body2" color="text.secondary">
                                Total Outbreaks: <strong>{alert.totalOutbreaks}</strong>
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Critical: <strong>{alert.criticalOutbreaks}</strong>
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Affected Farmers: <strong>{alert.affectedFarmers}</strong>
                              </Typography>
                            </Box>
                            
                            <Typography variant="subtitle2" gutterBottom>
                              Main Diseases:
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                              {alert.mainDiseases.map((disease, idx) => (
                                <Chip 
                                  key={idx} 
                                  label={disease} 
                                  size="small" 
                                  variant="outlined"
                                  color={alert.criticalOutbreaks > 0 ? 'error' : 'default'}
                                />
                              ))}
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Active Outbreaks List */}
        <Grid item xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="card">
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h5">
                    Active Disease Outbreaks
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={fetchOutbreakData}
                    disabled={loading}
                    className="farmer-button farmer-button-secondary"
                  >
                    Refresh
                  </Button>
                </Box>

                {loading ? (
                  <LinearProgress />
                ) : (
                  <List>
                    {outbreaks.map((outbreak) => (
                      <React.Fragment key={outbreak.id}>
                        <ListItem
                          button
                          onClick={() => setSelectedOutbreak(outbreak)}
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: '8px',
                            mb: 1,
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                          }}
                        >
                          <ListItemIcon>
                            <Warning color={getSeverityColor(outbreak.severity) as any} />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="subtitle1">
                                  {outbreak.disease} in {outbreak.crop}
                                </Typography>
                                <Chip
                                  label={outbreak.severity}
                                  size="small"
                                  color={getSeverityColor(outbreak.severity) as any}
                                />
                                <Chip
                                  label={outbreak.status}
                                  size="small"
                                  variant="outlined"
                                  color={getStatusColor(outbreak.status) as any}
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  📍 {outbreak.location.address}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  👥 {outbreak.reportedBy} farmers • 🌾 {outbreak.affectedArea} acres
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Last updated: {outbreak.lastUpdated.toLocaleString()}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className="card">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                
                <Box display="flex" flexDirection="column" gap={2}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<Warning />}
                    onClick={handleReportDisease}
                    className="farmer-button farmer-button-primary"
                  >
                    Report Disease
                  </Button>
                  
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Agriculture />}
                    href="/diagnostics"
                    className="farmer-button farmer-button-secondary"
                  >
                    Scan Crop
                  </Button>
                  
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Phone />}
                    href="tel:+911234567890"
                    className="farmer-button farmer-button-secondary"
                  >
                    Emergency Helpline
                  </Button>
                  
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Notifications />}
                    onClick={() => alert('Notification settings - would open settings page')}
                    className="farmer-button farmer-button-secondary"
                  >
                    Alert Settings
                  </Button>
                </Box>

                <Box mt={3}>
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle2">Prevention Tips</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <Info fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Regular crop monitoring"
                            secondary="Check crops daily for early signs"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <Info fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Proper field hygiene"
                            secondary="Remove infected plant debris"
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <Info fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Crop rotation"
                            secondary="Rotate crops to break disease cycles"
                          />
                        </ListItem>
                      </List>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Outbreak Detail Dialog */}
      <Dialog
        open={Boolean(selectedOutbreak)}
        onClose={() => setSelectedOutbreak(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedOutbreak && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={1}>
                <Warning color={getSeverityColor(selectedOutbreak.severity) as any} />
                <Typography variant="h6">
                  {selectedOutbreak.disease} Outbreak Details
                </Typography>
                <Chip
                  label={selectedOutbreak.severity}
                  color={getSeverityColor(selectedOutbreak.severity) as any}
                  size="small"
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Affected Crop:
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {selectedOutbreak.crop}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Location:
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {selectedOutbreak.location.address}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Reported by:
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {selectedOutbreak.reportedBy} farmers
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Affected Area:
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {selectedOutbreak.affectedArea} acres
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    First Reported:
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {selectedOutbreak.firstReported.toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Status:
                  </Typography>
                  <Chip
                    label={selectedOutbreak.status}
                    color={getStatusColor(selectedOutbreak.status) as any}
                    variant="outlined"
                  />
                </Grid>
              </Grid>

              <Box mt={3}>
                <Alert severity="warning">
                  <Typography variant="subtitle2" gutterBottom>
                    Recommended Actions:
                  </Typography>
                  <ul>
                    <li>Inspect your {selectedOutbreak.crop} crops immediately</li>
                    <li>Look for symptoms of {selectedOutbreak.disease}</li>
                    <li>Isolate any infected plants</li>
                    <li>Contact agricultural extension officer</li>
                    <li>Apply preventive treatments if available</li>
                  </ul>
                </Alert>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedOutbreak(null)}>
                Close
              </Button>
              <Button 
                variant="contained" 
                onClick={handleReportDisease}
                className="farmer-button farmer-button-primary"
              >
                Report Similar Case
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default DiseaseOutbreakMap;
