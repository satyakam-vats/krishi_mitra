import { useState, useCallback } from 'react';

interface CameraOptions {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
  quality?: number;
}

interface CapturedImage {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  timestamp: number;
}

export const useCamera = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async (options: CameraOptions = {}) => {
    try {
      setError(null);
      setIsCapturing(true);

      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: options.width || 1920 },
          height: { ideal: options.height || 1080 },
          facingMode: options.facingMode || 'environment', // Use back camera by default
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      return mediaStream;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Camera access failed';
      setError(errorMessage);
      setIsCapturing(false);
      throw new Error(errorMessage);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  }, [stream]);

  const captureImage = useCallback(async (options: CameraOptions = {}): Promise<CapturedImage> => {
    try {
      setError(null);
      
      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: options.width || 1920 },
          height: { ideal: options.height || 1080 },
          facingMode: options.facingMode || 'environment',
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = mediaStream;
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true; // Important for mobile

      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => {
          video.play().then(resolve).catch(reject);
        };
        video.onerror = () => reject(new Error('Video loading failed'));
        
        // Timeout after 10 seconds
        setTimeout(() => reject(new Error('Camera timeout')), 10000);
      });

      // Wait a bit more for the video to stabilize
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create canvas to capture frame
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Canvas context not available');
      }

      canvas.width = video.videoWidth || options.width || 640;
      canvas.height = video.videoHeight || options.height || 480;
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create image blob'));
            }
          },
          'image/jpeg',
          options.quality || 0.8
        );
      });

      // Create data URL
      const dataUrl = canvas.toDataURL('image/jpeg', options.quality || 0.8);

      // Stop camera
      mediaStream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCapturing(false);

      return {
        blob,
        dataUrl,
        width: canvas.width,
        height: canvas.height,
        timestamp: Date.now(),
      };
    } catch (err) {
      // Clean up on error
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      setIsCapturing(false);
      
      const errorMessage = err instanceof Error ? err.message : 'Image capture failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [stream]);

  const captureFromInput = useCallback((file: File): Promise<CapturedImage> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (!context) {
            reject(new Error('Canvas context not available'));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                resolve({
                  blob,
                  dataUrl,
                  width: canvas.width,
                  height: canvas.height,
                  timestamp: Date.now(),
                });
              } else {
                reject(new Error('Failed to create image blob'));
              }
            },
            'image/jpeg',
            0.8
          );
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = event.target?.result as string;
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }, []);

  const compressImage = useCallback(async (
    image: CapturedImage,
    maxWidth: number = 800,
    maxHeight: number = 600,
    quality: number = 0.7
  ): Promise<CapturedImage> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Calculate new dimensions
        let { width, height } = image;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        // Draw compressed image
        context.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const dataUrl = canvas.toDataURL('image/jpeg', quality);
              resolve({
                blob,
                dataUrl,
                width,
                height,
                timestamp: Date.now(),
              });
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = image.dataUrl;
    });
  }, []);

  return {
    isCapturing,
    stream,
    error,
    startCamera,
    stopCamera,
    captureImage,
    captureFromInput,
    compressImage,
  };
};
