import { useState, useCallback } from 'react';

interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

interface LocationData {
  coordinates: LocationCoordinates;
  timestamp: number;
  address?: string;
}

interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const useLocation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);

  const getCurrentLocation = useCallback(async (options: LocationOptions = {}): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const errorMsg = 'Geolocation is not supported by this browser';
        setError(errorMsg);
        reject(new Error(errorMsg));
        return;
      }

      setIsLoading(true);
      setError(null);

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 10000,
        maximumAge: options.maximumAge ?? 300000, // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const locationData: LocationData = {
              coordinates: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude || undefined,
                altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
                heading: position.coords.heading || undefined,
                speed: position.coords.speed || undefined,
              },
              timestamp: position.timestamp,
            };

            // Try to get address from coordinates
            try {
              const address = await reverseGeocode(
                position.coords.latitude,
                position.coords.longitude
              );
              locationData.address = address;
            } catch (geocodeError) {
              console.warn('Reverse geocoding failed:', geocodeError);
            }

            setCurrentLocation(locationData);
            setIsLoading(false);
            resolve(locationData);
          } catch (err) {
            const errorMsg = 'Failed to process location data';
            setError(errorMsg);
            setIsLoading(false);
            reject(new Error(errorMsg));
          }
        },
        (error) => {
          let errorMsg = 'Location access failed';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMsg = 'Location request timed out';
              break;
          }

          setError(errorMsg);
          setIsLoading(false);
          reject(new Error(errorMsg));
        },
        defaultOptions
      );
    });
  }, []);

  const watchLocation = useCallback((
    callback: (location: LocationData) => void,
    options: LocationOptions = {}
  ): number | null => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return null;
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 60000, // 1 minute for watching
    };

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          const locationData: LocationData = {
            coordinates: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude || undefined,
              altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
              heading: position.coords.heading || undefined,
              speed: position.coords.speed || undefined,
            },
            timestamp: position.timestamp,
          };

          // Try to get address from coordinates
          try {
            const address = await reverseGeocode(
              position.coords.latitude,
              position.coords.longitude
            );
            locationData.address = address;
          } catch (geocodeError) {
            console.warn('Reverse geocoding failed:', geocodeError);
          }

          setCurrentLocation(locationData);
          callback(locationData);
        } catch (err) {
          console.error('Failed to process location data:', err);
        }
      },
      (error) => {
        let errorMsg = 'Location watching failed';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMsg = 'Location request timed out';
            break;
        }

        setError(errorMsg);
        console.error('Location watch error:', errorMsg);
      },
      defaultOptions
    );

    return watchId;
  }, []);

  const stopWatching = useCallback((watchId: number) => {
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const calculateDistance = useCallback((
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }, []);

  return {
    isLoading,
    error,
    currentLocation,
    getCurrentLocation,
    watchLocation,
    stopWatching,
    calculateDistance,
  };
};

// Helper function for reverse geocoding
const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
  try {
    // Try using a free geocoding service (you might want to use a proper API key in production)
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );

    if (!response.ok) {
      throw new Error('Geocoding service unavailable');
    }

    const data = await response.json();
    
    // Construct address from components
    const addressParts = [
      data.locality,
      data.principalSubdivision,
      data.countryName
    ].filter(Boolean);

    return addressParts.join(', ') || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  } catch (error) {
    // Fallback to coordinates if geocoding fails
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
};
