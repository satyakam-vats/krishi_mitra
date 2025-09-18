const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const router = express.Router();

// Mock weather data for development/offline mode
const generateMockWeatherData = (lat, lon) => ({
  current: {
    temperature: 25 + Math.random() * 15,
    humidity: 50 + Math.random() * 40,
    rainfall: Math.random() * 10,
    windSpeed: 5 + Math.random() * 15,
    pressure: 1010 + Math.random() * 20,
    uvIndex: Math.random() * 10,
    visibility: 8 + Math.random() * 7,
  },
  forecast: Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    temperature: {
      min: 18 + Math.random() * 10,
      max: 28 + Math.random() * 12,
    },
    humidity: 40 + Math.random() * 50,
    rainfall: Math.random() * 15,
    windSpeed: 3 + Math.random() * 12,
    condition: ['sunny', 'cloudy', 'rainy', 'partly-cloudy'][Math.floor(Math.random() * 4)],
  })),
  location: {
    latitude: lat,
    longitude: lon,
    name: 'Sample Location',
  },
});

// @route   GET /api/weather/current
// @desc    Get current weather data
// @access  Private
router.get('/current', auth, async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        error: 'Missing Parameters',
        message: 'Latitude and longitude are required',
      });
    }

    let weatherData;

    if (process.env.OPENWEATHER_API_KEY && process.env.NODE_ENV === 'production') {
      // Use real OpenWeather API in production
      try {
        const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
          params: {
            lat,
            lon,
            appid: process.env.OPENWEATHER_API_KEY,
            units: 'metric',
          },
          timeout: 5000,
        });

        const data = response.data;
        weatherData = {
          current: {
            temperature: data.main.temp,
            humidity: data.main.humidity,
            rainfall: data.rain?.['1h'] || 0,
            windSpeed: data.wind.speed * 3.6, // Convert m/s to km/h
            pressure: data.main.pressure,
            uvIndex: 0, // Not available in current weather API
            visibility: data.visibility / 1000, // Convert to km
          },
          location: {
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
            name: data.name,
          },
        };
      } catch (apiError) {
        console.error('OpenWeather API error:', apiError.message);
        // Fallback to mock data
        weatherData = generateMockWeatherData(parseFloat(lat), parseFloat(lon));
      }
    } else {
      // Use mock data for development
      weatherData = generateMockWeatherData(parseFloat(lat), parseFloat(lon));
    }

    res.json({
      message: 'Weather data retrieved successfully',
      data: weatherData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Weather fetch error:', error);
    res.status(500).json({
      error: 'Weather Fetch Failed',
      message: 'Unable to fetch weather data',
    });
  }
});

