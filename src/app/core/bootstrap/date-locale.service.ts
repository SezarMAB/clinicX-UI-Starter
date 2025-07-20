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
      const locale = this.settings.getLocale();
      this.dateAdapter.setLocale(locale);
    }
  }

  load() {
    // Initial locale setup
    this.updateDateAdapterLocale();
    return Promise.resolve();
  }
}
