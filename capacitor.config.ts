import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.clickx.dental',
  appName: 'ClickX Dental',
  webDir: 'dist/starter/browser',
  server: {
    androidScheme: 'https',
    // Enable this for development with live reload
    // url: 'http://192.168.1.x:4200',
    // cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
    webContentsDebuggingEnabled: true,
    // Minimum Android version supported
    minSdkVersion: 24,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: '#ffffffff',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerStyle: 'large',
      spinnerColor: '#999999',
    },
  },
};

export default config;
