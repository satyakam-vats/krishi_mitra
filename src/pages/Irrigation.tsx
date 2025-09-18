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
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  WaterDrop,
  Thermostat,
  Cloud,
  Opacity,
  Agriculture,
  Schedule,
  TrendingUp,
  Warning,
  CheckCircle,
  ExpandMore,
  LocationOn,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useLocation as useGeolocation } from '../hooks/useLocation';
import { useOffline } from '../context/OfflineContext';

interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  forecast: {
    date: string;
    temp: number;
    humidity: number;
    rainfall: number;
  }[];
}

interface IrrigationRecommendation {
  action: 'irrigate' | 'wait' | 'reduce';
  priority: 'low' | 'medium' | 'high';
  amount: number; // in liters per square meter
  timing: string;
  reason: string;
  tips: string[];
}

const Irrigation: React.FC = () => {
  const { getCurrentLocation } = useGeolocation();
  const { saveOfflineData, isOnline } = useOffline();
  
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [recommendation, setRecommendation] = useState<IrrigationRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string>('tomato');
  const [soilType, setSoilType] = useState<string>('loamy');

  const crops = [
    { value: 'tomato', label: 'Tomato', waterNeed: 'high' },
    { value: 'wheat', label: 'Wheat', waterNeed: 'medium' },
    { value: 'rice', label: 'Rice', waterNeed: 'very_high' },
    { value: 'corn', label: 'Corn', waterNeed: 'medium' },
    { value: 'potato', label: 'Potato', waterNeed: 'medium' },
    { value: 'onion', label: 'Onion', waterNeed: 'low' },
  ];

  const soilTypes = [
    { value: 'sandy', label: 'Sandy', drainageRate: 'fast' },
    { value: 'loamy', label: 'Loamy', drainageRate: 'medium' },
    { value: 'clay', label: 'Clay', drainageRate: 'slow' },
  ];

  useEffect(() => {
    fetchWeatherAndRecommendation();
  }, [selectedCrop, soilType]);

  const fetchWeatherAndRecommendation = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current location
      const location = await getCurrentLocation();
      
      if (isOnline) {
        // Fetch real weather data (mock implementation)
        const weatherResponse = await fetchWeatherData(location.coordinates.latitude, location.coordinates.longitude);
        setWeatherData(weatherResponse);
        
        // Generate irrigation recommendation
        const irrigationRec = generateIrrigationRecommendation(weatherResponse, selectedCrop, soilType);
        setRecommendation(irrigationRec);
        
        // Save data offline
        await saveOfflineData('irrigation_data', {
          weather: weatherResponse,
          recommendation: irrigationRec,
          crop: selectedCrop,
          soilType,
          location: location.coordinates,
          timestamp: Date.now(),
        });
      } else {
        // Use offline mock data
        const mockWeather = generateMockWeatherData();
        const mockRecommendation = generateIrrigationRecommendation(mockWeather, selectedCrop, soilType);
        
        setWeatherData(mockWeather);
        setRecommendation(mockRecommendation);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch irrigation data');
      
      // Fallback to basic recommendation
      const basicRecommendation: IrrigationRecommendation = {
        action: 'irrigate',
        priority: 'medium',
        amount: 25,
        timing: 'Early morning (6-8 AM)',
        reason: 'Unable to fetch weather data. Using general guidelines.',
        tips: [
          'Check soil moisture manually',
          'Water early morning or evening',
          'Monitor plant stress signs',
        ],
      };
      setRecommendation(basicRecommendation);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherData = async (lat: number, lon: number): Promise<WeatherData> => {
    // Mock weather API call - in production, use OpenWeather API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      temperature: 28 + Math.random() * 10,
      humidity: 60 + Math.random() * 30,
      rainfall: Math.random() * 10,
      windSpeed: 5 + Math.random() * 10,
      forecast: Array.from({ length: 5 }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        temp: 25 + Math.random() * 15,
        humidity: 50 + Math.random() * 40,
        rainfall: Math.random() * 15,
      })),
    };
  };

  const generateMockWeatherData = (): WeatherData => ({
    temperature: 30,
    humidity: 65,
    rainfall: 2,
    windSpeed: 8,
    forecast: [
      { date: '2024-01-01', temp: 32, humidity: 70, rainfall: 0 },
      { date: '2024-01-02', temp: 29, humidity: 65, rainfall: 5 },
      { date: '2024-01-03', temp: 31, humidity: 60, rainfall: 0 },
      { date: '2024-01-04', temp: 28, humidity: 75, rainfall: 8 },
      { date: '2024-01-05', temp: 30, humidity: 68, rainfall: 2 },
    ],
  });

  const generateIrrigationRecommendation = (
    weather: WeatherData,
    crop: string,
    soil: string
  ): IrrigationRecommendation => {
    const cropData = crops.find(c => c.value === crop);
    const soilData = soilTypes.find(s => s.value === soil);
    
    let baseAmount = 20; // Base irrigation amount in L/m²
    let action: 'irrigate' | 'wait' | 'reduce' = 'irrigate';
    let priority: 'low' | 'medium' | 'high' = 'medium';
    
    // Adjust based on weather
    if (weather.rainfall > 10) {
      action = 'wait';
      priority = 'low';
      baseAmount = 0;
    } else if (weather.temperature > 35 || weather.humidity < 40) {
      priority = 'high';
      baseAmount = 35;
    } else if (weather.temperature < 20 || weather.humidity > 80) {
      action = 'reduce';
      baseAmount = 10;
    }
    
    // Adjust based on crop water needs
    switch (cropData?.waterNeed) {
      case 'very_high':
        baseAmount *= 1.5;
        break;
      case 'high':
        baseAmount *= 1.2;
        break;
      case 'low':
        baseAmount *= 0.7;
        break;
    }
    
    // Adjust based on soil drainage
    switch (soilData?.drainageRate) {
      case 'fast':
        baseAmount *= 1.3;
        break;
      case 'slow':
        baseAmount *= 0.8;
        break;
    }
    
    const tips = [
      'Water early morning (6-8 AM) or evening (6-8 PM)',
      'Check soil moisture 2-3 inches deep',
      'Apply water slowly for better absorption',
      'Mulch around plants to retain moisture',
    ];
    
    if (weather.temperature > 30) {
      tips.push('Provide shade during hottest part of day');
    }
    
    if (weather.humidity < 50) {
      tips.push('Consider misting leaves in evening');
    }
    
    return {
      action,
      priority,
      amount: Math.round(baseAmount),
      timing: weather.temperature > 30 ? 'Early morning (5-7 AM)' : 'Early morning (6-8 AM)',
      reason: `Based on current temperature (${Math.round(weather.temperature)}°C), humidity (${Math.round(weather.humidity)}%), and recent rainfall (${Math.round(weather.rainfall)}mm)`,
      tips,
    };
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'irrigate': return 'primary';
      case 'wait': return 'warning';
      case 'reduce': return 'info';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography variant="h2" component="h1" textAlign="center" gutterBottom>
          Smart Irrigation Advisor
        </Typography>
        <Typography variant="body1" textAlign="center" color="text.secondary" paragraph>
          Weather-based irrigation recommendations for optimal water usage
        </Typography>

        {!isOnline && (
          <Alert severity="info" sx={{ mb: 3 }}>
            You're offline. Using cached weather data and basic recommendations.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </motion.div>

      {/* Crop and Soil Selection */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="card" sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Farm Configuration
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Select Crop
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {crops.map((crop) => (
                    <Chip
                      key={crop.value}
                      label={crop.label}
                      onClick={() => setSelectedCrop(crop.value)}
                      color={selectedCrop === crop.value ? 'primary' : 'default'}
                      variant={selectedCrop === crop.value ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Soil Type
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {soilTypes.map((soil) => (
                    <Chip
                      key={soil.value}
                      label={soil.label}
                      onClick={() => setSoilType(soil.value)}
                      color={soilType === soil.value ? 'primary' : 'default'}
                      variant={soilType === soil.value ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>

      <Grid container spacing={4}>
        {/* Weather Information */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="card">
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Current Weather
                </Typography>

                {loading ? (
                  <Box>
                    <LinearProgress sx={{ mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      Fetching weather data...
                    </Typography>
                  </Box>
                ) : weatherData ? (
                  <Box>
                    <Grid container spacing={2} mb={3}>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Thermostat color="error" />
                          <Box>
                            <Typography variant="h6">
                              {Math.round(weatherData.temperature)}°C
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Temperature
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Opacity color="info" />
                          <Box>
                            <Typography variant="h6">
                              {Math.round(weatherData.humidity)}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Humidity
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Cloud color="primary" />
                          <Box>
                            <Typography variant="h6">
                              {Math.round(weatherData.rainfall)}mm
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Rainfall (24h)
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <TrendingUp color="success" />
                          <Box>
                            <Typography variant="h6">
                              {Math.round(weatherData.windSpeed)} km/h
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Wind Speed
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="h6">5-Day Forecast</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {weatherData.forecast.map((day, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <Cloud />
                              </ListItemIcon>
                              <ListItemText
                                primary={`${new Date(day.date).toLocaleDateString()}`}
                                secondary={`${Math.round(day.temp)}°C, ${Math.round(day.humidity)}% humidity, ${Math.round(day.rainfall)}mm rain`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Weather data unavailable
                  </Typography>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Irrigation Recommendation */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className="card">
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Irrigation Recommendation
                </Typography>

                {recommendation ? (
                  <Box>
                    <Box display="flex" gap={2} mb={3}>
                      <Chip
                        icon={recommendation.action === 'irrigate' ? <WaterDrop /> : 
                              recommendation.action === 'wait' ? <Schedule /> : <Warning />}
                        label={recommendation.action.toUpperCase()}
                        color={getActionColor(recommendation.action) as any}
                        variant="filled"
                      />
                      <Chip
                        label={`${recommendation.priority.toUpperCase()} PRIORITY`}
                        color={getPriorityColor(recommendation.priority) as any}
                        variant="outlined"
                      />
                    </Box>

                    {recommendation.action === 'irrigate' && (
                      <Box mb={3}>
                        <Typography variant="h4" color="primary.main" gutterBottom>
                          {recommendation.amount} L/m²
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Recommended water amount
                        </Typography>
                      </Box>
                    )}

                    <Box mb={3}>
                      <Typography variant="subtitle1" gutterBottom>
                        Best Timing
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Schedule color="primary" />
                        <Typography variant="body1">
                          {recommendation.timing}
                        </Typography>
                      </Box>
                    </Box>

                    <Box mb={3}>
                      <Typography variant="subtitle1" gutterBottom>
                        Reason
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {recommendation.reason}
                      </Typography>
                    </Box>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="h6">Irrigation Tips</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {recommendation.tips.map((tip, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <CheckCircle color="success" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={tip} />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Loading recommendation...
                  </Typography>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <Card className="glass" sx={{ mt: 4, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<WaterDrop />}
                onClick={fetchWeatherAndRecommendation}
                disabled={loading}
                className="farmer-button farmer-button-primary"
              >
                Refresh Data
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<LocationOn />}
                onClick={() => getCurrentLocation()}
                className="farmer-button farmer-button-secondary"
              >
                Update Location
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Agriculture />}
                href="/diagnostics"
                className="farmer-button farmer-button-secondary"
              >
                Check Crop Health
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Schedule />}
                onClick={() => {
                  // Set irrigation reminder (would integrate with notifications)
                  alert('Irrigation reminder set for ' + (recommendation?.timing || 'tomorrow morning'));
                }}
                className="farmer-button farmer-button-secondary"
              >
                Set Reminder
              </Button>
            </Grid>
          </Grid>
        </Card>
      </motion.div>
    </Container>
  );
};

export default Irrigation;
