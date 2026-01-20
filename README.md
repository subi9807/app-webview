# ONUB2B Mobile App with Native Features

Expo Dev Client 기반 모바일 앱으로 Firebase FCM, Bluetooth BLE, GPS 위치 서비스 등 네이티브 기능이 통합된 WebView 앱입니다.

## 🚀 주요 기능

✅ **WebView** - https://onub2b.com 로드
✅ **Firebase Cloud Messaging** - 푸시 알림
✅ **Bluetooth Low Energy** - BLE 디바이스 스캔 및 연결
✅ **GPS 위치 서비스** - 실시간 위치 추적
✅ **WebView ↔ Native 브리지** - 양방향 통신

## 📦 설치 및 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. Firebase 설정 (필수)

#### Android

1. [Firebase Console](https://console.firebase.google.com)에서 프로젝트 생성
2. Android 앱 추가 (패키지명: `com.onub2b.mobile`)
3. `google-services.json` 다운로드
4. 프로젝트 루트에 `google-services.json` 파일 배치

#### iOS

1. Firebase Console에서 iOS 앱 추가 (Bundle ID: `com.onub2b.mobile`)
2. `GoogleService-Info.plist` 다운로드
3. 개발 빌드 후 Xcode에서 프로젝트에 추가

### 3. 개발 빌드 생성

Expo Dev Client를 사용하려면 개발 빌드를 생성해야 합니다:

```bash
# iOS 시뮬레이터용 빌드
npx expo run:ios

# Android 에뮬레이터용 빌드
npx expo run:android
```

**또는 EAS Build 사용:**

```bash
# EAS CLI 설치
npm install -g eas-cli

# EAS 로그인
eas login

# 프로젝트 설정
eas build:configure

# 개발 빌드 생성
eas build --profile development --platform ios
eas build --profile development --platform android
```

### 4. 앱 실행

```bash
# 개발 서버 시작
npm run dev

# iOS에서 실행
npm run ios

# Android에서 실행
npm run android
```

## 📱 프로젝트 구조

```
onub2b-mobile/
├── app/
│   ├── _layout.tsx          # 루트 레이아웃
│   ├── index.tsx            # 메인 WebView 화면
│   └── +not-found.tsx       # 404 페이지
├── services/
│   ├── LocationService.ts   # GPS 위치 서비스
│   ├── BLEService.ts        # Bluetooth BLE 서비스
│   ├── FirebaseService.ts   # Firebase FCM 서비스
│   └── WebViewBridge.ts     # Native-WebView 브리지
├── utils/
│   └── webview-bridge.js    # WebView JavaScript API
├── app.json                 # Expo 설정 및 플러그인
├── package.json             # 의존성
└── google-services.json     # Firebase 설정 (직접 추가)
```

## 🔌 WebView API 사용법

WebView 내에서 네이티브 기능에 접근하려면 `window.__nativebridge` 객체를 사용합니다:

### Firebase FCM Token

```javascript
// FCM 토큰 가져오기
const token = await window.__nativebridge.getFCMToken();
console.log('FCM Token:', token);
```

### GPS 위치 서비스

```javascript
// 현재 위치 한 번 가져오기
const location = await window.__nativebridge.getCurrentLocation();
console.log('현재 위치:', location);
// { latitude, longitude, accuracy, altitude, speed, heading, timestamp }

// 실시간 위치 추적 시작
await window.__nativebridge.startLocationTracking((location) => {
  console.log('위치 업데이트:', location);
});

// 위치 추적 중지
await window.__nativebridge.stopLocationTracking();

// 위치 권한 요청
const granted = await window.__nativebridge.requestLocationPermission();
```

### Bluetooth BLE

```javascript
// BLE 디바이스 스캔 시작
await window.__nativebridge.startBLEScan(['service-uuid'], (device) => {
  console.log('발견된 디바이스:', device);
  // { id, name, rssi }
});

// 스캔 중지
await window.__nativebridge.stopBLEScan();

// 디바이스 연결
await window.__nativebridge.connectBLEDevice('device-id', (data) => {
  console.log('수신된 데이터:', data);
});

// 데이터 전송
await window.__nativebridge.sendBLEData(
  'device-id',
  'service-uuid',
  'characteristic-uuid',
  'Hello BLE!'
);

// 디바이스 연결 해제
await window.__nativebridge.disconnectBLEDevice('device-id');

// Bluetooth 권한 요청
const granted = await window.__nativebridge.requestBluetoothPermission();
```

### 이벤트 리스너 사용

```javascript
// 위치 업데이트 이벤트
window.addEventListener('nativeLocationUpdate', (event) => {
  console.log('위치:', event.detail);
});

// BLE 디바이스 발견 이벤트
window.addEventListener('nativeBLEDeviceFound', (event) => {
  console.log('디바이스:', event.detail);
});

// BLE 데이터 수신 이벤트
window.addEventListener('nativeBLEDataReceived', (event) => {
  console.log('데이터:', event.detail);
});

// 브리지 준비 완료 이벤트
window.addEventListener('nativeBridgeReady', () => {
  console.log('Native bridge ready!');
});
```

## 🛠 네이티브 서비스 상세

### LocationService
- `expo-location` 사용
- 포그라운드 및 백그라운드 위치 추적
- 고정밀 GPS 모드
- iOS/Android 권한 자동 처리

### BLEService
- `react-native-ble-plx` 사용
- BLE 디바이스 스캔 및 검색
- 서비스/특성 자동 발견
- 데이터 읽기/쓰기/알림
- 연결 상태 모니터링

### FirebaseService
- `@react-native-firebase/messaging` 사용
- 푸시 알림 수신 (포그라운드/백그라운드)
- FCM 토큰 관리 및 갱신
- 알림 탭 핸들링

## 🔐 권한

### Android (AndroidManifest.xml 자동 설정)
- `ACCESS_FINE_LOCATION` - GPS
- `ACCESS_COARSE_LOCATION` - 대략적 위치
- `ACCESS_BACKGROUND_LOCATION` - 백그라운드 위치
- `BLUETOOTH_SCAN` - BLE 스캔
- `BLUETOOTH_CONNECT` - BLE 연결
- `POST_NOTIFICATIONS` - 알림

### iOS (Info.plist 자동 설정)
- Location When In Use - 앱 사용 중 위치
- Location Always - 백그라운드 위치
- Bluetooth - BLE 사용
- Background Modes - 위치, 알림, BLE

## 🔧 문제 해결

### 의존성 오류
```bash
rm -rf node_modules package-lock.json
npm install
```

### Expo 캐시 지우기
```bash
npx expo start --clear
```

### iOS Pod 설치 (macOS만 해당)
```bash
cd ios && pod install && cd ..
```

### 개발 빌드 재생성
```bash
npx expo prebuild --clean
npx expo run:ios    # 또는 run:android
```

### Firebase 초기화 오류
- `google-services.json` 파일이 프로젝트 루트에 있는지 확인
- Firebase Console에서 패키지명 일치 확인 (`com.onub2b.mobile`)
- 앱을 다시 빌드

### Bluetooth 작동 안 함
- 디바이스에서 Bluetooth 켜짐 확인
- 권한 부여 확인
- Android: 위치 권한도 필요 (BLE 스캔용)

### 위치 작동 안 함
- 디바이스에서 위치 서비스 켜짐 확인
- 앱 설정에서 위치 권한 확인
- 고정밀 모드는 GPS 신호 필요

## 📚 기술 스택

- **Expo SDK 54** - 관리형 워크플로우 + Dev Client
- **React Native 0.81** - 네이티브 플랫폼
- **Expo Router** - 파일 기반 라우팅
- **TypeScript** - 타입 안전성
- **expo-location** - GPS 위치 서비스
- **react-native-ble-plx** - Bluetooth Low Energy
- **@react-native-firebase** - Firebase FCM
- **expo-notifications** - 로컬 알림
- **react-native-webview** - WebView 컨테이너

## 🚀 배포

### iOS App Store

```bash
# 프로덕션 빌드
eas build --profile production --platform ios

# App Store에 제출
eas submit --platform ios
```

### Google Play Store

```bash
# 프로덕션 빌드
eas build --profile production --platform android

# Play Store에 제출
eas submit --platform android
```

## 📖 추가 문서

- [Expo Dev Client 문서](https://docs.expo.dev/develop/development-builds/introduction/)
- [Firebase Cloud Messaging](https://rnfirebase.io/messaging/usage)
- [expo-location](https://docs.expo.dev/versions/latest/sdk/location/)
- [react-native-ble-plx](https://github.com/dotintent/react-native-ble-plx)

## 💡 팁

1. **첫 실행 시**: 개발 빌드를 먼저 생성해야 합니다 (`expo run:ios` 또는 `expo run:android`)
2. **Firebase 필수**: google-services.json 없이는 앱이 실행되지 않습니다
3. **실제 기기 권장**: BLE와 GPS는 시뮬레이터에서 제한적입니다
4. **백그라운드 작업**: iOS는 백그라운드 위치 추적에 추가 설정 필요
5. **디버깅**: `npx expo start --dev-client` 사용

## 라이센스

Proprietary
