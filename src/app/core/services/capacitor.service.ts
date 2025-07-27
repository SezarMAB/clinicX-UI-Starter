import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class CapacitorService {
  isNative = Capacitor.isNativePlatform();

  constructor() {
    if (this.isNative) {
      this.initializeApp();
    }
  }

  private async initializeApp() {
    // Hide splash screen after app loads
    await SplashScreen.hide();

    // Set status bar style
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#1976d2' });
    }
  }

  // Camera functionality for patient photos
  async takePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });

      return `data:image/jpeg;base64,${image.base64String}`;
    } catch (error) {
      console.error('Camera error:', error);
      throw error;
    }
  }

  async pickImage() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });

      return `data:image/jpeg;base64,${image.base64String}`;
    } catch (error) {
      console.error('Gallery error:', error);
      throw error;
    }
  }

  // File system operations for reports and data
  async saveFile(filename: string, data: string, directory: Directory = Directory.Documents) {
    try {
      const result = await Filesystem.writeFile({
        path: filename,
        data,
        directory,
        encoding: Encoding.UTF8,
      });
      return result.uri;
    } catch (error) {
      console.error('File save error:', error);
      throw error;
    }
  }

  async readFile(filename: string, directory: Directory = Directory.Documents) {
    try {
      const result = await Filesystem.readFile({
        path: filename,
        directory,
        encoding: Encoding.UTF8,
      });
      return result.data;
    } catch (error) {
      console.error('File read error:', error);
      throw error;
    }
  }

  // Preferences for app settings
  async setPreference(key: string, value: any) {
    await Preferences.set({
      key,
      value: JSON.stringify(value),
    });
  }

  async getPreference(key: string) {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) : null;
  }

  async removePreference(key: string) {
    await Preferences.remove({ key });
  }

  // Network status
  async getNetworkStatus() {
    return await Network.getStatus();
  }

  addNetworkListener(callback: (status: any) => void) {
    return Network.addListener('networkStatusChange', callback);
  }

  // Check if running on mobile
  isMobile(): boolean {
    return this.isNative;
  }

  getPlatform(): string {
    return Capacitor.getPlatform();
  }
}
