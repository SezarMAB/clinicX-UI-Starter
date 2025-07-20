import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { BaseInfoCard } from './base-info-card';

interface TreatmentStats {
  total: number;
  lastVisit: string | null;
  active: number;
  completed: number;
}

@Component({
  selector: 'app-treatments-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TranslateModule,
  ],
  template: `
    <mat-card class="info-card clickable" (click)="handleCardClick()">
      <div class="info-card-header">
        <h3 class="info-card-title mat-caption">{{ 'patients.treatments' | translate }}</h3>
        <button
          mat-icon-button
          class="info-card-action-btn"
          [matTooltip]="'patients.add_treatment' | translate"
          (click)="handleActionClick($event)"
        >
          <mat-icon>add</mat-icon>
        </button>
      </div>
      <mat-card-content class="info-card-content">
        <ul class="info-list">
          <li class="info-list-item">
            <span class="info-label">{{ 'patients.total_treatments' | translate }}:</span>
            <span class="info-value">{{ treatmentStats().total }}</span>
          </li>
          <li class="info-list-item">
            <span class="info-label">{{ 'patients.last_visit' | translate }}:</span>
            <span class="info-value">{{ treatmentStats().lastVisit || 'N/A' }}</span>
          </li>
          <li class="info-list-item">
            <span class="info-label">{{ 'patients.active_treatments' | translate }}:</span>
            <span class="info-value">{{ treatmentStats().active }}</span>
          </li>
          <li class="info-list-item">
            <span class="info-label">{{ 'patients.completed' | translate }}:</span>
            <span class="info-value">{{ treatmentStats().completed }}</span>
          </li>
        </ul>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      @import '../info-cards.component.scss';

      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class TreatmentsCardComponent extends BaseInfoCard {
  private router = inject(Router);

  // Signal for treatment statistics
  treatmentStats = signal<TreatmentStats>({
    total: 12,
    lastVisit: '15.11.2024',
    active: 3,
    completed: 9,
  });

  onCardClick(): void {
    this.router.navigate(['/patients', this.patient().id, 'treatments']);
  }

  onActionClick(): void {
    this.router.navigate(['/treatments', 'new'], {
      queryParams: { patientId: this.patient().id },
    });
  }
}
