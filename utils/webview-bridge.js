// WebView JavaScript Bridge
// This script is injected into the WebView to provide native APIs

(function() {
  const callbacks = new Map();
  let messageId = 0;

  function generateId() {
    return `msg_${Date.now()}_${++messageId}`;
  }

  function sendMessage(method, params) {
    return new Promise((resolve, reject) => {
      const id = generateId();
      const timeout = setTimeout(() => {
        callbacks.delete(id);
        reject(new Error(`Timeout for method: ${method}`));
      }, 30000);

      callbacks.set(id, (response) => {
        clearTimeout(timeout);
        callbacks.delete(id);
        if (response.success) {
          resolve(response.result);
        } else {
          reject(new Error(response.error || 'Unknown error'));
        }
      });

      const message = {
        id,
        method,
        params,
      };

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      } else {
        console.error('ReactNativeWebView not available');
        reject(new Error('ReactNativeWebView not available'));
      }
    });
  }

  window.__nativebridge = {
    handleNativeResponse(response) {
      const callback = callbacks.get(response.id);
      if (callback) {
        callback(response);
      }
    },

    handleLocationUpdate(location) {
      if (window.__onLocationUpdate) {
        window.__onLocationUpdate(location);
      }
      window.dispatchEvent(new CustomEvent('nativeLocationUpdate', { detail: location }));
    },

    handleBLEDeviceFound(device) {
      if (window.__onBLEDeviceFound) {
        window.__onBLEDeviceFound(device);
      }
      window.dispatchEvent(new CustomEvent('nativeBLEDeviceFound', { detail: device }));
    },

    handleBLEDataReceived(data) {
      if (window.__onBLEDataReceived) {
        window.__onBLEDataReceived(data);
      }
      window.dispatchEvent(new CustomEvent('nativeBLEDataReceived', { detail: data }));
    },

    // Firebase FCM
    getFCMToken() {
      return sendMessage('getFCMToken', {});
    },

    // Location Services
    getCurrentLocation() {
      return sendMessage('getCurrentLocation', {});
    },

    startLocationTracking(callback) {
      if (callback) {
        window.__onLocationUpdate = callback;
      }
      return sendMessage('startLocationTracking', {});
    },

    stopLocationTracking() {
      window.__onLocationUpdate = null;
      return sendMessage('stopLocationTracking', {});
    },

    requestLocationPermission() {
      return sendMessage('requestLocationPermission', {});
    },

    // Bluetooth BLE
    startBLEScan(serviceUUIDs, callback) {
      if (callback) {
        window.__onBLEDeviceFound = callback;
      }
      return sendMessage('startBLEScan', { serviceUUIDs });
    },

    stopBLEScan() {
      window.__onBLEDeviceFound = null;
      return sendMessage('stopBLEScan', {});
    },

    connectBLEDevice(deviceId, dataCallback) {
      if (dataCallback) {
        window.__onBLEDataReceived = dataCallback;
      }
      return sendMessage('connectBLEDevice', { deviceId });
    },

    disconnectBLEDevice(deviceId) {
      window.__onBLEDataReceived = null;
      return sendMessage('disconnectBLEDevice', { deviceId });
    },

    sendBLEData(deviceId, serviceUUID, characteristicUUID, data) {
      return sendMessage('sendBLEData', {
        deviceId,
        serviceUUID,
        characteristicUUID,
        data,
      });
    },

    requestBluetoothPermission() {
      return sendMessage('requestBluetoothPermission', {});
    },

    // Helper: Check if bridge is ready
    isReady() {
      return !!window.ReactNativeWebView;
    },
  };

  window.__nativeBridgeReady = true;
  console.log('Native bridge initialized');

  if (window.__onBridgeReady) {
    window.__onBridgeReady();
  }

  window.dispatchEvent(new Event('nativeBridgeReady'));
})();
