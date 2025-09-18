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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  LocalShipping,
  Store,
  Agriculture,
  Phone,
  LocationOn,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useOffline } from '../context/OfflineContext';

interface MarketPrice {
  crop: string;
  variety: string;
  price: number;
  unit: string;
  change: number;
  market: string;
  date: string;
  quality: 'A' | 'B' | 'C';
}

interface MarketTrend {
  crop: string;
  currentPrice: number;
  weeklyChange: number;
  monthlyChange: number;
  seasonalTrend: 'rising' | 'falling' | 'stable';
  bestSellingTime: string;
}

interface Buyer {
  name: string;
  location: string;
  crops: string[];
  phone: string;
  rating: number;
  minQuantity: number;
  priceRange: string;
}

const Market: React.FC = () => {
  const { saveOfflineData, isOnline } = useOffline();
  
  const [activeTab, setActiveTab] = useState(0);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [trends, setTrends] = useState<MarketTrend[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string>('all');

  const cropOptions = [
    { value: 'all', label: 'All Crops' },
    { value: 'tomato', label: 'Tomato' },
    { value: 'wheat', label: 'Wheat' },
    { value: 'rice', label: 'Rice' },
    { value: 'corn', label: 'Corn' },
    { value: 'potato', label: 'Potato' },
    { value: 'onion', label: 'Onion' },
  ];

  useEffect(() => {
    fetchMarketData();
  }, [selectedCrop]);

  const fetchMarketData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (isOnline) {
        // Fetch real market data (mock implementation)
        const [pricesData, trendsData, buyersData] = await Promise.all([
          fetchMarketPrices(),
          fetchMarketTrends(),
          fetchBuyers(),
        ]);
        
        setMarketPrices(pricesData);
        setTrends(trendsData);
        setBuyers(buyersData);
        
        // Save data offline
        await saveOfflineData('market_data', {
          prices: pricesData,
          trends: trendsData,
          buyers: buyersData,
          timestamp: Date.now(),
        });
      } else {
        // Use offline mock data
        const mockData = generateMockMarketData();
        setMarketPrices(mockData.prices);
        setTrends(mockData.trends);
        setBuyers(mockData.buyers);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
      
      // Fallback to basic data
      const fallbackData = generateMockMarketData();
      setMarketPrices(fallbackData.prices);
      setTrends(fallbackData.trends);
      setBuyers(fallbackData.buyers);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketPrices = async (): Promise<MarketPrice[]> => {
    // Mock API call - in production, use government agricultural APIs
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const crops = ['Tomato', 'Wheat', 'Rice', 'Corn', 'Potato', 'Onion'];
    const markets = ['Delhi Mandi', 'Mumbai APMC', 'Bangalore Market', 'Chennai Koyambedu'];
    
    return crops.flatMap(crop => 
      markets.map(market => ({
        crop,
        variety: `${crop} - Grade A`,
        price: 20 + Math.random() * 80,
        unit: 'per kg',
        change: (Math.random() - 0.5) * 10,
        market,
        date: new Date().toISOString().split('T')[0],
        quality: 'A' as const,
      }))
    );
  };

  const fetchMarketTrends = async (): Promise<MarketTrend[]> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const crops = ['Tomato', 'Wheat', 'Rice', 'Corn', 'Potato', 'Onion'];
    
    return crops.map(crop => ({
      crop,
      currentPrice: 30 + Math.random() * 70,
      weeklyChange: (Math.random() - 0.5) * 20,
      monthlyChange: (Math.random() - 0.5) * 40,
      seasonalTrend: ['rising', 'falling', 'stable'][Math.floor(Math.random() * 3)] as any,
      bestSellingTime: ['Morning (6-9 AM)', 'Evening (4-7 PM)', 'Early Morning (5-8 AM)'][Math.floor(Math.random() * 3)],
    }));
  };

  const fetchBuyers = async (): Promise<Buyer[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return [
      {
        name: 'Fresh Produce Co.',
        location: 'Delhi',
        crops: ['Tomato', 'Potato', 'Onion'],
        phone: '+91 98765 43210',
        rating: 4.5,
        minQuantity: 100,
        priceRange: '₹25-45/kg',
      },
      {
        name: 'Green Valley Traders',
        location: 'Mumbai',
        crops: ['Wheat', 'Rice', 'Corn'],
        phone: '+91 87654 32109',
        rating: 4.2,
        minQuantity: 500,
        priceRange: '₹18-35/kg',
      },
      {
        name: 'Organic Harvest Ltd.',
        location: 'Bangalore',
        crops: ['Tomato', 'Potato', 'Wheat'],
        phone: '+91 76543 21098',
        rating: 4.8,
        minQuantity: 50,
        priceRange: '₹30-60/kg',
      },
    ];
  };

  const generateMockMarketData = () => {
    const crops = ['Tomato', 'Wheat', 'Rice', 'Corn', 'Potato', 'Onion'];
    const markets = ['Local Mandi', 'Regional Market'];
    
    return {
      prices: crops.map(crop => ({
        crop,
        variety: `${crop} - Local`,
        price: 25 + Math.random() * 50,
        unit: 'per kg',
        change: (Math.random() - 0.5) * 8,
        market: markets[Math.floor(Math.random() * markets.length)],
        date: new Date().toISOString().split('T')[0],
        quality: 'B' as const,
      })),
      trends: crops.map(crop => ({
        crop,
        currentPrice: 30 + Math.random() * 40,
        weeklyChange: (Math.random() - 0.5) * 15,
        monthlyChange: (Math.random() - 0.5) * 30,
        seasonalTrend: 'stable' as const,
        bestSellingTime: 'Morning (6-9 AM)',
      })),
      buyers: [
        {
          name: 'Local Trader',
          location: 'Nearby Market',
          crops: ['Tomato', 'Potato'],
          phone: '+91 99999 88888',
          rating: 4.0,
          minQuantity: 25,
          priceRange: '₹20-40/kg',
        },
      ],
    };
  };

  const filteredPrices = selectedCrop === 'all' 
    ? marketPrices 
    : marketPrices.filter(price => price.crop.toLowerCase() === selectedCrop);

  const filteredTrends = selectedCrop === 'all'
    ? trends
    : trends.filter(trend => trend.crop.toLowerCase() === selectedCrop);

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp color="success" />;
    if (change < 0) return <TrendingDown color="error" />;
    return <TrendingUp color="warning" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'success';
    if (change < 0) return 'error';
    return 'warning';
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography variant="h2" component="h1" textAlign="center" gutterBottom>
          Market Intelligence
        </Typography>
        <Typography variant="body1" textAlign="center" color="text.secondary" paragraph>
          Real-time crop prices and market trends in your region
        </Typography>

        {!isOnline && (
          <Alert severity="info" sx={{ mb: 3 }}>
            You're offline. Showing cached market data. Connect to internet for latest prices.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </motion.div>

      {/* Crop Filter */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card className="card" sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filter by Crop
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {cropOptions.map((crop) => (
                <Chip
                  key={crop.value}
                  label={crop.label}
                  onClick={() => setSelectedCrop(crop.value)}
                  color={selectedCrop === crop.value ? 'primary' : 'default'}
                  variant={selectedCrop === crop.value ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Current Prices" />
          <Tab label="Market Trends" />
          <Tab label="Buyers Directory" />
        </Tabs>
      </Box>

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* Current Prices Tab */}
      {activeTab === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="card">
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Current Market Prices
              </Typography>
              <TableContainer component={Paper} sx={{ backgroundColor: 'transparent' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Crop</TableCell>
                      <TableCell>Market</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Change</TableCell>
                      <TableCell>Quality</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPrices.map((price, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Agriculture color="primary" fontSize="small" />
                            {price.crop}
                          </Box>
                        </TableCell>
                        <TableCell>{price.market}</TableCell>
                        <TableCell align="right">
                          <Typography variant="h6" color="primary.main">
                            ₹{price.price.toFixed(2)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {price.unit}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                            {getTrendIcon(price.change)}
                            <Typography
                              variant="body2"
                              color={`${getTrendColor(price.change)}.main`}
                            >
                              {price.change > 0 ? '+' : ''}{price.change.toFixed(1)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`Grade ${price.quality}`}
                            size="small"
                            color={price.quality === 'A' ? 'success' : price.quality === 'B' ? 'warning' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{price.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Market Trends Tab */}
      {activeTab === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Grid container spacing={3}>
            {filteredTrends.map((trend, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card className="card">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">{trend.crop}</Typography>
                      <Chip
                        label={trend.seasonalTrend}
                        color={
                          trend.seasonalTrend === 'rising' ? 'success' :
                          trend.seasonalTrend === 'falling' ? 'error' : 'warning'
                        }
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="h4" color="primary.main" gutterBottom>
                      ₹{trend.currentPrice.toFixed(2)}/kg
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getTrendIcon(trend.weeklyChange)}
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Weekly
                            </Typography>
                            <Typography
                              variant="body1"
                              color={`${getTrendColor(trend.weeklyChange)}.main`}
                            >
                              {trend.weeklyChange > 0 ? '+' : ''}{trend.weeklyChange.toFixed(1)}%
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getTrendIcon(trend.monthlyChange)}
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Monthly
                            </Typography>
                            <Typography
                              variant="body1"
                              color={`${getTrendColor(trend.monthlyChange)}.main`}
                            >
                              {trend.monthlyChange > 0 ? '+' : ''}{trend.monthlyChange.toFixed(1)}%
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    <Box mt={2}>
                      <Typography variant="body2" color="text.secondary">
                        Best selling time: {trend.bestSellingTime}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      )}

      {/* Buyers Directory Tab */}
      {activeTab === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Grid container spacing={3}>
            {buyers.map((buyer, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card className="card">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Typography variant="h6">{buyer.name}</Typography>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography variant="body2">★</Typography>
                        <Typography variant="body2">{buyer.rating}</Typography>
                      </Box>
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <LocationOn color="primary" fontSize="small" />
                      <Typography variant="body2">{buyer.location}</Typography>
                    </Box>
                    
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Interested in:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {buyer.crops.map((crop, cropIndex) => (
                          <Chip key={cropIndex} label={crop} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </Box>
                    
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        Min Quantity: {buyer.minQuantity} kg
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Price Range: {buyer.priceRange}
                      </Typography>
                    </Box>
                    
                    <Button
                      variant="contained"
                      startIcon={<Phone />}
                      fullWidth
                      href={`tel:${buyer.phone}`}
                      className="farmer-button farmer-button-primary"
                    >
                      Call {buyer.phone}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </motion.div>
      )}

      {/* Quick Actions */}
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
                startIcon={<TrendingUp />}
                onClick={fetchMarketData}
                disabled={loading}
                className="farmer-button farmer-button-primary"
              >
                Refresh Prices
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<AttachMoney />}
                onClick={() => alert('Price alert feature coming soon!')}
                className="farmer-button farmer-button-secondary"
              >
                Set Price Alert
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<LocalShipping />}
                href="tel:+911234567890"
                className="farmer-button farmer-button-secondary"
              >
                Find Transport
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Store />}
                onClick={() => setActiveTab(2)}
                className="farmer-button farmer-button-secondary"
              >
                Contact Buyers
              </Button>
            </Grid>
          </Grid>
        </Card>
      </motion.div>
    </Container>
  );
};

export default Market;
