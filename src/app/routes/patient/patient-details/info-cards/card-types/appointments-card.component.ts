import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { BaseInfoCard } from './base-info-card';
import { AppointmentData } from './card-data.interfaces';

@Component({
  selector: 'app-appointments-card',
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
        <h3 class="info-card-title mat-caption">{{ 'patients.appointments' | translate }}</h3>
        <button
          mat-icon-button
          class="info-card-action-btn"
          [matTooltip]="'patients.schedule_appointment' | translate"
          (click)="handleActionClick($event)"
        >
          <mat-icon>add</mat-icon>
        </button>
      </div>
      <mat-card-content class="info-card-content">
        <ul class="info-list">
          <li class="info-list-item">
            <span class="info-label">{{ 'patients.next_appointment' | translate }}:</span>
            <span class="info-value">{{
              nextAppointmentDate() || ('patients.no_appointment' | translate)
            }}</span>
          </li>
          @if (nextAppointment()) {
            <li class="info-list-item">
              <span class="info-label">{{ 'patients.time' | translate }}:</span>
              <span class="info-value">{{ nextAppointment()!.time }}</span>
            </li>
            <li class="info-list-item">
              <span class="info-label">{{ 'patients.doctor' | translate }}:</span>
              <span class="info-value">{{ nextAppointment()!.doctorName }}</span>
            </li>
          }
          <li class="info-list-item">
            <span class="info-label">{{ 'patients.total_appointments' | translate }}:</span>
            <span class="info-value">{{ totalAppointments() }}</span>
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
export class AppointmentsCardComponent extends BaseInfoCard<AppointmentData> {
  private router = inject(Router);

  // Computed values from data input or fallback to mock data
  nextAppointment = computed(
    () =>
      this.data()?.nextAppointment ?? {
        id: '1',
        date: '25.12.2024',
        time: '14:30',
        doctorName: 'د. أحمد محمد',
        doctorId: '1',
        type: 'checkup',
      }
  );

  totalAppointments = computed(() => this.data()?.totalAppointments ?? 24);

  // Computed values
  nextAppointmentDate = computed(() => this.nextAppointment()?.date);

  onCardClick(): void {
    this.router.navigate(['/patients', this.patient().id, 'appointments']);
  }

  onActionClick(): void {
    this.router.navigate(['/appointments', 'new'], {
      queryParams: { patientId: this.patient().id },
    });
  }
}
