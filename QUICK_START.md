# Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Firebase (Required)

**For Android:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a project or use existing
3. Add Android app with package name: `com.onub2bmobile`
4. Download `google-services.json`
5. Place in `android/app/google-services.json`

**For iOS:**
1. Add iOS app with bundle ID: `com.onub2bmobile`
2. Download `GoogleService-Info.plist`
3. Add to Xcode project: `ios/onub2bmobile/`

### 3. Setup iOS (Mac only)
```bash
cd ios
pod install
cd ..
```

### 4. Run the App

**iOS:**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```

## Project Structure

```
src/
├── App.tsx                 ← Main app
├── screens/
│   └── WebViewScreen.tsx   ← WebView UI (displays onub2b.com)
├── services/
│   ├── firebase/           ← Push notifications
│   ├── ble/               ← Bluetooth
│   ├── location/          ← GPS
│   ├── permissions/       ← Permission management
│   └── bridge/            ← Native-WebView bridge
└── utils/
    ├── webview-bridge.js   ← JavaScript API for WebView
    ├── logger.ts           ← Logging
    └── errors.ts           ← Error handling
```

## WebView API Usage

Add this to your onub2b.com web code:

### Get FCM Token
```javascript
const token = await window.__nativebridge.getFCMToken();
console.log('FCM Token:', token);
```

### Location Tracking
```javascript
// One-time location
const loc = await window.__nativebridge.getCurrentLocation();
console.log(loc); // { latitude, longitude, accuracy, ... }

// Continuous tracking
await window.__nativebridge.startLocationTracking((loc) => {
  console.log('Location update:', loc);
});

// Stop tracking
await window.__nativebridge.stopLocationTracking();
```

### Bluetooth Control
```javascript
// Scan for devices
await window.__nativebridge.startBLEScan(['uuid'], (device) => {
  console.log('Found:', device);
});

// Connect
await window.__nativebridge.connectBLEDevice('device-id');

// Send data
await window.__nativebridge.sendBLEData(
  'device-id',
  'service-uuid',
  'characteristic-uuid',
  'hello'
);

// Listen for data
window.__onBLEDataReceived = (data) => {
  console.log('Received:', data);
};

// Disconnect
await window.__nativebridge.disconnectBLEDevice('device-id');
await window.__nativebridge.stopBLEScan();
```

## Key Features

✅ WebView loads https://onub2b.com
✅ Firebase Cloud Messaging (push notifications)
✅ Bluetooth Low Energy support
✅ GPS location services
✅ Two-way native ↔ WebView communication
✅ Automatic permission handling
✅ Error handling & logging

## Common Issues

### "google-services.json not found"
- Place `google-services.json` in `android/app/`
- Run: `cd android && ./gradlew clean && cd ..`

### "Pod installation failed"
- Run: `cd ios && rm -rf Pods && pod install && cd ..`

### "Bridge not defined in WebView"
- Wait for page to fully load
- Check browser console for errors

## Documentation

- **[README.md](./README.md)** - Complete documentation
- **[SETUP.md](./SETUP.md)** - Detailed setup guide
- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - WebView integration examples

## Next Steps

1. Configure Firebase (see Setup.md)
2. Test on iOS or Android
3. Access WebView bridge from onub2b.com code
4. Deploy when ready

## Support

- Check logs: `npm run typecheck`
- Android debug: USB debug mode on device
- iOS debug: Xcode debugger
- Web debug: Safari DevTools (iOS) or Chrome DevTools (Android)
