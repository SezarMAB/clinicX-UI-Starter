// import { Component, inject } from '@angular/core';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatTooltipModule } from '@angular/material/tooltip';
// import { SettingsService } from '@core';
//
// @Component({
//   selector: 'app-theme-toggle',
//   standalone: true,
//   template: `
//     <button mat-icon-button
//             [matTooltip]="isDarkTheme() ? 'Switch to light theme' : 'Switch to dark theme'"
//             (click)="toggleTheme()">
//       <mat-icon>{{ isDarkTheme() ? 'light_mode' : 'dark_mode' }}</mat-icon>
//     </button>
//   `,
//   imports: [MatButtonModule, MatIconModule, MatTooltipModule],
// })
// export class ThemeToggleComponent {
//   private settings = inject(SettingsService);
//
//   isDarkTheme() {
//     const currentTheme = this.settings.options.theme;
//     if (currentTheme === 'auto') {
//       return window.matchMedia('(prefers-color-scheme: dark)').matches;
//     }
//     return currentTheme === 'dark';
//   }
//
//   toggleTheme() {
//     const currentTheme = this.settings.options.theme;
//     const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
//     this.settings.setOptions({ theme: newTheme });
//   }
// }
