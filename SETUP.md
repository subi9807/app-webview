# ONUB2B Mobile App - Setup Guide

This is a production-ready React Native mobile application with Firebase Cloud Messaging (FCM), Bluetooth Low Energy (BLE) support, and GPS location services.

## Prerequisites

- Node.js 18+ and npm 9+
- Xcode 14+ (for iOS development)
- Android Studio 2022.1+ with Android SDK (for Android development)
- Firebase project set up
- A device with iOS 12+ or Android 6.0+

## Project Structure

```
project/
├── src/
│   ├── App.tsx                 # Main app component
│   ├── screens/
│   │   └── WebViewScreen.tsx   # WebView implementation
│   ├── services/
│   │   ├── firebase/           # Firebase FCM service
│   │   ├── ble/               # Bluetooth BLE service
│   │   ├── location/          # GPS location service
│   │   ├── permissions/       # Permission management
│   │   └── bridge/            # WebView <-> Native bridge
│   └── utils/
│       ├── webview-bridge.js   # JavaScript bridge for WebView
│       ├── logger.ts           # Logging utility
│       └── errors.ts           # Error handling
├── android/                    # Android native code
├── ios/                        # iOS native code
└── index.js                   # App entry point
```

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Firebase

#### Android
1. Create a Firebase project at https://console.firebase.google.com
2. Add Android app to your Firebase project
3. Download `google-services.json`
4. Place it in `android/app/google-services.json`

#### iOS
1. Download `GoogleService-Info.plist`
2. Add it to Xcode project under `ios/onub2bmobile/`

### 3. Configure Android

```bash
cd android
./gradlew clean build
cd ..
```

### 4. Configure iOS

```bash
cd ios
pod install
cd ..
```

### 5. Update Permissions

Permissions are automatically configured in:
- `android/app/src/main/AndroidManifest.xml`
- `ios/onub2bmobile/Info.plist`

## Running the App

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

## WebView Bridge Usage

The app communicates with the WebView (https://onub2b.com) through a JavaScript bridge.

### Getting FCM Token

```javascript
const token = await window.__nativebridge.getFCMToken();
console.log('FCM Token:', token);
```

### Location Services

```javascript
// Get current location
const location = await window.__nativebridge.getCurrentLocation();
console.log('Location:', location);

// Start continuous tracking
await window.__nativebridge.startLocationTracking((location) => {
  console.log('Location update:', location);
});

// Stop tracking
await window.__nativebridge.stopLocationTracking();
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
  'data'
);

// Disconnect
await window.__nativebridge.disconnectBLEDevice('device-id');

// Stop scanning
await window.__nativebridge.stopBLEScan();
```

### Permissions

```javascript
// Request permissions
const hasLocationPermission = await window.__nativebridge.requestLocationPermission();
const hasBluetoothPermission = await window.__nativebridge.requestBluetoothPermission();
const hasCameraPermission = await window.__nativebridge.requestCameraPermission();
```

## API Reference

### LocationData
```typescript
{
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}
```

## Error Handling

The app includes comprehensive error handling through `src/utils/errors.ts`. All services throw well-typed errors that can be caught and handled appropriately.

## Logging

Use the Logger utility for consistent logging:

```typescript
import { Logger } from '@/utils/logger';

Logger.debug('Debug message', { data });
Logger.info('Info message');
Logger.warn('Warning message', { details });
Logger.error('Error message', error);

// Export logs for debugging
const logs = Logger.exportLogs();
```

## Permissions Configuration

### Android Permissions
- `INTERNET` - Required for WebView and API calls
- `ACCESS_FINE_LOCATION` - GPS location access
- `ACCESS_COARSE_LOCATION` - Approximate location
- `BLUETOOTH_SCAN` - BLE scanning
- `BLUETOOTH_CONNECT` - BLE connection
- `CAMERA` - Camera access
- `POST_NOTIFICATIONS` - Push notifications

### iOS Permissions
- Location - When In Use
- Location - Always (optional, for background tracking)
- Bluetooth - Bluetooth Peripheral
- Camera - Camera access
- Photo Library - Photo access

## Background Modes

### iOS
- Remote notifications (Push)
- Location updates
- Bluetooth LE (for BLE communication)

### Android
- Foreground service for location updates
- Background tasks for BLE

## Troubleshooting

### Build Issues

**iOS Pod Installation Failed**
```bash
cd ios && rm -rf Pods && pod install && cd ..
```

**Android Build Failed**
```bash
cd android && ./gradlew clean && ./gradlew build && cd ..
```

### Firebase Not Initializing
- Verify `google-services.json` is in `android/app/`
- Verify `GoogleService-Info.plist` is in iOS project

### Bluetooth Not Working
- Ensure Bluetooth is enabled on device
- Check permission requests in Info.plist (iOS) and AndroidManifest.xml (Android)

### Location Not Working
- Verify location services are enabled on device
- Check location permissions in app settings

## Production Build

### Android
```bash
cd android
./gradlew assembleRelease
cd ..
```

### iOS
```bash
cd ios
xcodebuild -workspace onub2bmobile.xcworkspace -scheme onub2bmobile -configuration Release
cd ..
```

## Environment Variables

Configure environment variables in `.env`:

```
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_WEBVIEW_URL=https://onub2b.com
```

## Support & Resources

- React Native Documentation: https://reactnative.dev
- Firebase Documentation: https://firebase.google.com/docs
- react-native-ble-plx: https://github.com/dotintent/react-native-ble-plx
- react-native-geolocation-service: https://github.com/Agontuk/react-native-geolocation-service
