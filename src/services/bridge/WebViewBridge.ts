import { WebViewMessageEvent } from 'react-native-webview';
import { FirebaseService } from '../firebase/FirebaseService';
import { BLEService } from '../ble/BLEService';
import { LocationService, LocationData } from '../location/LocationService';
import { PermissionService } from '../permissions/PermissionService';

export interface WebViewMessage {
  id: string;
  method: string;
  params?: Record<string, any>;
}

export interface WebViewResponse {
  id: string;
  method: string;
  success: boolean;
  result?: any;
  error?: string;
}

class WebViewBridgeClass {
  private static instance: WebViewBridgeClass;
  private webViewRef: any = null;
  private handlers: Map<string, Function> = new Map();
  private locationUnsubscribe: (() => void) | null = null;
  private bleDataUnsubscribe: (() => void) | null = null;

  static getInstance(): WebViewBridgeClass {
    if (!WebViewBridgeClass.instance) {
      WebViewBridgeClass.instance = new WebViewBridgeClass();
    }
    return WebViewBridgeClass.instance;
  }

  setWebViewRef(ref: any): void {
    this.webViewRef = ref;
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.handlers.set('getFCMToken', this.handleGetFCMToken.bind(this));
    this.handlers.set('startLocationTracking', this.handleStartLocationTracking.bind(this));
    this.handlers.set('stopLocationTracking', this.handleStopLocationTracking.bind(this));
    this.handlers.set('getCurrentLocation', this.handleGetCurrentLocation.bind(this));
    this.handlers.set('requestLocationPermission', this.handleRequestLocationPermission.bind(this));
    this.handlers.set('startBLEScan', this.handleStartBLEScan.bind(this));
    this.handlers.set('stopBLEScan', this.handleStopBLEScan.bind(this));
    this.handlers.set('connectBLEDevice', this.handleConnectBLEDevice.bind(this));
    this.handlers.set('disconnectBLEDevice', this.handleDisconnectBLEDevice.bind(this));
    this.handlers.set('sendBLEData', this.handleSendBLEData.bind(this));
    this.handlers.set('requestBluetoothPermission', this.handleRequestBluetoothPermission.bind(this));
    this.handlers.set('requestCameraPermission', this.handleRequestCameraPermission.bind(this));
    this.handlers.set('requestPhotoLibraryPermission', this.handleRequestPhotoLibraryPermission.bind(this));
  }

  async handleMessage(event: WebViewMessageEvent): Promise<void> {
    try {
      const message: WebViewMessage = JSON.parse(event.nativeEvent.data);
      console.log('WebView message received:', message.method);

      const handler = this.handlers.get(message.method);
      if (!handler) {
        this.sendResponse(message.id, message.method, false, null, 'Method not found');
        return;
      }

      const result = await handler(message.params);
      this.sendResponse(message.id, message.method, true, result);
    } catch (error) {
      console.error('WebView message handling error:', error);
    }
  }

  private sendResponse(
    id: string,
    method: string,
    success: boolean,
    result?: any,
    error?: string
  ): void {
    const response: WebViewResponse = {
      id,
      method,
      success,
      result,
      error,
    };

    if (this.webViewRef) {
      const script = `
        if (window.__nativebridge) {
          window.__nativebridge.handleNativeResponse(${JSON.stringify(response)});
        }
      `;
      this.webViewRef.injectJavaScript(script);
    }
  }

  private async handleGetFCMToken(params?: any): Promise<string | null> {
    return FirebaseService.getFCMToken();
  }

  private async handleRequestLocationPermission(params?: any): Promise<boolean> {
    return PermissionService.requestLocationPermission();
  }

  private async handleStartLocationTracking(params?: any): Promise<void> {
    if (this.locationUnsubscribe) {
      this.locationUnsubscribe();
    }

    await LocationService.startLocationTracking();

    this.locationUnsubscribe = LocationService.subscribeToLocationUpdates(
      (location: LocationData) => {
        this.sendLocationUpdate(location);
      }
    );
  }

  private async handleStopLocationTracking(params?: any): Promise<void> {
    await LocationService.stopLocationTracking();
    if (this.locationUnsubscribe) {
      this.locationUnsubscribe();
      this.locationUnsubscribe = null;
    }
  }

  private async handleGetCurrentLocation(params?: any): Promise<LocationData> {
    return LocationService.getCurrentLocation();
  }

  private sendLocationUpdate(location: LocationData): void {
    if (this.webViewRef) {
      const script = `
        if (window.__nativebridge) {
          window.__nativebridge.handleLocationUpdate(${JSON.stringify(location)});
        }
      `;
      this.webViewRef.injectJavaScript(script);
    }
  }

  private async handleStartBLEScan(params?: any): Promise<void> {
    const serviceUUIDs = params?.serviceUUIDs;
    await BLEService.startScan(serviceUUIDs);

    BLEService.subscribeToScan((device) => {
      this.sendBLEDeviceFound(device);
    });
  }

  private async handleStopBLEScan(params?: any): Promise<void> {
    await BLEService.stopScan();
  }

  private sendBLEDeviceFound(device: any): void {
    if (this.webViewRef) {
      const deviceData = {
        id: device.id,
        name: device.name,
        rssi: device.rssi,
      };
      const script = `
        if (window.__nativebridge) {
          window.__nativebridge.handleBLEDeviceFound(${JSON.stringify(deviceData)});
        }
      `;
      this.webViewRef.injectJavaScript(script);
    }
  }

  private async handleConnectBLEDevice(params?: any): Promise<void> {
    const deviceId = params?.deviceId;
    if (!deviceId) {
      throw new Error('Device ID required');
    }

    await BLEService.connectDevice(deviceId);

    if (this.bleDataUnsubscribe) {
      this.bleDataUnsubscribe();
    }

    this.bleDataUnsubscribe = BLEService.subscribeToData((data) => {
      this.sendBLEDataReceived(data);
    });
  }

  private async handleDisconnectBLEDevice(params?: any): Promise<void> {
    const deviceId = params?.deviceId;
    if (!deviceId) {
      throw new Error('Device ID required');
    }

    await BLEService.disconnectDevice(deviceId);

    if (this.bleDataUnsubscribe) {
      this.bleDataUnsubscribe();
      this.bleDataUnsubscribe = null;
    }
  }

  private sendBLEDataReceived(data: string): void {
    if (this.webViewRef) {
      const script = `
        if (window.__nativebridge) {
          window.__nativebridge.handleBLEDataReceived('${data}');
        }
      `;
      this.webViewRef.injectJavaScript(script);
    }
  }

  private async handleSendBLEData(params?: any): Promise<void> {
    const { deviceId, serviceUUID, characteristicUUID, data } = params || {};

    if (!deviceId || !serviceUUID || !characteristicUUID || !data) {
      throw new Error('Missing required parameters for BLE data send');
    }

    await BLEService.sendData(deviceId, serviceUUID, characteristicUUID, data);
  }

  private async handleRequestBluetoothPermission(params?: any): Promise<boolean> {
    return PermissionService.requestBluetoothPermission();
  }

  private async handleRequestCameraPermission(params?: any): Promise<boolean> {
    return PermissionService.requestCameraPermission();
  }

  private async handleRequestPhotoLibraryPermission(params?: any): Promise<boolean> {
    return PermissionService.requestPhotoLibraryPermission();
  }

  cleanup(): void {
    if (this.locationUnsubscribe) {
      this.locationUnsubscribe();
    }
    if (this.bleDataUnsubscribe) {
      this.bleDataUnsubscribe();
    }
  }
}

export const WebViewBridge = WebViewBridgeClass.getInstance();
