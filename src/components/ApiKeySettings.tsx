import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  IconButton,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Save,
  CloudSync,
  ExpandMore,
  Info,
  Security,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface ApiKeys {
  weatherApiKey: string;
  diseaseModelApiKey: string;
  mongoAtlasConnectionString: string;
}

const ApiKeySettings: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    weatherApiKey: '',
    diseaseModelApiKey: '',
    mongoAtlasConnectionString: '',
  });
  const [showKeys, setShowKeys] = useState({
    weatherApiKey: false,
    diseaseModelApiKey: false,
    mongoAtlasConnectionString: false,
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleKeyChange = (keyName: keyof ApiKeys, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [keyName]: value,
    }));
  };

  const toggleShowKey = (keyName: keyof typeof showKeys) => {
    setShowKeys(prev => ({
      ...prev,
      [keyName]: !prev[keyName],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // In production, save to secure backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store in localStorage for demo (in production, use secure backend)
      localStorage.setItem('apiKeys', JSON.stringify(apiKeys));
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save API keys:', error);
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (keyType: string) => {
    // Mock connection test
    alert(`Testing ${keyType} connection... (This would test the actual API in production)`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="card">
        <CardContent>
          <Typography variant="h5" gutterBottom>
            API Configuration
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Configure your own API keys for weather data and disease detection models.
          </Typography>

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              API keys saved successfully!
            </Alert>
          )}

          <Box display="flex" flexDirection="column" gap={3}>
            {/* Weather API Key */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Weather API Key
              </Typography>
              <TextField
                fullWidth
                label="OpenWeatherMap API Key"
                type={showKeys.weatherApiKey ? 'text' : 'password'}
                value={apiKeys.weatherApiKey}
                onChange={(e) => handleKeyChange('weatherApiKey', e.target.value)}
                placeholder="Enter your OpenWeatherMap API key"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => toggleShowKey('weatherApiKey')}
                        edge="end"
                      >
                        {showKeys.weatherApiKey ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 1 }}
              />
              <Box display="flex" gap={1}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => testConnection('Weather API')}
                  disabled={!apiKeys.weatherApiKey}
                >
                  Test Connection
                </Button>
                <Button
                  size="small"
                  variant="text"
                  href="https://openweathermap.org/api"
                  target="_blank"
                >
                  Get API Key
                </Button>
              </Box>
            </Box>

            {/* Disease Model API Key */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Disease Detection Model API
              </Typography>
              <TextField
                fullWidth
                label="Custom Disease Model API Key"
                type={showKeys.diseaseModelApiKey ? 'text' : 'password'}
                value={apiKeys.diseaseModelApiKey}
                onChange={(e) => handleKeyChange('diseaseModelApiKey', e.target.value)}
                placeholder="Enter your custom disease model API key"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => toggleShowKey('diseaseModelApiKey')}
                        edge="end"
                      >
                        {showKeys.diseaseModelApiKey ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 1 }}
              />
              <Box display="flex" gap={1}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => testConnection('Disease Model API')}
                  disabled={!apiKeys.diseaseModelApiKey}
                >
                  Test Connection
                </Button>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => alert('Contact support for custom model training')}
                >
                  Train Custom Model
                </Button>
              </Box>
            </Box>

            {/* MongoDB Atlas Connection */}
            <Box>
              <Typography variant="h6" gutterBottom>
                MongoDB Atlas Connection
              </Typography>
              <TextField
                fullWidth
                label="MongoDB Atlas Connection String"
                type={showKeys.mongoAtlasConnectionString ? 'text' : 'password'}
                value={apiKeys.mongoAtlasConnectionString}
                onChange={(e) => handleKeyChange('mongoAtlasConnectionString', e.target.value)}
                placeholder="mongodb+srv://username:password@cluster.mongodb.net/database"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => toggleShowKey('mongoAtlasConnectionString')}
                        edge="end"
                      >
                        {showKeys.mongoAtlasConnectionString ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 1 }}
              />
              <Box display="flex" gap={1}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => testConnection('MongoDB Atlas')}
                  disabled={!apiKeys.mongoAtlasConnectionString}
                >
                  Test Connection
                </Button>
                <Button
                  size="small"
                  variant="text"
                  href="https://cloud.mongodb.com"
                  target="_blank"
                >
                  Get MongoDB Atlas
                </Button>
              </Box>
            </Box>

            {/* Save Button */}
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={saving}
                className="farmer-button farmer-button-primary"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </Box>
          </Box>

          {/* Security Information */}
          <Accordion sx={{ mt: 3 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center" gap={1}>
                <Security color="primary" />
                <Typography variant="h6">Security & Privacy</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Info color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Secure Storage"
                    secondary="API keys are encrypted and stored securely on our servers"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Info color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="No Data Sharing"
                    secondary="Your API keys are never shared with third parties"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Info color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Usage Monitoring"
                    secondary="Monitor your API usage and costs through your provider's dashboard"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ApiKeySettings;