// @route   GET /api/weather/forecast
// @desc    Get weather forecast
// @access  Private
router.get('/forecast', auth, async (req, res) => {
  try {
    const { lat, lon, days = 7 } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        error: 'Missing Parameters',
        message: 'Latitude and longitude are required',
      });
    }

    let forecastData;

    if (process.env.OPENWEATHER_API_KEY && process.env.NODE_ENV === 'production') {
      try {
        const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
          params: {
            lat,
            lon,
            appid: process.env.OPENWEATHER_API_KEY,
            units: 'metric',
            cnt: Math.min(parseInt(days) * 8, 40), // API returns 3-hour intervals
          },
          timeout: 5000,
        });

        const data = response.data;
        
        // Process forecast data into daily summaries
        const dailyForecasts = {};
        data.list.forEach(item => {
          const date = item.dt_txt.split(' ')[0];
          if (!dailyForecasts[date]) {
            dailyForecasts[date] = {
              date,
              temperatures: [],
              humidity: [],
              rainfall: 0,
              windSpeed: [],
              conditions: [],
            };
          }
          
          dailyForecasts[date].temperatures.push(item.main.temp);
          dailyForecasts[date].humidity.push(item.main.humidity);
          dailyForecasts[date].rainfall += item.rain?.['3h'] || 0;
          dailyForecasts[date].windSpeed.push(item.wind.speed * 3.6);
          dailyForecasts[date].conditions.push(item.weather[0].main);
        });

        forecastData = Object.values(dailyForecasts).map(day => ({
          date: day.date,
          temperature: {
            min: Math.min(...day.temperatures),
            max: Math.max(...day.temperatures),
          },
          humidity: day.humidity.reduce((a, b) => a + b) / day.humidity.length,
          rainfall: day.rainfall,
          windSpeed: day.windSpeed.reduce((a, b) => a + b) / day.windSpeed.length,
          condition: day.conditions[0], // Use first condition of the day
        }));
      } catch (apiError) {
        console.error('OpenWeather forecast API error:', apiError.message);
        // Fallback to mock data
        const mockData = generateMockWeatherData(parseFloat(lat), parseFloat(lon));
        forecastData = mockData.forecast.slice(0, parseInt(days));
      }
    } else {
      // Use mock data for development
      const mockData = generateMockWeatherData(parseFloat(lat), parseFloat(lon));
      forecastData = mockData.forecast.slice(0, parseInt(days));
    }

    res.json({
      message: 'Forecast data retrieved successfully',
      data: {
        forecast: forecastData,
        location: {
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Forecast fetch error:', error);
    res.status(500).json({
      error: 'Forecast Fetch Failed',
      message: 'Unable to fetch forecast data',
    });
  }
});

// @route   POST /api/weather/irrigation-advice
// @desc    Get irrigation recommendations based on weather
// @access  Private
router.post('/irrigation-advice', auth, [
  body('crop').trim().isLength({ min: 1 }).withMessage('Crop type is required'),
  body('soilType').isIn(['sandy', 'loamy', 'clay']).withMessage('Invalid soil type'),
  body('farmSize').isNumeric().withMessage('Farm size must be a number'),
  body('location.latitude').isFloat({ min: -90, max: 90 }),
  body('location.longitude').isFloat({ min: -180, max: 180 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array(),
      });
    }

    const { crop, soilType, farmSize, location } = req.body;

    // Get current weather and forecast
    const weatherResponse = await axios.get(`${req.protocol}://${req.get('host')}/api/weather/current`, {
      params: {
        lat: location.latitude,
        lon: location.longitude,
      },
      headers: {
        Authorization: req.headers.authorization,
      },
    });

    const weather = weatherResponse.data.data.current;

    // Calculate irrigation recommendation
    const recommendation = calculateIrrigationRecommendation(weather, crop, soilType, farmSize);

    res.json({
      message: 'Irrigation advice generated successfully',
      recommendation,
      weather,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Irrigation advice error:', error);
    res.status(500).json({
      error: 'Advice Generation Failed',
      message: 'Unable to generate irrigation advice',
    });
  }
});

// Helper function to calculate irrigation recommendations
const calculateIrrigationRecommendation = (weather, crop, soilType, farmSize) => {
  const cropWaterNeeds = {
    tomato: { base: 25, multiplier: 1.2 },
    wheat: { base: 20, multiplier: 1.0 },
    rice: { base: 35, multiplier: 1.5 },
    corn: { base: 22, multiplier: 1.1 },
    potato: { base: 18, multiplier: 0.9 },
    onion: { base: 15, multiplier: 0.8 },
  };

  const soilFactors = {
    sandy: 1.3,
    loamy: 1.0,
    clay: 0.8,
  };

  const cropData = cropWaterNeeds[crop.toLowerCase()] || cropWaterNeeds.tomato;
  let baseAmount = cropData.base;
  let action = 'irrigate';
  let priority = 'medium';

  // Adjust based on weather conditions
  if (weather.rainfall > 10) {
    action = 'wait';
    priority = 'low';
    baseAmount = 0;
  } else if (weather.temperature > 35 || weather.humidity < 30) {
    priority = 'high';
    baseAmount *= 1.4;
  } else if (weather.temperature < 15 || weather.humidity > 85) {
    action = 'reduce';
    baseAmount *= 0.6;
  }

  // Adjust for crop and soil
  baseAmount *= cropData.multiplier;
  baseAmount *= soilFactors[soilType];

  // Calculate total water needed
  const totalWaterNeeded = baseAmount * farmSize;

  const tips = [
    'Water early morning (6-8 AM) or evening (6-8 PM)',
    'Check soil moisture before watering',
    'Apply water slowly for better absorption',
  ];

  if (weather.temperature > 30) {
    tips.push('Consider shade cloth during hottest hours');
  }

  if (weather.humidity < 50) {
    tips.push('Increase watering frequency slightly');
  }

  return {
    action,
    priority,
    amount: Math.round(baseAmount),
    totalWaterNeeded: Math.round(totalWaterNeeded),
    timing: weather.temperature > 30 ? 'Early morning (5-7 AM)' : 'Early morning (6-8 AM)',
    reason: `Based on temperature (${Math.round(weather.temperature)}°C), humidity (${Math.round(weather.humidity)}%), and rainfall (${Math.round(weather.rainfall)}mm)`,
    tips,
    nextCheck: '24 hours',
  };
};

// @route   GET /api/weather/alerts
// @desc    Get weather alerts and warnings
// @access  Private
router.get('/alerts', auth, async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        error: 'Missing Parameters',
        message: 'Latitude and longitude are required',
      });
    }

    // Mock weather alerts (in production, integrate with weather alert APIs)
    const alerts = [];

    // Generate sample alerts based on mock conditions
    const temperature = 25 + Math.random() * 15;
    const rainfall = Math.random() * 20;

    if (temperature > 35) {
      alerts.push({
        id: 'heat-warning',
        type: 'heat',
        severity: 'high',
        title: 'Heat Wave Warning',
        description: 'Extreme heat expected. Increase irrigation frequency and provide shade for crops.',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        recommendations: [
          'Water crops early morning and evening',
          'Provide shade cloth if possible',
          'Monitor for heat stress symptoms',
        ],
      });
    }

    if (rainfall > 15) {
      alerts.push({
        id: 'heavy-rain',
        type: 'rain',
        severity: 'medium',
        title: 'Heavy Rainfall Expected',
        description: 'Heavy rain forecasted. Ensure proper drainage and reduce irrigation.',
        startTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
        recommendations: [
          'Check drainage systems',
          'Reduce or skip irrigation',
          'Protect crops from waterlogging',
        ],
      });
    }

    res.json({
      message: 'Weather alerts retrieved successfully',
      alerts,
      location: {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Weather alerts error:', error);
    res.status(500).json({
      error: 'Alerts Fetch Failed',
      message: 'Unable to fetch weather alerts',
    });
  }
});

module.exports = router;
