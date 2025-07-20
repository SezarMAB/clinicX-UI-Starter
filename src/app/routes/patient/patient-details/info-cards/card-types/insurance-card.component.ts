import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { BaseInfoCard } from './base-info-card';
import { InsuranceData } from './card-data.interfaces';

@Component({
  selector: 'app-insurance-card',
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
        <h3 class="info-card-title mat-caption">{{ 'patients.insurance' | translate }}</h3>
        <button
          mat-icon-button
          class="info-card-action-btn"
          [matTooltip]="'patients.update_insurance' | translate"
          (click)="handleActionClick($event)"
        >
          <mat-icon>edit</mat-icon>
        </button>
      </div>
      <mat-card-content class="info-card-content">
        <ul class="info-list">
          @if (hasInsurance()) {
            <li class="info-list-item">
              <span class="info-label">{{ 'patients.provider' | translate }}:</span>
              <span class="info-value">{{ insuranceData()!.providerName }}</span>
            </li>
            <li class="info-list-item">
              <span class="info-label">{{ 'patients.policy_number' | translate }}:</span>
              <span class="info-value">{{ insuranceData()!.policyNumber }}</span>
            </li>
            <li class="info-list-item">
              <span class="info-label">{{ 'patients.coverage' | translate }}:</span>
              <span class="info-value">{{ insuranceData()!.coveragePercentage }}%</span>
            </li>
            <li class="info-list-item">
              <span class="info-label">{{ 'patients.valid_until' | translate }}:</span>
              <span class="info-value" [class.text-warn]="isExpiringSoon()">
                {{ insuranceData()!.validUntil }}
              </span>
            </li>
          } @else {
            <li class="info-list-item">
              <span class="info-label">{{ 'patients.insurance' | translate }}:</span>
              <span class="info-value">{{ 'patients.no_insurance' | translate }}</span>
            </li>
          }
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
export class InsuranceCardComponent extends BaseInfoCard<InsuranceData> {
  private router = inject(Router);

  // Computed values
  insuranceData = computed(() => this.data() ?? null);
  hasInsurance = computed(() => !!this.insuranceData());

  isExpiringSoon = computed(() => {
    const data = this.insuranceData();
    if (!data) return false;

    const validUntilDate = new Date(data.validUntil);
    const today = new Date();
    const monthFromNow = new Date();
    monthFromNow.setMonth(monthFromNow.getMonth() + 1);

    return validUntilDate <= monthFromNow && validUntilDate >= today;
  });

  onCardClick(): void {
    this.router.navigate(['/patients', this.patient().id, 'insurance']);
  }

  onActionClick(): void {
    this.router.navigate(['/patients', this.patient().id, 'insurance', 'edit']);
  }
}
