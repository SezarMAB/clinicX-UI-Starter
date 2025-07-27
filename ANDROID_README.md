# ClickX Dental - Android Development Guide

## Prerequisites

1. **Node.js** and **Yarn** installed
2. **Android Studio** installed with:
   - Android SDK (minimum API 24)
   - Android SDK Build-Tools
   - Android Emulator (optional)
3. **Java JDK** 17 or higher

## Development Setup

### 1. Install Dependencies
```bash
yarn install
```

### 2. Build and Sync
```bash
npm run cap:sync
```

### 3. Open in Android Studio
```bash
npm run android:open
```

## Available Scripts

- `npm run cap:sync` - Build Angular app and sync with Android
- `npm run cap:copy` - Copy web assets to Android (without building)
- `npm run android:open` - Open project in Android Studio
- `npm run android:run` - Run on connected device/emulator
- `npm run android:build` - Build debug APK
- `npm run android:build:release` - Build release APK
- `npm run mobile:dev` - Start dev server for live reload

## Live Reload Development

1. Find your local IP address:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig
   ```

2. Update `capacitor.config.ts`:
   ```typescript
   server: {
     url: 'http://YOUR_IP:4200',
     cleartext: true
   }
   ```

3. Run development server:
   ```bash
   npm run mobile:dev
   ```

4. Run the app:
   ```bash
   npm run android:run
   ```

## Building for Production

### Debug Build
```bash
npm run android:build
```
Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release Build
1. Create a keystore (first time only):
   ```bash
   keytool -genkey -v -keystore clickx-dental.keystore -alias clickx -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Add signing config to `android/app/build.gradle`:
   ```gradle
   android {
     signingConfigs {
       release {
         storeFile file('path/to/clickx-dental.keystore')
         storePassword 'your-password'
         keyAlias 'clickx'
         keyPassword 'your-password'
       }
     }
     buildTypes {
       release {
         signingConfig signingConfigs.release
       }
     }
   }
   ```

3. Build release APK:
   ```bash
   npm run android:build:release
   ```

## Native Features

The app includes these Capacitor plugins:
- **Camera** - Patient photo capture
- **Filesystem** - Save/load reports and data
- **Preferences** - App settings storage
- **Network** - Online/offline detection
- **Splash Screen** - App launch screen
- **Status Bar** - Android status bar styling

## Troubleshooting

### Build Errors
1. Clean and rebuild:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npm run cap:sync
   ```

2. Check Android Studio SDK Manager for missing components

### Permission Issues
Ensure all required permissions are in `AndroidManifest.xml`:
- CAMERA
- READ_EXTERNAL_STORAGE
- WRITE_EXTERNAL_STORAGE
- INTERNET
- ACCESS_NETWORK_STATE

### Debugging
1. Use Chrome DevTools for web debugging:
   - Open Chrome
   - Navigate to `chrome://inspect`
   - Find your app under "Remote Target"

2. Use Android Studio Logcat for native logs

## Performance Tips

1. Enable ProGuard for release builds
2. Use WebP format for images
3. Implement lazy loading for large lists
4. Cache API responses using Preferences
5. Minimize bundle size with tree-shaking

## Publishing to Google Play

1. Generate signed AAB:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

2. Upload to Google Play Console
3. Fill in store listing details
4. Submit for review

## Support

For issues specific to:
- Angular/Web: Check the main README
- Capacitor: https://capacitorjs.com/docs
- Android: https://developer.android.com