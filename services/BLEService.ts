import { BleManager, Device } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';

type ScanCallback = (device: Device) => void;
type ConnectionCallback = (device: Device, isConnected: boolean) => void;
type DataCallback = (data: string) => void;

class BLEServiceClass {
  private static instance: BLEServiceClass;
  private manager: BleManager;
  private connectedDevices: Map<string, Device> = new Map();
  private scanCallbacks: ScanCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  private dataCallbacks: DataCallback[] = [];
  private isScanning = false;

  static getInstance(): BLEServiceClass {
    if (!BLEServiceClass.instance) {
      BLEServiceClass.instance = new BLEServiceClass();
    }
    return BLEServiceClass.instance;
  }

  constructor() {
    this.manager = new BleManager();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const state = await this.manager.state();
      console.log('BLE Manager state:', state);

      this.manager.onStateChange((state) => {
        console.log('BLE state changed:', state);
      }, true);
    } catch (error) {
      console.error('BLE initialization error:', error);
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 31) {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]);
          return (
            granted['android.permission.BLUETOOTH_SCAN'] === 'granted' &&
            granted['android.permission.BLUETOOTH_CONNECT'] === 'granted' &&
            granted['android.permission.ACCESS_FINE_LOCATION'] === 'granted'
          );
        } else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          return granted === 'granted';
        }
      }
      return true;
    } catch (error) {
      console.error('BLE permission error:', error);
      return false;
    }
  }

  async startScan(serviceUUIDs?: string[]): Promise<void> {
    try {
      if (this.isScanning) {
        console.warn('BLE scan already in progress');
        return;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('BLE permissions not granted');
      }

      this.isScanning = true;
      this.manager.startDeviceScan(
        serviceUUIDs || null,
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.error('BLE scan error:', error);
            this.isScanning = false;
            return;
          }

          if (device && device.name) {
            console.log('BLE device found:', device.id, device.name);
            this.notifyScanCallbacks(device);
          }
        }
      );

      console.log('BLE scan started');
    } catch (error) {
      console.error('Start BLE scan error:', error);
      this.isScanning = false;
      throw error;
    }
  }

  async stopScan(): Promise<void> {
    try {
      this.manager.stopDeviceScan();
      this.isScanning = false;
      console.log('BLE scan stopped');
    } catch (error) {
      console.error('Stop BLE scan error:', error);
      throw error;
    }
  }

  async connectDevice(deviceId: string): Promise<void> {
    try {
      const device = await this.manager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();

      this.connectedDevices.set(deviceId, device);
      this.notifyConnectionCallbacks(device, true);

      device.onDisconnected(() => {
        console.log('Device disconnected:', deviceId);
        this.connectedDevices.delete(deviceId);
        this.notifyConnectionCallbacks(device, false);
      });

      await this.setupCharacteristicNotifications(device);
      console.log('Device connected:', deviceId);
    } catch (error) {
      console.error('Connect device error:', error);
      throw error;
    }
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    try {
      const device = this.connectedDevices.get(deviceId);
      if (device) {
        await device.cancelConnection();
        this.connectedDevices.delete(deviceId);
        this.notifyConnectionCallbacks(device, false);
        console.log('Device disconnected:', deviceId);
      }
    } catch (error) {
      console.error('Disconnect device error:', error);
      throw error;
    }
  }

  async sendData(
    deviceId: string,
    serviceUUID: string,
    characteristicUUID: string,
    data: string
  ): Promise<void> {
    try {
      const device = this.connectedDevices.get(deviceId);
      if (!device) {
        throw new Error('Device not connected');
      }

      const base64Data = Buffer.from(data, 'utf-8').toString('base64');
      await device.writeCharacteristicWithResponseForService(
        serviceUUID,
        characteristicUUID,
        base64Data
      );

      console.log('Data sent to device:', deviceId);
    } catch (error) {
      console.error('Send data error:', error);
      throw error;
    }
  }

  private async setupCharacteristicNotifications(device: Device): Promise<void> {
    try {
      const services = await device.services();

      for (const service of services) {
        const characteristics = await service.characteristics();

        for (const characteristic of characteristics) {
          if (characteristic.isNotifiable || characteristic.isIndicatable) {
            device.monitorCharacteristicForService(
              service.uuid,
              characteristic.uuid,
              (error, char) => {
                if (error) {
                  console.error('Characteristic monitor error:', error);
                  return;
                }

                if (char?.value) {
                  const data = Buffer.from(char.value, 'base64').toString('utf-8');
                  this.notifyDataCallbacks(data);
                }
              }
            );
          }
        }
      }
    } catch (error) {
      console.error('Setup notifications error:', error);
    }
  }

  subscribeToScan(callback: ScanCallback): () => void {
    this.scanCallbacks.push(callback);
    return () => {
      this.scanCallbacks = this.scanCallbacks.filter((cb) => cb !== callback);
    };
  }

  subscribeToConnection(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.push(callback);
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter((cb) => cb !== callback);
    };
  }

  subscribeToData(callback: DataCallback): () => void {
    this.dataCallbacks.push(callback);
    return () => {
      this.dataCallbacks = this.dataCallbacks.filter((cb) => cb !== callback);
    };
  }

  private notifyScanCallbacks(device: Device): void {
    this.scanCallbacks.forEach((callback) => callback(device));
  }

  private notifyConnectionCallbacks(device: Device, isConnected: boolean): void {
    this.connectionCallbacks.forEach((callback) => callback(device, isConnected));
  }

  private notifyDataCallbacks(data: string): void {
    this.dataCallbacks.forEach((callback) => callback(data));
  }

  getConnectedDevices(): Device[] {
    return Array.from(this.connectedDevices.values());
  }

  cleanup(): void {
    this.connectedDevices.forEach((device) => {
      device.cancelConnection().catch((error) => console.error('Cleanup error:', error));
    });
    this.connectedDevices.clear();
    this.manager.destroy();
  }
}

export const BLEService = BLEServiceClass.getInstance();
