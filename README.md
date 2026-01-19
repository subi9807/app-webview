# ONUB2B Mobile App

Expo 기반 모바일 앱으로 WebView를 통해 https://onub2b.com을 표시합니다.

## 빠른 시작

### 1. 의존성 설치
```bash
npm install
```

### 2. 앱 실행

**개발 서버 시작:**
```bash
npm run dev
```

**iOS 시뮬레이터:**
```bash
npm run ios
```

**Android 에뮬레이터:**
```bash
npm run android
```

**웹 브라우저:**
```bash
npm run web
```

## 프로젝트 구조

```
project/
├── app/
│   ├── _layout.tsx       # 루트 레이아웃
│   ├── index.tsx         # 메인 화면 (WebView)
│   └── +not-found.tsx    # 404 페이지
├── assets/
│   └── images/           # 앱 아이콘 및 이미지
├── app.json              # Expo 설정
├── package.json          # 의존성
└── tsconfig.json         # TypeScript 설정
```

## 주요 기능

✅ **WebView 통합**
- https://onub2b.com 로드
- JavaScript 지원
- 쿠키 공유
- 파일 업로드 지원
- 외부 URL 처리

✅ **플랫폼 지원**
- iOS
- Android
- Web

✅ **오류 처리**
- 네트워크 오류 감지
- 재시도 기능
- 로딩 상태 표시

## 기술 스택

- **Expo SDK 54**
- **React Native 0.81**
- **Expo Router** - 파일 기반 라우팅
- **React Native WebView** - 웹 콘텐츠 표시
- **TypeScript** - 타입 안전성

## 개발 도구

### TypeScript 검사
```bash
npm run typecheck
```

### 의존성 관리
```bash
npm install [패키지명]
```

## Expo 빌드

### iOS 빌드
```bash
npx eas build --platform ios
```

### Android 빌드
```bash
npx eas build --platform android
```

## 문제 해결

### 의존성 오류
```bash
rm -rf node_modules package-lock.json
npm install
```

### Expo 캐시 지우기
```bash
npx expo start --clear
```

### iOS Pod 업데이트 (베어 워크플로우용)
```bash
cd ios && pod install && cd ..
```

## 설정

### App.json
- 앱 이름, 번들 ID, 아이콘 등 설정
- `app.json` 파일에서 수정

### 환경 변수
- `.env` 파일에 환경 변수 추가

## 추가 기능 (향후 추가 예정)

이 앱은 기본 WebView 기능을 제공합니다. 다음 기능을 추가할 수 있습니다:

1. **푸시 알림** - Expo Notifications
2. **위치 서비스** - expo-location
3. **카메라** - expo-camera
4. **저장소** - AsyncStorage
5. **네이티브 API 통합**

이러한 기능을 추가하려면 Expo의 관리형 워크플로우 또는 개발 빌드가 필요합니다.

## 라이센스

Proprietary

## 지원

문제가 발생하면 다음을 확인하세요:
- [Expo 문서](https://docs.expo.dev/)
- [React Native 문서](https://reactnative.dev/)
- [React Native WebView](https://github.com/react-native-webview/react-native-webview)
