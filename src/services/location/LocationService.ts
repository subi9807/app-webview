import Geolocation from 'react-native-geolocation-service';
import { Platform } from 'react-native';
import { PermissionService } from '../permissions/PermissionService';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

type LocationCallback = (location: LocationData) => void;
type ErrorCallback = (error: string) => void;

class LocationServiceClass {
  private static instance: LocationServiceClass;
  private watchId: number | null = null;
  private locationListeners: LocationCallback[] = [];
  private errorListeners: ErrorCallback[] = [];
  private isTracking = false;

  static getInstance(): LocationServiceClass {
    if (!LocationServiceClass.instance) {
      LocationServiceClass.instance = new LocationServiceClass();
    }
    return LocationServiceClass.instance;
  }

  async getCurrentLocation(): Promise<LocationData> {
    try {
      const hasPermission = await PermissionService.checkLocationPermission();
      if (!hasPermission) {
        const granted =
          await PermissionService.requestLocationPermission();
        if (!granted) {
          throw new Error('Location permission denied');
        }
      }

      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position) => {
            const { coords, timestamp } = position;
            resolve({
              latitude: coords.latitude,
              longitude: coords.longitude,
              accuracy: coords.accuracy,
              altitude: coords.altitude,
              speed: coords.speed,
              heading: coords.heading,
              timestamp: timestamp || Date.now(),
            });
          },
          (error) => {
            console.error('Get location error:', error);
            reject(new Error(error.message));
          },
          {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 1000,
          }
        );
      });
    } catch (error) {
      console.error('Get current location error:', error);
      this.notifyErrorListeners(error as Error);
      throw error;
    }
  }

  async startLocationTracking(): Promise<void> {
    try {
      if (this.isTracking) {
        console.warn('Location tracking already active');
        return;
      }

      const hasPermission = await PermissionService.checkLocationPermission();
      if (!hasPermission) {
        const granted =
          await PermissionService.requestLocationPermission();
        if (!granted) {
          throw new Error('Location permission denied');
        }
      }

      if (Platform.OS === 'ios') {
        const backgroundPermission =
          await PermissionService.checkBackgroundLocationPermission();
        if (!backgroundPermission) {
          console.warn(
            'Background location permission not granted (iOS)'
          );
        }
      }

      this.watchId = Geolocation.watchPosition(
        (position) => {
          const { coords, timestamp } = position;
          const locationData: LocationData = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            altitude: coords.altitude,
            speed: coords.speed,
            heading: coords.heading,
            timestamp: timestamp || Date.now(),
          };
          this.notifyLocationListeners(locationData);
        },
        (error) => {
          console.error('Location tracking error:', error);
          this.notifyErrorListeners(new Error(error.message));
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 1000,
          distanceFilter: 0,
          useSignificantChanges: false,
          interval: 5000,
          fastestInterval: 1000,
          showLocationDialog: true,
        }
      );

      this.isTracking = true;
      console.log('Location tracking started');
    } catch (error) {
      console.error('Start location tracking error:', error);
      this.notifyErrorListeners(error as Error);
      throw error;
    }
  }

  async stopLocationTracking(): Promise<void> {
    try {
      if (this.watchId !== null) {
        Geolocation.clearWatch(this.watchId);
        this.watchId = null;
        this.isTracking = false;
        console.log('Location tracking stopped');
      }
    } catch (error) {
      console.error('Stop location tracking error:', error);
      throw error;
    }
  }

  subscribeToLocationUpdates(callback: LocationCallback): () => void {
    this.locationListeners.push(callback);
    return () => {
      this.locationListeners = this.locationListeners.filter(
        (cb) => cb !== callback
      );
    };
  }

  subscribeToLocationErrors(callback: ErrorCallback): () => void {
    this.errorListeners.push(callback);
    return () => {
      this.errorListeners = this.errorListeners.filter(
        (cb) => cb !== callback
      );
    };
  }

  private notifyLocationListeners(location: LocationData): void {
    this.locationListeners.forEach((listener) => listener(location));
  }

  private notifyErrorListeners(error: Error): void {
    this.errorListeners.forEach((listener) => listener(error.message));
  }

  isLocationTrackingActive(): boolean {
    return this.isTracking;
  }

  cleanup(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking = false;
  }
}

export const LocationService = LocationServiceClass.getInstance();
