import { Component, inject, signal, computed, effect, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AppointmentsService } from '@features/appointments/appointments.service';
import { AppointmentCardDto, AppointmentStatus } from '@features/appointments/appointments.models';
import { AppDirectionality } from '@shared/services/directionality.service';

@Component({
  selector: 'app-appointments-list',
  templateUrl: './appointments-list.component.html',
  styleUrl: './appointments-list.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatCardModule,
    MatIconModule,
    MatBadgeModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTooltipModule,
    TranslateModule,
  ],
})
export class AppointmentsListComponent {
  /*------------- DI -------------*/
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly translateService = inject(TranslateService);
  readonly dir = inject(AppDirectionality);

  /*------------- Input Properties -------------*/
  readonly selectedDate = input<Date>(new Date());

  /*------------- Output Events -------------*/
  readonly appointmentSelected = output<AppointmentCardDto>();

  /*------------- State Management -------------*/
  readonly appointments = signal<AppointmentCardDto[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedAppointmentId = signal<string | null>(null);

  // date in YYYY-MM-DD format - computed from input
  private readonly forDate = computed(() => this.formatDateToYYYYMMDD(this.selectedDate()));

  /*------------- Resource - fetches appointments for selected date -------------*/
  private readonly appointmentsResource = this.appointmentsService.getAppointmentsForDate(
    this.forDate
  );

  /*------------- Computed Properties -------------*/
  readonly appointmentCount = computed(() => this.appointments().length);
  readonly activeAppointments = computed(() => this.appointments().filter(apt => apt.isActive));
  readonly upcomingAppointments = computed(() =>
    this.appointments().filter(
      apt =>
        apt.status === AppointmentStatus.SCHEDULED || apt.status === AppointmentStatus.CONFIRMED
    )
  );

  constructor() {
    // Effect to handle resource state changes
    effect(() => {
      this.isLoading.set(this.appointmentsResource.isLoading());

      if (this.appointmentsResource.error()) {
        console.error('Error loading appointments:', this.appointmentsResource.error());
        this.error.set(this.translateService.instant('appointments.failedToLoad'));
        return;
      }

      const data = this.appointmentsResource.value();
      if (data) {
        this.appointments.set(data);
        this.error.set(null);
      }
    });
  }

  /*------------- Event Handlers -------------*/
  onAppointmentClick(appointment: AppointmentCardDto): void {
    this.selectedAppointmentId.set(appointment.appointmentId);
    this.appointmentSelected.emit(appointment);
  }

  onRetryLoad(): void {
    // Force refresh the resource
    window.location.reload(); // Simple retry mechanism
  }

  /*------------- Utility Methods -------------*/
  getStatusColor(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return 'var(--med-success)';
      case AppointmentStatus.SCHEDULED:
        return 'var(--med-info)';
      case AppointmentStatus.COMPLETED:
        return 'var(--med-secondary)';
      case AppointmentStatus.CANCELLED:
        return 'var(--med-error)';
      case AppointmentStatus.NO_SHOW:
        return 'var(--med-warning)';
      case AppointmentStatus.RESCHEDULED:
        return 'var(--med-caution)';
      default:
        return 'var(--med-neutral)';
    }
  }

  getStatusIcon(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.CONFIRMED:
        return 'check_circle';
      case AppointmentStatus.SCHEDULED:
        return 'schedule';
      case AppointmentStatus.COMPLETED:
        return 'task_alt';
      case AppointmentStatus.CANCELLED:
        return 'cancel';
      case AppointmentStatus.NO_SHOW:
        return 'person_off';
      case AppointmentStatus.RESCHEDULED:
        return 'update';
      default:
        return 'help';
    }
  }

  getGenderIcon(gender: string): string {
    switch (gender?.toUpperCase()) {
      case 'MALE':
        return 'male';
      case 'FEMALE':
        return 'female';
      default:
        return 'person';
    }
  }

  formatTime(time: string): string {
    // Convert HH:mm:ss to HH:mm format
    return time?.substring(0, 5) || '';
  }

  private formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
