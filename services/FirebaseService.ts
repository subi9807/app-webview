import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

interface FCMToken {
  token: string;
  timestamp: number;
}

type TokenCallback = (token: string) => void;
type MessageCallback = (message: any) => void;

class FirebaseServiceClass {
  private static instance: FirebaseServiceClass;
  private fcmToken: FCMToken | null = null;
  private initialized = false;
  private tokenCallbacks: TokenCallback[] = [];
  private messageCallbacks: MessageCallback[] = [];
  private unsubscribeTokenRefresh: (() => void) | null = null;
  private unsubscribeForeground: (() => void) | null = null;

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
      await this.requestPermissions();
      await this.setupFCM();
      this.setupMessageHandlers();
      this.initialized = true;
      console.log('Firebase initialized');
    } catch (error) {
      console.error('Firebase initialization error:', error);
      throw error;
    }
  }

  private async requestPermissions(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.warn('iOS notification permissions not granted');
        }
      }

      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
      }
    } catch (error) {
      console.error('Permission request error:', error);
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

      console.log('FCM Token:', token);
      this.notifyTokenCallbacks(token);
    } catch (error) {
      console.error('FCM setup error:', error);
      throw error;
    }
  }

  private setupMessageHandlers(): void {
    this.unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message:', remoteMessage);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification?.title || 'Notification',
          body: remoteMessage.notification?.body || '',
          data: remoteMessage.data,
        },
        trigger: null,
      });

      this.notifyMessageCallbacks(remoteMessage);
    });

    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app:', remoteMessage);
      this.notifyMessageCallbacks(remoteMessage);
    });

    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('App opened from notification:', remoteMessage);
          this.notifyMessageCallbacks(remoteMessage);
        }
      });

    this.unsubscribeTokenRefresh = messaging().onTokenRefresh((token) => {
      console.log('FCM token refreshed:', token);
      this.fcmToken = {
        token,
        timestamp: Date.now(),
      };
      this.notifyTokenCallbacks(token);
    });

    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message:', remoteMessage);
      this.notifyMessageCallbacks(remoteMessage);
    });
  }

  getFCMToken(): string | null {
    return this.fcmToken?.token || null;
  }

  async sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Send local notification error:', error);
      throw error;
    }
  }

  subscribeToToken(callback: TokenCallback): () => void {
    this.tokenCallbacks.push(callback);
    return () => {
      this.tokenCallbacks = this.tokenCallbacks.filter((cb) => cb !== callback);
    };
  }

  subscribeToMessages(callback: MessageCallback): () => void {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter((cb) => cb !== callback);
    };
  }

  private notifyTokenCallbacks(token: string): void {
    this.tokenCallbacks.forEach((callback) => callback(token));
  }

  private notifyMessageCallbacks(message: any): void {
    this.messageCallbacks.forEach((callback) => callback(message));
  }

  cleanup(): void {
    if (this.unsubscribeForeground) {
      this.unsubscribeForeground();
    }
    if (this.unsubscribeTokenRefresh) {
      this.unsubscribeTokenRefresh();
    }
    this.tokenCallbacks = [];
    this.messageCallbacks = [];
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const FirebaseService = FirebaseServiceClass.getInstance();
