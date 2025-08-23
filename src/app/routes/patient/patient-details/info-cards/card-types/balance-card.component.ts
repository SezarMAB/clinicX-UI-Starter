import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { BaseInfoCard } from './base-info-card';
import { BalanceData } from './card-data.interfaces';

@Component({
  selector: 'app-balance-card',
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
    <mat-card
      class="info-card clickable"
      [class.negative-balance]="isNegativeBalance()"
      (click)="handleCardClick()"
    >
      <div class="info-card-header">
        <h3 class="info-card-title mat-caption">{{ 'patients.balance' | translate }}</h3>
        <button
          matMiniFab
          class="info-card-action-btn"
          [matTooltip]="'patients.add_payment' | translate"
          (click)="handleActionClick($event)"
        >
          <mat-icon>add</mat-icon>
        </button>
      </div>
      <mat-card-content class="info-card-content">
        <ul class="info-list">
          <li class="info-list-item">
            <span class="info-label">{{ 'patients.current_balance' | translate }}:</span>
            <span class="info-value" [class.negative]="isNegativeBalance()">
              {{ balance() | currency: 'EUR' : 'symbol' : '1.2-2' }}
            </span>
          </li>
          @if (isNegativeBalance()) {
            <li class="info-list-item">
              <span class="info-label">{{ 'patients.status' | translate }}:</span>
              <span class="info-value text-warn">{{
                'patients.outstanding_balance' | translate
              }}</span>
            </li>
          }
          <li class="info-list-item">
            <span class="info-label">{{ 'patients.last_payment' | translate }}:</span>
            <span class="info-value">{{
              lastPaymentDate() || ('patients.no_payments' | translate)
            }}</span>
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
export class BalanceCardComponent extends BaseInfoCard<BalanceData> {
  private router = inject(Router);

  // Computed signals
  balance = computed(() => this.data()?.currentBalance ?? this.patient().balance);
  isNegativeBalance = computed(() => this.balance() < 0);

  // Use data input if available, fallback to mock data
  lastPaymentDate = computed(() => this.data()?.lastPaymentDate ?? '10.12.2024');

  onCardClick(): void {
    this.router.navigate(['/patients', this.patient().id, 'transactions']);
  }

  onActionClick(): void {
    this.router.navigate(['/payments', 'new'], {
      queryParams: { patientId: this.patient().id },
    });
  }
}
