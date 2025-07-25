import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root',
})
export class TranslateLangService {
  private readonly translate = inject(TranslateService);
  private readonly settings = inject(SettingsService);

  load() {
    return new Promise<void>(resolve => {
      const defaultLang = this.settings.getTranslateLang();

      this.translate.setDefaultLang(defaultLang);
      this.translate.use(defaultLang).subscribe({
        next: () => {
          console.log(`Successfully initialized '${defaultLang}' language.'`);
          // Set RTL direction for Arabic on initial load
          if (defaultLang === 'ar-SY') {
            this.settings.setDirection('rtl');
          } else {
            this.settings.setDirection('ltr');
          }
        },
        error: () => console.error(`Problem with '${defaultLang}' language initialization.'`),
        complete: () => resolve(),
      });
    });
  }
}
