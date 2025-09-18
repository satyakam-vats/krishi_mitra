import React, { useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CameraAlt,
  Upload,
  ExpandMore,
  CheckCircle,
  Warning,
  LocalHospital,
  Agriculture,
  WaterDrop,
  BugReport,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useCamera } from '../hooks/useCamera';
import { useOffline } from '../context/OfflineContext';
import { useDiseaseDetection } from '../hooks/useDiseaseDetection';

interface DiagnosisResult {
  disease: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  symptoms: string[];
  treatments: string[];
  prevention: string[];
  organicTreatments?: string[];
}

const Diagnostics: React.FC = () => {
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { captureImage, captureFromInput } = useCamera();
  const { saveOfflineData, isOnline } = useOffline();
  const { analyzeImage, isAnalyzing } = useDiseaseDetection();

  const [selectedImage, setSelectedImage] = useState<string | null>(
    location.state?.capturedImage?.dataUrl || null
  );
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCameraCapture = useCallback(async () => {
    try {
      setError(null);
      const image = await captureImage({
        width: 1920,
        height: 1080,
        quality: 0.8,
      });
      setSelectedImage(image.dataUrl);
      
      // Save image offline
      await saveOfflineData('captured_image', {
        dataUrl: image.dataUrl,
        timestamp: image.timestamp,
        source: 'camera',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Camera capture failed');
    }
  }, [captureImage, saveOfflineData]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const image = await captureFromInput(file);
      setSelectedImage(image.dataUrl);
      
      // Save image offline
      await saveOfflineData('uploaded_image', {
        dataUrl: image.dataUrl,
        timestamp: image.timestamp,
        source: 'upload',
        fileName: file.name,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'File upload failed');
    }
  }, [captureFromInput, saveOfflineData]);

  const handleAnalyze = useCallback(async () => {
    if (!selectedImage) return;

    try {
      setError(null);
      const result = await analyzeImage(selectedImage);
      setDiagnosis(result);
      
      // Save diagnosis offline
      await saveOfflineData('diagnosis', {
        image: selectedImage,
        result,
        timestamp: Date.now(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    }
  }, [selectedImage, analyzeImage, saveOfflineData]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return <CheckCircle />;
      case 'medium': return <Warning />;
      case 'high': return <BugReport />;
      default: return <Agriculture />;
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
          Crop Disease Detection
        </Typography>
        <Typography variant="body1" textAlign="center" color="text.secondary" paragraph>
          Upload or capture an image of your crop for AI-powered disease analysis
        </Typography>

        {!isOnline && (
          <Alert severity="info" sx={{ mb: 3 }}>
            You're offline. Basic disease detection is available. Results will sync when you're back online.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </motion.div>

      <Grid container spacing={4}>
        {/* Image Capture Section */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="card">
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Capture Crop Image
                </Typography>

                {selectedImage ? (
                  <Box>
                    <img
                      src={selectedImage}
                      alt="Selected crop"
                      style={{
                        width: '100%',
                        maxHeight: '300px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        marginBottom: '16px',
                      }}
                    />
                    <Box display="flex" gap={2}>
                      <Button
                        variant="outlined"
                        onClick={() => setSelectedImage(null)}
                        fullWidth
                      >
                        Clear Image
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        fullWidth
                        className="farmer-button farmer-button-primary"
                      >
                        {isAnalyzing ? (
                          <>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            Analyzing...
                          </>
                        ) : (
                          'Analyze Crop'
                        )}
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Take a clear photo of the affected crop area or upload an existing image
                    </Typography>

                    <Box display="flex" flexDirection="column" gap={2}>
                      <Button
                        variant="contained"
                        startIcon={<CameraAlt />}
                        onClick={handleCameraCapture}
                        className="farmer-button farmer-button-primary"
                        fullWidth
                      >
                        Take Photo
                      </Button>

                      <Button
                        variant="outlined"
                        startIcon={<Upload />}
                        onClick={() => fileInputRef.current?.click()}
                        className="farmer-button farmer-button-secondary"
                        fullWidth
                      >
                        Upload Image
                      </Button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                    </Box>

                    <Box mt={3}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Tips for better results:
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircle color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Take photos in good lighting"
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircle color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Focus on affected areas"
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <CheckCircle color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Include healthy parts for comparison"
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      </List>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Results Section */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="card">
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Analysis Results
                </Typography>

                {diagnosis ? (
                  <Box>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Chip
                        icon={getSeverityIcon(diagnosis.severity)}
                        label={`${diagnosis.disease} - ${diagnosis.severity.toUpperCase()}`}
                        color={getSeverityColor(diagnosis.severity) as any}
                        variant="outlined"
                      />
                      <Typography variant="body2" color="text.secondary">
                        {Math.round(diagnosis.confidence * 100)}% confidence
                      </Typography>
                    </Box>

                    <Typography variant="body1" paragraph>
                      {diagnosis.description}
                    </Typography>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="h6">Symptoms</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {diagnosis.symptoms.map((symptom, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <Warning color="warning" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={symptom} />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="h6">Treatment Options</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {diagnosis.treatments.map((treatment, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <LocalHospital color="primary" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={treatment} />
                            </ListItem>
                          ))}
                        </List>
                        
                        {diagnosis.organicTreatments && (
                          <Box mt={2}>
                            <Typography variant="subtitle2" color="success.main" gutterBottom>
                              Organic Alternatives:
                            </Typography>
                            <List dense>
                              {diagnosis.organicTreatments.map((treatment, index) => (
                                <ListItem key={index}>
                                  <ListItemIcon>
                                    <Agriculture color="success" fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText primary={treatment} />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}
                      </AccordionDetails>
                    </Accordion>

                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="h6">Prevention Tips</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {diagnosis.prevention.map((tip, index) => (
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
                  <Box textAlign="center" py={4}>
                    <Agriculture sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      Upload or capture an image to get started with AI-powered crop analysis
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Card className="glass" sx={{ mt: 4, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Need More Help?
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<WaterDrop />}
                href="/irrigation"
              >
                Irrigation Advice
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Agriculture />}
                href="tel:+911234567890"
              >
                Call Expert
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<LocalHospital />}
                href="https://wa.me/911234567890"
                target="_blank"
              >
                WhatsApp Support
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => window.location.reload()}
              >
                Analyze Another
              </Button>
            </Grid>
          </Grid>
        </Card>
      </motion.div>
    </Container>
  );
};

export default Diagnostics;
