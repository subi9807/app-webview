window.__nativebridge = (function() {
  const callbacks = new Map();
  let messageId = 0;

  function generateId() {
    return `msg_${++messageId}`;
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

      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    });
  }

  return {
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
    },

    handleBLEDeviceFound(device) {
      if (window.__onBLEDeviceFound) {
        window.__onBLEDeviceFound(device);
      }
    },

    handleBLEDataReceived(data) {
      if (window.__onBLEDataReceived) {
        window.__onBLEDataReceived(data);
      }
    },

    getFCMToken() {
      return sendMessage('getFCMToken', {});
    },

    getCurrentLocation() {
      return sendMessage('getCurrentLocation', {});
    },

    startLocationTracking(callback) {
      window.__onLocationUpdate = callback;
      return sendMessage('startLocationTracking', {});
    },

    stopLocationTracking() {
      window.__onLocationUpdate = null;
      return sendMessage('stopLocationTracking', {});
    },

    requestLocationPermission() {
      return sendMessage('requestLocationPermission', {});
    },

    startBLEScan(serviceUUIDs, callback) {
      window.__onBLEDeviceFound = callback;
      return sendMessage('startBLEScan', { serviceUUIDs });
    },

    stopBLEScan() {
      window.__onBLEDeviceFound = null;
      return sendMessage('stopBLEScan', {});
    },

    connectBLEDevice(deviceId, dataCallback) {
      window.__onBLEDataReceived = dataCallback;
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

    requestCameraPermission() {
      return sendMessage('requestCameraPermission', {});
    },

    requestPhotoLibraryPermission() {
      return sendMessage('requestPhotoLibraryPermission', {});
    },
  };
})();

window.__nativeBridgeReady = true;
if (window.__onBridgeReady) {
  window.__onBridgeReady();
}
