# Native-WebView Integration Guide

This document explains how the native React Native app communicates with the WebView displaying onub2b.com.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ WebView (https://onub2b.com)                                │
│                                                              │
│ window.__nativebridge - JavaScript API                      │
└────────────────────────┬────────────────────────────────────┘
                         │ JSON messages
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ WebViewBridge (src/services/bridge/WebViewBridge.ts)        │
│                                                              │
│ Handles message routing and responses                        │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Firebase     │  │ BLE Service  │  │ Location     │
│ Service      │  │              │  │ Service      │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Message Flow

### 1. WebView to Native

The WebView sends a message using `ReactNativeWebView.postMessage()`:

```javascript
const message = {
  id: 'unique-message-id',
  method: 'getFCMToken',
  params: {}
};
window.ReactNativeWebView.postMessage(JSON.stringify(message));
```

### 2. Native Processing

The WebViewScreen receives the message and forwards it to WebViewBridge:

```typescript
handleWebViewMessage(event: WebViewMessageEvent) {
  await WebViewBridge.handleMessage(event);
}
```

### 3. Native to WebView Response

After processing, the response is injected back into the WebView:

```javascript
const script = `
  if (window.__nativebridge) {
    window.__nativebridge.handleNativeResponse({
      id: 'unique-message-id',
      method: 'getFCMToken',
      success: true,
      result: 'fcm-token-value'
    });
  }
`;
webViewRef.injectJavaScript(script);
```

## Implementing New Features

### Example: Adding a New Native Function

#### 1. Add to Native Bridge (WebViewBridge.ts)

```typescript
private setupHandlers(): void {
  // ... existing handlers ...
  this.handlers.set('myNewFeature', this.handleMyNewFeature.bind(this));
}

private async handleMyNewFeature(params?: any): Promise<any> {
  // Implement your logic here
  const result = await doSomething(params);
  return result;
}
```

#### 2. Add to JavaScript Bridge (webview-bridge.js)

```javascript
myNewFeature(param) {
  return sendMessage('myNewFeature', { param });
}
```

#### 3. Use in WebView

```javascript
const result = await window.__nativebridge.myNewFeature('value');
```

## Real-World Examples

### Example 1: Getting Device Info

**Native Side (Service):**
```typescript
// src/services/device/DeviceService.ts
class DeviceServiceClass {
  async getDeviceInfo() {
    return {
      platform: Platform.OS,
      version: Platform.Version,
      appVersion: DeviceInfo.getVersion(),
    };
  }
}
```

**Bridge Handler:**
```typescript
private async handleGetDeviceInfo(params?: any): Promise<any> {
  return DeviceService.getDeviceInfo();
}
```

**WebView Usage:**
```javascript
const deviceInfo = await window.__nativebridge.getDeviceInfo();
console.log('Platform:', deviceInfo.platform);
console.log('App Version:', deviceInfo.appVersion);
```

### Example 2: Listening for Real-Time Updates

**Setting Up Listener (Native):**
```typescript
private async handleStartMonitoring(params?: any): Promise<void> {
  this.unsubscribeMonitoring = BLEService.subscribeToData((data) => {
    this.sendUpdate('monitoringUpdate', data);
  });
}

private sendUpdate(type: string, data: any): void {
  if (this.webViewRef) {
    const script = `
      if (window.__onMonitoringUpdate) {
        window.__onMonitoringUpdate({
          type: '${type}',
          data: ${JSON.stringify(data)}
        });
      }
    `;
    this.webViewRef.injectJavaScript(script);
  }
}
```

**WebView Listener:**
```javascript
window.__onMonitoringUpdate = (update) => {
  console.log('Received update:', update);
  // Handle the update in your web app
};

// Start monitoring
await window.__nativebridge.startMonitoring();
```

### Example 3: Handling Camera Upload

**Native Handler:**
```typescript
private async handleUploadPhoto(params?: any): Promise<string> {
  const hasPermission = await PermissionService.requestCameraPermission();
  if (!hasPermission) {
    throw new Error('Camera permission denied');
  }

  // Use native camera implementation
  const photoPath = await launchCamera();
  return photoPath;
}
```

**WebView Usage:**
```javascript
try {
  const photoPath = await window.__nativebridge.uploadPhoto();
  // Send photo to server
} catch (error) {
  console.error('Camera error:', error.message);
}
```

## Error Handling

### On the Native Side

```typescript
try {
  const result = await handler(message.params);
  this.sendResponse(message.id, message.method, true, result);
} catch (error) {
  this.sendResponse(
    message.id,
    message.method,
    false,
    null,
    error.message
  );
}
```

### On the WebView Side

```javascript
try {
  const result = await window.__nativebridge.someMethod();
} catch (error) {
  console.error('Native call failed:', error.message);
  // Handle error in your web app
}
```

## Data Types

### Location Data
```typescript
interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}
```

### BLE Device
```typescript
interface BLEDevice {
  id: string;
  name: string;
  rssi: number;
}
```

### FCM Token Response
```typescript
interface FCMToken {
  token: string;
  timestamp: number;
}
```

## Performance Considerations

1. **Message Size**: Keep JSON payloads under 1MB
2. **Frequency**: Throttle real-time updates to reduce overhead
3. **Threading**: All native operations run on background threads
4. **Memory**: Clean up listeners when components unmount

```javascript
// Always clean up
window.__onLocationUpdate = null;
await window.__nativebridge.stopLocationTracking();
```

## Security Considerations

1. **HTTPS Only**: The WebView loads HTTPS by default
2. **Token Validation**: FCM tokens are server-side validated
3. **Permission Checks**: All features require explicit permission
4. **Data Encryption**: Sensitive data uses native secure storage
5. **Message Authentication**: Messages are validated on both sides

## Testing the Bridge

### Console Debugging (iOS Simulator)
```javascript
console.log('Testing bridge');
console.log(window.__nativebridge);
```

### Testing Specific Functions
```javascript
// Test FCM Token
window.__nativebridge.getFCMToken()
  .then(token => console.log('FCM:', token))
  .catch(error => console.error('Error:', error));

// Test Location
window.__nativebridge.getCurrentLocation()
  .then(location => console.log('Location:', location))
  .catch(error => console.error('Error:', error));
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Bridge not defined | Wait for `window.__nativeBridgeReady` |
| Permission denied | Check device settings and re-request |
| Timeout errors | Increase timeout in bridge or check service |
| Data not updating | Verify subscriptions are active |
| Memory leaks | Always unsubscribe from listeners |

## Resources

- [React Native WebView Documentation](https://github.com/react-native-webview/react-native-webview)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [react-native-ble-plx](https://github.com/dotintent/react-native-ble-plx)
- [react-native-geolocation-service](https://github.com/Agontuk/react-native-geolocation-service)
