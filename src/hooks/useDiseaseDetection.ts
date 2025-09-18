import { useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';

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

interface DiseaseClass {
  name: string;
  description: string;
  symptoms: string[];
  treatments: string[];
  prevention: string[];
  organicTreatments: string[];
  severity: 'low' | 'medium' | 'high';
}

const diseaseDatabase: Record<string, DiseaseClass> = {
  'healthy': {
    name: 'Healthy Crop',
    description: 'Your crop appears to be healthy with no visible signs of disease or pest damage.',
    symptoms: ['Green, vibrant leaves', 'Normal growth pattern', 'No discoloration'],
    treatments: ['Continue current care routine', 'Regular monitoring'],
    prevention: ['Maintain proper watering', 'Ensure adequate nutrition', 'Regular inspection'],
    organicTreatments: ['Continue organic practices'],
    severity: 'low'
  },
  'bacterial_blight': {
    name: 'Bacterial Blight',
    description: 'A bacterial infection causing water-soaked lesions and yellowing of leaves.',
    symptoms: ['Water-soaked spots on leaves', 'Yellow halos around spots', 'Leaf wilting'],
    treatments: ['Copper-based bactericides', 'Remove infected plants', 'Improve air circulation'],
    prevention: ['Avoid overhead watering', 'Plant resistant varieties', 'Crop rotation'],
    organicTreatments: ['Neem oil spray', 'Copper sulfate solution', 'Compost tea'],
    severity: 'medium'
  },
  'fungal_leaf_spot': {
    name: 'Fungal Leaf Spot',
    description: 'Fungal infection causing circular spots on leaves that can lead to defoliation.',
    symptoms: ['Circular brown spots', 'Yellow margins around spots', 'Premature leaf drop'],
    treatments: ['Fungicide application', 'Remove affected leaves', 'Reduce humidity'],
    prevention: ['Proper spacing between plants', 'Avoid wet foliage', 'Good drainage'],
    organicTreatments: ['Baking soda spray', 'Milk solution', 'Garlic extract'],
    severity: 'medium'
  },
  'powdery_mildew': {
    name: 'Powdery Mildew',
    description: 'Fungal disease creating white powdery coating on leaves and stems.',
    symptoms: ['White powdery coating', 'Stunted growth', 'Leaf curling'],
    treatments: ['Sulfur-based fungicides', 'Systemic fungicides', 'Pruning affected areas'],
    prevention: ['Good air circulation', 'Avoid overcrowding', 'Resistant varieties'],
    organicTreatments: ['Milk and water solution', 'Potassium bicarbonate', 'Essential oil sprays'],
    severity: 'medium'
  },
  'pest_damage': {
    name: 'Pest Damage',
    description: 'Damage caused by insects or other pests feeding on the plant.',
    symptoms: ['Holes in leaves', 'Chewed edges', 'Visible insects or larvae'],
    treatments: ['Insecticide application', 'Physical removal of pests', 'Beneficial insects'],
    prevention: ['Regular monitoring', 'Companion planting', 'Physical barriers'],
    organicTreatments: ['Neem oil', 'Diatomaceous earth', 'Soap spray'],
    severity: 'low'
  },
  'nutrient_deficiency': {
    name: 'Nutrient Deficiency',
    description: 'Lack of essential nutrients causing discoloration and poor growth.',
    symptoms: ['Yellowing leaves', 'Stunted growth', 'Poor fruit development'],
    treatments: ['Balanced fertilizer', 'Soil testing', 'Targeted nutrient supplements'],
    prevention: ['Regular soil testing', 'Proper fertilization schedule', 'Organic matter addition'],
    organicTreatments: ['Compost', 'Organic fertilizers', 'Bone meal'],
    severity: 'low'
  },
  'viral_infection': {
    name: 'Viral Infection',
    description: 'Viral disease causing mosaic patterns and distorted growth.',
    symptoms: ['Mosaic patterns on leaves', 'Stunted growth', 'Distorted leaves'],
    treatments: ['Remove infected plants', 'Control insect vectors', 'No direct cure'],
    prevention: ['Use certified seeds', 'Control aphids and thrips', 'Quarantine new plants'],
    organicTreatments: ['Remove infected plants', 'Encourage beneficial insects'],
    severity: 'high'
  }
};

export const useDiseaseDetection = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [model, setModel] = useState<tf.LayersModel | null>(null);

  const loadModel = useCallback(async () => {
    try {
      // In a real implementation, you would load a pre-trained model
      // For demo purposes, we'll simulate model loading
      console.log('Loading disease detection model...');
      
      // Simulate model loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a simple mock model for demonstration
      const mockModel = await tf.sequential({
        layers: [
          tf.layers.conv2d({
            inputShape: [224, 224, 3],
            filters: 32,
            kernelSize: 3,
            activation: 'relu'
          }),
          tf.layers.maxPooling2d({ poolSize: 2 }),
          tf.layers.conv2d({ filters: 64, kernelSize: 3, activation: 'relu' }),
          tf.layers.maxPooling2d({ poolSize: 2 }),
          tf.layers.conv2d({ filters: 64, kernelSize: 3, activation: 'relu' }),
          tf.layers.flatten(),
          tf.layers.dense({ units: 64, activation: 'relu' }),
          tf.layers.dense({ units: Object.keys(diseaseDatabase).length, activation: 'softmax' })
        ]
      });

      setModel(mockModel);
      return mockModel;
    } catch (error) {
      console.error('Failed to load model:', error);
      throw error;
    }
  }, []);

  const preprocessImage = useCallback(async (imageDataUrl: string): Promise<tf.Tensor> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Resize to model input size
        canvas.width = 224;
        canvas.height = 224;
        ctx.drawImage(img, 0, 0, 224, 224);

        // Convert to tensor
        const imageData = ctx.getImageData(0, 0, 224, 224);
        const tensor = tf.browser.fromPixels(imageData)
          .expandDims(0)
          .div(255.0); // Normalize to [0, 1]

        resolve(tensor);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageDataUrl;
    });
  }, []);

  const analyzeImage = useCallback(async (imageDataUrl: string): Promise<DiagnosisResult> => {
    setIsAnalyzing(true);
    
    try {
      // Load model if not already loaded
      let currentModel = model;
      if (!currentModel) {
        currentModel = await loadModel();
      }

      // Preprocess image
      const imageTensor = await preprocessImage(imageDataUrl);

      // For demo purposes, we'll simulate analysis with random results
      // In a real implementation, you would use: const predictions = currentModel.predict(imageTensor) as tf.Tensor;
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate mock predictions
      const diseaseKeys = Object.keys(diseaseDatabase);
      const randomIndex = Math.floor(Math.random() * diseaseKeys.length);
      const selectedDisease = diseaseKeys[randomIndex];
      const confidence = 0.7 + Math.random() * 0.3; // Random confidence between 0.7-1.0

      // Clean up tensor
      imageTensor.dispose();

      const diseaseInfo = diseaseDatabase[selectedDisease];
      
      return {
        disease: diseaseInfo.name,
        confidence,
        severity: diseaseInfo.severity,
        description: diseaseInfo.description,
        symptoms: diseaseInfo.symptoms,
        treatments: diseaseInfo.treatments,
        prevention: diseaseInfo.prevention,
        organicTreatments: diseaseInfo.organicTreatments,
      };

    } catch (error) {
      console.error('Analysis failed:', error);
      
      // Fallback to basic analysis
      return {
        disease: 'Analysis Unavailable',
        confidence: 0.5,
        severity: 'medium',
        description: 'Unable to perform detailed analysis. Please ensure good image quality and try again.',
        symptoms: ['Image quality may be poor', 'Lighting conditions unclear'],
        treatments: ['Retake image with better lighting', 'Consult local agricultural expert'],
        prevention: ['Regular crop monitoring', 'Maintain good growing conditions'],
        organicTreatments: ['General organic farming practices'],
      };
    } finally {
      setIsAnalyzing(false);
    }
  }, [model, loadModel, preprocessImage]);

  const analyzeOffline = useCallback(async (imageDataUrl: string): Promise<DiagnosisResult> => {
    // Simplified offline analysis using basic image processing
    setIsAnalyzing(true);
    
    try {
      // Simulate offline processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Basic color analysis for offline mode
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      return new Promise((resolve) => {
        img.onload = () => {
          if (!ctx) {
            resolve(getDefaultOfflineResult());
            return;
          }

          canvas.width = 100;
          canvas.height = 100;
          ctx.drawImage(img, 0, 0, 100, 100);

          const imageData = ctx.getImageData(0, 0, 100, 100);
          const data = imageData.data;

          // Simple color analysis
          let greenPixels = 0;
          let brownPixels = 0;
          let yellowPixels = 0;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            if (g > r && g > b && g > 100) greenPixels++;
            else if (r > 100 && g > 80 && b < 80) brownPixels++;
            else if (r > 150 && g > 150 && b < 100) yellowPixels++;
          }

          const totalPixels = data.length / 4;
          const greenRatio = greenPixels / totalPixels;
          const brownRatio = brownPixels / totalPixels;
          const yellowRatio = yellowPixels / totalPixels;

          let selectedDisease = 'healthy';
          if (brownRatio > 0.3) selectedDisease = 'fungal_leaf_spot';
          else if (yellowRatio > 0.4) selectedDisease = 'nutrient_deficiency';
          else if (greenRatio < 0.4) selectedDisease = 'pest_damage';

          const diseaseInfo = diseaseDatabase[selectedDisease];
          
          resolve({
            disease: `${diseaseInfo.name} (Offline Analysis)`,
            confidence: 0.6,
            severity: diseaseInfo.severity,
            description: `${diseaseInfo.description} Note: This is a basic offline analysis. For detailed diagnosis, connect to the internet.`,
            symptoms: diseaseInfo.symptoms,
            treatments: diseaseInfo.treatments,
            prevention: diseaseInfo.prevention,
            organicTreatments: diseaseInfo.organicTreatments,
          });
        };

        img.onerror = () => resolve(getDefaultOfflineResult());
        img.src = imageDataUrl;
      });

    } catch (error) {
      return getDefaultOfflineResult();
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const getDefaultOfflineResult = (): DiagnosisResult => ({
    disease: 'Basic Analysis (Offline)',
    confidence: 0.5,
    severity: 'medium',
    description: 'Basic offline analysis completed. For detailed AI diagnosis, please connect to the internet.',
    symptoms: ['Visual inspection recommended'],
    treatments: ['Monitor crop closely', 'Consult local expert when possible'],
    prevention: ['Regular monitoring', 'Maintain good growing conditions'],
    organicTreatments: ['Follow general organic practices'],
  });

  return {
    isAnalyzing,
    analyzeImage,
    analyzeOffline,
    loadModel,
  };
};
