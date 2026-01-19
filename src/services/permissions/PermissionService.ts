import { Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

class PermissionServiceClass {
  private static instance: PermissionServiceClass;

  static getInstance(): PermissionServiceClass {
    if (!PermissionServiceClass.instance) {
      PermissionServiceClass.instance = new PermissionServiceClass();
    }
    return PermissionServiceClass.instance;
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing permissions...');
    } catch (error) {
      console.error('Permission initialization error:', error);
    }
  }

  async checkLocationPermission(): Promise<boolean> {
    try {
      const permission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      const result = await check(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('Check location permission error:', error);
      return false;
    }
  }

  async requestLocationPermission(): Promise<boolean> {
    try {
      const permission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      const result = await request(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('Request location permission error:', error);
      return false;
    }
  }

  async checkBackgroundLocationPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const result = await check(PERMISSIONS.IOS.LOCATION_ALWAYS_AND_WHEN_IN_USE);
        return result === RESULTS.GRANTED;
      } else {
        const result = await check(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION);
        return result === RESULTS.GRANTED;
      }
    } catch (error) {
      console.error('Check background location permission error:', error);
      return false;
    }
  }

  async requestBackgroundLocationPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const result = await request(
          PERMISSIONS.IOS.LOCATION_ALWAYS_AND_WHEN_IN_USE
        );
        return result === RESULTS.GRANTED;
      } else {
        const result = await request(
          PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION
        );
        return result === RESULTS.GRANTED;
      }
    } catch (error) {
      console.error('Request background location permission error:', error);
      return false;
    }
  }

  async checkBluetoothPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const result = await check(PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL);
        return result === RESULTS.GRANTED;
      } else {
        const scanResult = await check(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
        const connectResult = await check(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
        return (
          scanResult === RESULTS.GRANTED && connectResult === RESULTS.GRANTED
        );
      }
    } catch (error) {
      console.error('Check Bluetooth permission error:', error);
      return false;
    }
  }

  async requestBluetoothPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const result = await request(PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL);
        return result === RESULTS.GRANTED;
      } else {
        const scanResult = await request(PERMISSIONS.ANDROID.BLUETOOTH_SCAN);
        const connectResult = await request(PERMISSIONS.ANDROID.BLUETOOTH_CONNECT);
        return (
          scanResult === RESULTS.GRANTED &&
          connectResult === RESULTS.GRANTED
        );
      }
    } catch (error) {
      console.error('Request Bluetooth permission error:', error);
      return false;
    }
  }

  async checkNotificationPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const result = await check(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
        return result === RESULTS.GRANTED;
      }
      return true;
    } catch (error) {
      console.error('Check notification permission error:', error);
      return false;
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const result = await request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
        return result === RESULTS.GRANTED;
      }
      return true;
    } catch (error) {
      console.error('Request notification permission error:', error);
      return false;
    }
  }

  async checkCameraPermission(): Promise<boolean> {
    try {
      const permission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.CAMERA
          : PERMISSIONS.ANDROID.CAMERA;

      const result = await check(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('Check camera permission error:', error);
      return false;
    }
  }

  async requestCameraPermission(): Promise<boolean> {
    try {
      const permission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.CAMERA
          : PERMISSIONS.ANDROID.CAMERA;

      const result = await request(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('Request camera permission error:', error);
      return false;
    }
  }

  async checkPhotoLibraryPermission(): Promise<boolean> {
    try {
      const permission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.PHOTO_LIBRARY
          : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

      const result = await check(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('Check photo library permission error:', error);
      return false;
    }
  }

  async requestPhotoLibraryPermission(): Promise<boolean> {
    try {
      const permission =
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.PHOTO_LIBRARY
          : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

      const result = await request(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('Request photo library permission error:', error);
      return false;
    }
  }
}

export const PermissionService = PermissionServiceClass.getInstance();
