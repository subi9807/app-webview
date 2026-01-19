import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { NativeEventEmitter, NativeModules } from 'react-native';

interface FCMToken {
  token: string;
  timestamp: number;
}

class FirebaseServiceClass {
  private static instance: FirebaseServiceClass;
  private fcmToken: FCMToken | null = null;
  private initialized = false;
  private listeners: Array<(token: string) => void> = [];

  static getInstance(): FirebaseServiceClass {
    if (!FirebaseServiceClass.instance) {
      FirebaseServiceClass.instance = new FirebaseServiceClass();
    }
    return FirebaseServiceClass.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      if (Platform.OS === 'ios') {
        await this.requestIOSPermission();
      }

      await this.setupFCM();
      this.initialized = true;
    } catch (error) {
      console.error('Firebase initialization error:', error);
      throw error;
    }
  }

  private async requestIOSPermission(): Promise<void> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.warn('iOS notification permissions not granted');
      }
    } catch (error) {
      console.error('iOS permission request error:', error);
      throw error;
    }
  }

  private async setupFCM(): Promise<void> {
    try {
      const token = await messaging().getToken();
      this.fcmToken = {
        token,
        timestamp: Date.now(),
      };

      this.handleForegroundMessage();
      this.handleBackgroundMessage();
      this.handleTokenRefresh();

      console.log('FCM Token:', token);
    } catch (error) {
      console.error('FCM setup error:', error);
      throw error;
    }
  }

  private handleForegroundMessage(): void {
    this.unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message received:', remoteMessage);

      const title = remoteMessage.notification?.title || 'Notification';
      const body = remoteMessage.notification?.body || '';

      if (NativeModules.OnAppNotification) {
        NativeModules.OnAppNotification.showNotification(title, body);
      }
    });
  }

  private unsubscribeForeground: (() => void) | null = null;

  private handleBackgroundMessage(): void {
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('App opened from notification:', remoteMessage);
      this.handleNotificationTap(remoteMessage);
    });

    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('App launched from terminated state:', remoteMessage);
          this.handleNotificationTap(remoteMessage);
        }
      });
  }

  private handleTokenRefresh(): void {
    this.unsubscribeTokenRefresh = messaging().onTokenRefresh((token) => {
      console.log('FCM token refreshed:', token);
      this.fcmToken = {
        token,
        timestamp: Date.now(),
      };
      this.notifyListeners(token);
    });
  }

  private unsubscribeTokenRefresh: (() => void) | null = null;

  private handleNotificationTap(remoteMessage: any): void {
    const data = remoteMessage.data || {};
    console.log('Handling notification tap with data:', data);
  }

  getFCMToken(): string | null {
    return this.fcmToken?.token || null;
  }

  subscribeToTokenChanges(callback: (token: string) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback);
    };
  }

  private notifyListeners(token: string): void {
    this.listeners.forEach((listener) => listener(token));
  }

  cleanup(): void {
    if (this.unsubscribeForeground) {
      this.unsubscribeForeground();
    }
    if (this.unsubscribeTokenRefresh) {
      this.unsubscribeTokenRefresh();
    }
  }
}

export const FirebaseService = FirebaseServiceClass.getInstance();
