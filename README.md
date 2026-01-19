# ONUB2B Mobile App

A production-ready cross-platform React Native mobile application that wraps the onub2b.com website with native capabilities including Firebase Cloud Messaging, Bluetooth Low Energy support, and GPS location services.

## Features

### Core Functionality
- **WebView Integration**: Loads and displays https://onub2b.com
- **Full-duplex Communication**: Native ↔ WebView bidirectional messaging
- **File Upload Support**: Camera and gallery integration through WebView
- **Cookie Sharing**: Maintains session across native and web components

### Firebase Cloud Messaging
- Foreground push notifications
- Background message handling
- App-terminated notification delivery
- Device token management and refresh

### Bluetooth Low Energy
- Device scanning and discovery
- Connection/disconnection management
- Characteristic read/write operations
- Real-time data notifications
- iOS & Android support

### GPS & Location Services
- One-time location requests (high accuracy)
- Continuous location tracking
- Background location updates (iOS/Android)
- Location permission management
- Accuracy reporting

### Security & Permissions
- Centralized permission management
- Platform-specific permission handling
- Graceful permission denial handling
- Privacy compliance

## Technology Stack

- **Framework**: React Native 0.75.4
- **Language**: TypeScript
- **Navigation**: React Navigation
- **Notifications**: @react-native-firebase/messaging
- **Bluetooth**: react-native-ble-plx
- **Location**: react-native-geolocation-service
- **Permissions**: react-native-permissions
- **State Management**: Native hooks & services

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Xcode 14+ (macOS)
- Android Studio 2022.1+
- Firebase project configured

### Installation

1. **Clone and install dependencies**
```bash
npm install
```

2. **Configure Firebase**
   - Download `google-services.json` from Firebase Console
   - Place in `android/app/google-services.json`
   - Download `GoogleService-Info.plist`
   - Add to Xcode project under `ios/onub2bmobile/`

3. **Setup iOS**
```bash
cd ios && pod install && cd ..
```

4. **Setup Android**
```bash
cd android && ./gradlew clean && cd ..
```

### Running

**iOS**:
```bash
npm run ios
```

**Android**:
```bash
npm run android
```

## Project Structure

```
project/
├── src/
│   ├── App.tsx                           # Main app entry
│   ├── screens/
│   │   └── WebViewScreen.tsx             # WebView UI
│   ├── services/
│   │   ├── firebase/
│   │   │   └── FirebaseService.ts        # FCM handling
│   │   ├── ble/
│   │   │   └── BLEService.ts             # Bluetooth implementation
│   │   ├── location/
│   │   │   └── LocationService.ts        # GPS service
│   │   ├── permissions/
│   │   │   └── PermissionService.ts      # Permission management
│   │   └── bridge/
│   │       └── WebViewBridge.ts          # Native-WebView bridge
│   └── utils/
│       ├── webview-bridge.js             # JavaScript bridge API
│       ├── logger.ts                     # Logging utility
│       └── errors.ts                     # Error handling
├── android/
│   ├── app/
│   │   ├── build.gradle                  # Android build config
│   │   └── src/main/
│   │       ├── AndroidManifest.xml       # Permissions
│   │       └── java/                     # Native Android code
│   └── ...
├── ios/
│   ├── onub2bmobile/
│   │   └── Info.plist                    # iOS configuration
│   └── Podfile                           # iOS dependencies
├── index.js                              # App entry point
├── metro.config.js                       # Metro bundler config
└── app.json                              # App metadata
```

## WebView Bridge API

The WebView has access to native functionality through `window.__nativebridge`:

### Location Services
```javascript
// Get current location once
const location = await window.__nativebridge.getCurrentLocation();

// Start continuous tracking
await window.__nativebridge.startLocationTracking((location) => {
  console.log('Location:', location);
});

// Stop tracking
await window.__nativebridge.stopLocationTracking();

// Request permission
const granted = await window.__nativebridge.requestLocationPermission();
```

### Bluetooth
```javascript
// Start scanning
await window.__nativebridge.startBLEScan(['service-uuid'], (device) => {
  console.log('Device found:', device);
});

// Connect to device
await window.__nativebridge.connectBLEDevice('device-id');

// Send data
await window.__nativebridge.sendBLEData(
  'device-id',
  'service-uuid',
  'characteristic-uuid',
  'data-string'
);

// Receive data
window.__onBLEDataReceived = (data) => {
  console.log('Data received:', data);
};

// Disconnect
await window.__nativebridge.disconnectBLEDevice('device-id');

// Stop scanning
await window.__nativebridge.stopBLEScan();

// Request permission
const granted = await window.__nativebridge.requestBluetoothPermission();
```

