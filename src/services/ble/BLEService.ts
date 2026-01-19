import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import { Platform, NativeModules } from 'react-native';
import { NativeEventEmitter } from 'react-native';

type ScanCallback = (device: Device) => void;
type ConnectionCallback = (device: Device, isConnected: boolean) => void;
type DataCallback = (data: string) => void;

class BLEServiceClass {
  private static instance: BLEServiceClass;
  private manager: BleManager;
  private connectedDevices: Map<string, Device> = new Map();
  private scanListeners: ScanCallback[] = [];
  private connectionListeners: ConnectionCallback[] = [];
  private dataListeners: DataCallback[] = [];
  private isScanning = false;

  static getInstance(): BLEServiceClass {
    if (!BLEServiceClass.instance) {
      BLEServiceClass.instance = new BLEServiceClass();
    }
    return BLEServiceClass.instance;
  }

  constructor() {
    this.manager = new BleManager();
  }

  async initialize(): Promise<void> {
    try {
      const state = await this.manager.state();
      console.log('BLE Manager state:', state);

      this.manager.onStateChange((state) => {
        console.log('BLE state changed:', state);
      }, true);
    } catch (error) {
      console.error('BLE initialization error:', error);
      throw error;
    }
  }

  async startScan(serviceUUIDs?: string[]): Promise<void> {
    try {
      if (this.isScanning) {
        console.warn('Scan already in progress');
        return;
      }

      this.isScanning = true;
      this.manager.startDeviceScan(
        serviceUUIDs,
        null,
        (error, device) => {
          if (error) {
            console.error('Scan error:', error);
            this.isScanning = false;
            return;
          }

          if (device?.name) {
            console.log('Device found:', device.id, device.name);
            this.notifyScanListeners(device);
          }
        }
      );
    } catch (error) {
      console.error('Start scan error:', error);
      this.isScanning = false;
      throw error;
    }
  }

  async stopScan(): Promise<void> {
    try {
      this.manager.stopDeviceScan();
      this.isScanning = false;
    } catch (error) {
      console.error('Stop scan error:', error);
      throw error;
    }
  }

  async connectDevice(deviceId: string): Promise<void> {
    try {
      const device = await this.manager.connectToDevice(deviceId, {
        autoConnect: false,
      });

      await device.discoverAllServicesAndCharacteristics();
      this.connectedDevices.set(deviceId, device);

      this.notifyConnectionListeners(device, true);

      this.setupDisconnectionListener(device);
      this.setupCharacteristicNotifications(device);
    } catch (error) {
      console.error('Connect device error:', error);
      throw error;
    }
  }

  private setupDisconnectionListener(device: Device): void {
    device.onDisconnected(() => {
      console.log('Device disconnected:', device.id);
      this.connectedDevices.delete(device.id);
      this.notifyConnectionListeners(device, false);
    });
  }

  private async setupCharacteristicNotifications(device: Device): Promise<void> {
    try {
      const services = await device.services();

      for (const service of services) {
        const characteristics = await service.characteristics();

        for (const characteristic of characteristics) {
          if (
            characteristic.isNotifiable ||
            characteristic.isIndicatable
          ) {
            await device.monitorCharacteristicForService(
              service.uuid,
              characteristic.uuid,
              (error, char) => {
                if (error) {
                  console.error('Characteristic monitor error:', error);
                  return;
                }

                if (char?.value) {
                  const data = Buffer.from(char.value, 'base64').toString(
                    'utf-8'
                  );
                  this.notifyDataListeners(data);
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

  async disconnectDevice(deviceId: string): Promise<void> {
    try {
      const device = this.connectedDevices.get(deviceId);
      if (device) {
        await device.cancelConnection();
        this.connectedDevices.delete(deviceId);
        this.notifyConnectionListeners(device, false);
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

      console.log('Data sent successfully');
    } catch (error) {
      console.error('Send data error:', error);
      throw error;
    }
  }

  subscribeToScan(callback: ScanCallback): () => void {
    this.scanListeners.push(callback);
    return () => {
      this.scanListeners = this.scanListeners.filter((cb) => cb !== callback);
    };
  }

  subscribeToConnection(callback: ConnectionCallback): () => void {
    this.connectionListeners.push(callback);
    return () => {
      this.connectionListeners = this.connectionListeners.filter(
        (cb) => cb !== callback
      );
    };
  }

  subscribeToData(callback: DataCallback): () => void {
    this.dataListeners.push(callback);
    return () => {
      this.dataListeners = this.dataListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyScanListeners(device: Device): void {
    this.scanListeners.forEach((listener) => listener(device));
  }

  private notifyConnectionListeners(device: Device, isConnected: boolean): void {
    this.connectionListeners.forEach((listener) =>
      listener(device, isConnected)
    );
  }

  private notifyDataListeners(data: string): void {
    this.dataListeners.forEach((listener) => listener(data));
  }

  getConnectedDevices(): Device[] {
    return Array.from(this.connectedDevices.values());
  }

  cleanup(): void {
    this.connectedDevices.forEach((device) => {
      device.cancelConnection().catch((error) =>
        console.error('Cleanup error:', error)
      );
    });
    this.connectedDevices.clear();
    this.manager.destroy();
  }
}

export const BLEService = BLEServiceClass.getInstance();
