import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK_NAME = 'background-location-task';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

type LocationCallback = (location: LocationData) => void;

class LocationServiceClass {
  private static instance: LocationServiceClass;
  private locationCallbacks: LocationCallback[] = [];
  private isTracking = false;
  private subscription: Location.LocationSubscription | null = null;

  static getInstance(): LocationServiceClass {
    if (!LocationServiceClass.instance) {
      LocationServiceClass.instance = new LocationServiceClass();
    }
    return LocationServiceClass.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Location permission error:', error);
      return false;
    }
  }

  async requestBackgroundPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestBackgroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Background location permission error:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationData> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return this.formatLocation(location);
    } catch (error) {
      console.error('Get current location error:', error);
      throw error;
    }
  }

  async startTracking(): Promise<void> {
    try {
      if (this.isTracking) {
        console.warn('Location tracking already active');
        return;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      this.subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 0,
        },
        (location) => {
          const formattedLocation = this.formatLocation(location);
          this.notifyCallbacks(formattedLocation);
        }
      );

      this.isTracking = true;
      console.log('Location tracking started');
    } catch (error) {
      console.error('Start tracking error:', error);
      throw error;
    }
  }

  async stopTracking(): Promise<void> {
    try {
      if (this.subscription) {
        this.subscription.remove();
        this.subscription = null;
      }
      this.isTracking = false;
      console.log('Location tracking stopped');
    } catch (error) {
      console.error('Stop tracking error:', error);
      throw error;
    }
  }

  async startBackgroundTracking(): Promise<void> {
    try {
      const hasPermission = await this.requestBackgroundPermissions();
      if (!hasPermission) {
        throw new Error('Background location permission denied');
      }

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 10,
        foregroundService: {
          notificationTitle: 'Location tracking',
          notificationBody: 'onub2b is tracking your location',
        },
      });

      console.log('Background tracking started');
    } catch (error) {
      console.error('Start background tracking error:', error);
      throw error;
    }
  }

  async stopBackgroundTracking(): Promise<void> {
    try {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      console.log('Background tracking stopped');
    } catch (error) {
      console.error('Stop background tracking error:', error);
      throw error;
    }
  }

  subscribeToLocationUpdates(callback: LocationCallback): () => void {
    this.locationCallbacks.push(callback);
    return () => {
      this.locationCallbacks = this.locationCallbacks.filter((cb) => cb !== callback);
    };
  }

  private formatLocation(location: Location.LocationObject): LocationData {
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      altitude: location.coords.altitude,
      speed: location.coords.speed,
      heading: location.coords.heading,
      timestamp: location.timestamp,
    };
  }

  private notifyCallbacks(location: LocationData): void {
    this.locationCallbacks.forEach((callback) => callback(location));
  }

  cleanup(): void {
    this.stopTracking();
    this.locationCallbacks = [];
  }
}

TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }
  if (data) {
    const { locations } = data as any;
    console.log('Background location update:', locations);
  }
});

export const LocationService = LocationServiceClass.getInstance();
