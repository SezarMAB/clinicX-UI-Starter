import { Injectable, inject } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root',
})
export class DateLocaleService {
  private readonly settings = inject(SettingsService);
  private readonly dateAdapter = inject(DateAdapter, { optional: true });

  constructor() {
    // Subscribe to language changes and update date adapter locale
    this.settings.notify.subscribe(() => {
      this.updateDateAdapterLocale();
    });
  }

  updateDateAdapterLocale() {
    if (this.dateAdapter) {
      // Check if it's DateFnsAdapter (expects Locale object) or NativeDateAdapter (expects string)
      const adapterName = this.dateAdapter.constructor.name;

      if (adapterName.includes('DateFns')) {
        // DateFnsAdapter expects a date-fns Locale object
        const locale = this.settings.getLocale();
        this.dateAdapter.setLocale(locale);
      } else {
        // NativeDateAdapter expects a locale string
        const localeString = this.settings.getTranslateLang() || 'en-US';
        this.dateAdapter.setLocale(localeString);
      }
    }
  }

  load() {
    // Initial locale setup
    this.updateDateAdapterLocale();
    return Promise.resolve();
  }
}