### Firebase Cloud Messaging
```javascript
// Get FCM token
const token = await window.__nativebridge.getFCMToken();
console.log('FCM Token:', token);
```

### Permissions
```javascript
const cameraGranted = await window.__nativebridge.requestCameraPermission();
const libraryGranted = await window.__nativebridge.requestPhotoLibraryPermission();
```

## Architecture

### Message Protocol

Messages sent from WebView to Native:
```json
{
  "id": "unique-message-id",
  "method": "methodName",
  "params": { /* method parameters */ }
}
```

Responses sent from Native to WebView:
```json
{
  "id": "unique-message-id",
  "method": "methodName",
  "success": true,
  "result": { /* result data */ }
}
```

### Service Layer

All native functionality is encapsulated in singleton service classes:

- **FirebaseService**: FCM token management and notification handling
- **BLEService**: Bluetooth scanning, connection, and data transfer
- **LocationService**: GPS location acquisition and tracking
- **PermissionService**: Platform-specific permission management
- **WebViewBridge**: Message routing and response handling

### Error Handling

Comprehensive error handling with typed error classes:
- `LocationError`: Location service failures
- `BluetoothError`: BLE operation failures
- `FirebaseError`: FCM initialization/token errors
- `PermissionError`: Permission denial
- `NetworkError`: Network connectivity issues

## Configuration

### Android Configuration

**Required Permissions** (AndroidManifest.xml):
- `android.permission.INTERNET`
- `android.permission.ACCESS_FINE_LOCATION`
- `android.permission.BLUETOOTH_SCAN`
- `android.permission.BLUETOOTH_CONNECT`
- `android.permission.CAMERA`
- `android.permission.POST_NOTIFICATIONS`

**Build Configuration** (build.gradle):
- Target SDK: 34+
- Min SDK: 21+
- Firebase plugin integration

### iOS Configuration

**Required Permissions** (Info.plist):
- `NSLocationWhenInUseUsageDescription`
- `NSLocationAlwaysAndWhenInUseUsageDescription`
- `NSBluetoothPeripheralUsageDescription`
- `NSCameraUsageDescription`
- `NSPhotoLibraryUsageDescription`

**Background Modes** (Info.plist):
- Remote notifications
- Location updates
- Bluetooth LE

## Performance Optimization

- **Code Splitting**: Services are lazy-loaded on demand
- **Memory Management**: Proper cleanup in service destructors
- **Message Batching**: Throttled location and BLE updates
- **Native Threading**: Heavy operations run off main thread
- **Hermes Engine**: Enabled for faster JavaScript execution

## Security

- HTTPS-only WebView loading
- Token validation on server-side
- Permission-based feature access
- Secure credential storage (native keychain)
- Message encryption for sensitive data
- No sensitive data logging in production

## Debugging

### Enable Logging
```typescript
import { Logger } from '@/utils/logger';

Logger.debug('Message', { data });
Logger.info('Info');
Logger.warn('Warning');
Logger.error('Error', error);

// Export logs for debugging
const logs = Logger.exportLogs();
```

### View WebView Console
- iOS: Safari DevTools → Develop menu
- Android: Chrome DevTools → chrome://inspect

### Bridge Testing
```javascript
console.log(window.__nativebridge);
await window.__nativebridge.getFCMToken();
```

## Build for Production

### Android Release Build
```bash
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
cd ..
```

### iOS Release Build
```bash
cd ios
xcodebuild -workspace onub2bmobile.xcworkspace \
  -scheme onub2bmobile \
  -configuration Release
cd ..
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Pod installation fails | `cd ios && rm -rf Pods && pod install && cd ..` |
| Android build fails | `cd android && ./gradlew clean && ./gradlew build && cd ..` |
| Firebase not initializing | Verify google-services.json and GoogleService-Info.plist locations |
| Bluetooth not connecting | Check device pairing and permissions |
| Location not working | Enable location services on device |
| Bridge undefined in WebView | Wait for page load completion |

## Documentation

- **[SETUP.md](./SETUP.md)**: Detailed setup and installation guide
- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)**: WebView-Native bridge implementation guide

## License

Proprietary - All rights reserved

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
3. Check React Native and Firebase documentation

## Version History

### v1.0.0
- Initial release
- Firebase FCM integration
- Bluetooth BLE support
- GPS location services
- WebView bridge implementation
