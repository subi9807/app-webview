import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { WebViewBridge } from '../services/WebViewBridge';
import { FirebaseService } from '../services/FirebaseService';
import { LocationService } from '../services/LocationService';
import { BLEService } from '../services/BLEService';

const WEBVIEW_URL = 'https://onub2b.com/login';

const BRIDGE_SCRIPT = `
(function() {
  const callbacks = new Map();
  let messageId = 0;

  function generateId() {
    return \`msg_\${Date.now()}_\${++messageId}\`;
  }

  function sendMessage(method, params) {
    return new Promise((resolve, reject) => {
      const id = generateId();
      const timeout = setTimeout(() => {
        callbacks.delete(id);
        reject(new Error(\`Timeout for method: \${method}\`));
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

      const message = { id, method, params };
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    });
  }

  window.__nativebridge = {
    handleNativeResponse(response) {
      const callback = callbacks.get(response.id);
      if (callback) callback(response);
    },

    handleLocationUpdate(location) {
      if (window.__onLocationUpdate) window.__onLocationUpdate(location);
      window.dispatchEvent(new CustomEvent('nativeLocationUpdate', { detail: location }));
    },

    handleBLEDeviceFound(device) {
      if (window.__onBLEDeviceFound) window.__onBLEDeviceFound(device);
      window.dispatchEvent(new CustomEvent('nativeBLEDeviceFound', { detail: device }));
    },

    handleBLEDataReceived(data) {
      if (window.__onBLEDataReceived) window.__onBLEDataReceived(data);
      window.dispatchEvent(new CustomEvent('nativeBLEDataReceived', { detail: data }));
    },

    getFCMToken: () => sendMessage('getFCMToken', {}),
    getCurrentLocation: () => sendMessage('getCurrentLocation', {}),
    startLocationTracking: (callback) => {
      if (callback) window.__onLocationUpdate = callback;
      return sendMessage('startLocationTracking', {});
    },
    stopLocationTracking: () => {
      window.__onLocationUpdate = null;
      return sendMessage('stopLocationTracking', {});
    },
    requestLocationPermission: () => sendMessage('requestLocationPermission', {}),
    startBLEScan: (serviceUUIDs, callback) => {
      if (callback) window.__onBLEDeviceFound = callback;
      return sendMessage('startBLEScan', { serviceUUIDs });
    },
    stopBLEScan: () => {
      window.__onBLEDeviceFound = null;
      return sendMessage('stopBLEScan', {});
    },
    connectBLEDevice: (deviceId, dataCallback) => {
      if (dataCallback) window.__onBLEDataReceived = dataCallback;
      return sendMessage('connectBLEDevice', { deviceId });
    },
    disconnectBLEDevice: (deviceId) => {
      window.__onBLEDataReceived = null;
      return sendMessage('disconnectBLEDevice', { deviceId });
    },
    sendBLEData: (deviceId, serviceUUID, characteristicUUID, data) =>
      sendMessage('sendBLEData', { deviceId, serviceUUID, characteristicUUID, data }),
    requestBluetoothPermission: () => sendMessage('requestBluetoothPermission', {}),
    isReady: () => true,
  };

  window.__nativeBridgeReady = true;
  console.log('Native bridge initialized');
  window.dispatchEvent(new Event('nativeBridgeReady'));
})();
true;
`;

export default function HomeScreen() {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    initializeServices();
    WebViewBridge.setWebViewRef(webViewRef);

    return () => {
      WebViewBridge.cleanup();
      LocationService.cleanup();
      BLEService.cleanup();
      FirebaseService.cleanup();
    };
  }, []);

  const initializeServices = async () => {
    try {
      await FirebaseService.initialize();
      console.log('All services initialized');
    } catch (error) {
      console.error('Service initialization error:', error);
    }
  };

  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      await WebViewBridge.handleMessage(event.nativeEvent.data);
    } catch (error) {
      console.error('Handle message error:', error);
    }
  };

  const handleLoadStart = () => {
    setIsLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    setError(nativeEvent.description || 'Failed to load page');
    setIsLoading(false);
  };

  const handleRetry = () => {
    setError(null);
    webViewRef.current?.reload();
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#ffffff' }]}>
      {error && (
        <View style={[
          styles.errorContainer,
          {
            backgroundColor: isDark ? '#3d1f1f' : '#ffebee',
            borderBottomColor: isDark ? '#d32f2f' : '#ef5350',
          }
        ]}>
          <Text style={[styles.errorText, { color: isDark ? '#ffcdd2' : '#c62828' }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: isDark ? '#d32f2f' : '#ef5350' }]}
            onPress={handleRetry}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: WEBVIEW_URL }}
        style={[
          styles.webView,
          {
            opacity: error ? 0.3 : 1,
            backgroundColor: isDark ? '#000000' : '#ffffff',
          }
        ]}
        onMessage={handleMessage}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        userAgent={`${Platform.select({
          ios: 'onub2b-ios',
          android: 'onub2b-android',
          default: 'onub2b-web',
        })} (Mobile App)`}
        scalesPageToFit={true}
        scrollEnabled={true}
        sharedCookiesEnabled={true}
        injectedJavaScript={BRIDGE_SCRIPT}
        onShouldStartLoadWithRequest={(request) => {
          const url = request.url;
          return (
            url.startsWith('http://') ||
            url.startsWith('https://') ||
            url.startsWith('mailto:') ||
            url.startsWith('tel:')
          );
        }}
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={true}
        allowsInlineMediaPlayback={true}
      />

      {isLoading && !error && (
        <View style={[
          styles.loadingOverlay,
          { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)' }
        ]}>
          <ActivityIndicator size="large" color={isDark ? '#ffffff' : '#007AFF'} />
          <Text style={[styles.loadingText, { color: isDark ? '#ffffff' : '#666666' }]}>
            Loading...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    padding: 16,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 12,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
