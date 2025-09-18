import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  Grid,
  InputAdornment,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Person,
  Email,
  Lock,
  Phone,
  LocationOn,
  Agriculture,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    farmSize: '',
    soilType: '',
    crops: [] as string[],
    location: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cropOptions = [
    'Tomato', 'Wheat', 'Rice', 'Corn', 'Potato', 'Onion', 
    'Cabbage', 'Carrot', 'Beans', 'Peas', 'Cucumber', 'Spinach'
  ];

  const soilTypes = [
    'Sandy', 'Loamy', 'Clay', 'Silt', 'Peaty', 'Chalky'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handleSelectChange = (name: string, value: any) => {
    setFormData({
      ...formData,
      [name]: value,
    });
    setError(null);
  };

  const handleCropToggle = (crop: string) => {
    const newCrops = formData.crops.includes(crop)
      ? formData.crops.filter(c => c !== crop)
      : [...formData.crops, crop];
    
    setFormData({
      ...formData,
      crops: newCrops,
    });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    if (formData.crops.length === 0) {
      setError('Please select at least one crop');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        farmDetails: {
          size: parseFloat(formData.farmSize) || 0,
          crops: formData.crops,
          soilType: formData.soilType,
        },
        location: {
          address: formData.location,
        },
      };

      const success = await register(userData);
      if (success) {
        navigate('/');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 10, mb: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box textAlign="center" mb={4}>
          <Agriculture sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h2" component="h1" gutterBottom>
            Join AgriAdvisor
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create your account and start smart farming today
          </Typography>
        </Box>

        <Card className="card">
          <CardContent sx={{ p: 4 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Personal Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom color="primary.main">
                    Personal Information
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        minHeight: '56px',
                        borderRadius: '12px',
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        minHeight: '56px',
                        borderRadius: '12px',
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        minHeight: '56px',
                        borderRadius: '12px',
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOn color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        minHeight: '56px',
                        borderRadius: '12px',
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="primary" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        minHeight: '56px',
                        borderRadius: '12px',
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="primary" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        minHeight: '56px',
                        borderRadius: '12px',
                      },
                    }}
                  />
                </Grid>

                {/* Farm Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom color="primary.main" sx={{ mt: 2 }}>
                    Farm Information
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Farm Size (acres)"
                    name="farmSize"
                    type="number"
                    value={formData.farmSize}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Agriculture color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        minHeight: '56px',
                        borderRadius: '12px',
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Soil Type</InputLabel>
                    <Select
                      value={formData.soilType}
                      label="Soil Type"
                      onChange={(e) => handleSelectChange('soilType', e.target.value)}
                      sx={{
                        minHeight: '56px',
                        borderRadius: '12px',
                      }}
                    >
                      {soilTypes.map((soil) => (
                        <MenuItem key={soil} value={soil.toLowerCase()}>
                          {soil}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Select Your Crops *
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {cropOptions.map((crop) => (
                      <Chip
                        key={crop}
                        label={crop}
                        onClick={() => handleCropToggle(crop)}
                        color={formData.crops.includes(crop) ? 'primary' : 'default'}
                        variant={formData.crops.includes(crop) ? 'filled' : 'outlined'}
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Select all crops you grow or plan to grow
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    className="farmer-button farmer-button-primary"
                    sx={{ mt: 2 }}
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </Grid>
              </Grid>
            </form>

            <Box textAlign="center" mt={3}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link 
                  to="/login" 
                  style={{ 
                    color: '#2e7d32', 
                    textDecoration: 'none',
                    fontWeight: 500 
                  }}
                >
                  Sign in here
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Box textAlign="center" mt={3}>
          <Typography variant="body2" color="text.secondary">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </Typography>
        </Box>
      </motion.div>
    </Container>
  );
};

export default Register;
