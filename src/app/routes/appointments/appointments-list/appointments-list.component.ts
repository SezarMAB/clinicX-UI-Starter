import { Component, inject, signal, computed, effect, output } from '@angular/core';
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

  /*------------- Output Events -------------*/
  readonly appointmentSelected = output<AppointmentCardDto>();

  /*------------- State Management -------------*/
  readonly appointments = signal<AppointmentCardDto[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedAppointmentId = signal<string | null>(null);

  /*------------- Resource - fetches today's appointments -------------*/
  private readonly todayAppointmentsResource = this.appointmentsService.getTodayAppointments();

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
      this.isLoading.set(this.todayAppointmentsResource.isLoading());

      if (this.todayAppointmentsResource.error()) {
        console.error(
          "Error loading today's appointments:",
          this.todayAppointmentsResource.error()
        );
        this.error.set(this.translateService.instant('appointments.failedToLoad'));
        this.loadMockData(); // Fallback to mock data
        return;
      }

      const data = this.todayAppointmentsResource.value();
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

  /*------------- Mock Data for Development/Fallback -------------*/
  private loadMockData(): void {
    const mockAppointments: AppointmentCardDto[] = [
      {
        appointmentId: '1',
        patientId: 'patient-1',
        patientFullName: 'أحمد محمد الأحمد',
        patientPublicId: 'P-2024-001',
        startTime: '09:00:00',
        endTime: '09:30:00',
        appointmentType: 'استشارة عامة',
        practitionerTag: 'د. فاطمة الزهراء',
        patientPhoneNumber: '+971-50-123-4567',
        patientGender: 'MALE',
        isActive: true,
        hasFinancialAlert: false,
        status: AppointmentStatus.CONFIRMED,
      },
      {
        appointmentId: '2',
        patientId: 'patient-2',
        patientFullName: 'مريم خالد السعدي',
        patientPublicId: 'P-2024-002',
        startTime: '10:00:00',
        endTime: '10:30:00',
        appointmentType: 'فحص دوري',
        practitionerTag: 'د. محمد العلي',
        patientPhoneNumber: '+971-50-987-6543',
        patientGender: 'FEMALE',
        isActive: true,
        hasFinancialAlert: true,
        status: AppointmentStatus.SCHEDULED,
      },
      {
        appointmentId: '3',
        patientId: 'patient-3',
        patientFullName: 'عبدالله سعد المنصوري',
        patientPublicId: 'P-2024-003',
        startTime: '11:00:00',
        endTime: '11:45:00',
        appointmentType: 'علاج متخصص',
        practitionerTag: 'د. آمنة الشامسي',
        patientPhoneNumber: '+971-50-555-1234',
        patientGender: 'MALE',
        isActive: true,
        hasFinancialAlert: false,
        status: AppointmentStatus.COMPLETED,
      },
      {
        appointmentId: '4',
        patientId: 'patient-4',
        patientFullName: 'لطيفة راشد الكعبي',
        patientPublicId: 'P-2024-004',
        startTime: '14:00:00',
        endTime: '14:30:00',
        appointmentType: 'متابعة',
        practitionerTag: 'د. عبدالرحمن حسن',
        patientPhoneNumber: '+971-50-789-0123',
        patientGender: 'FEMALE',
        isActive: true,
        hasFinancialAlert: true,
        status: AppointmentStatus.SCHEDULED,
      },
    ];

    this.appointments.set(mockAppointments);
    this.isLoading.set(false);
  }
}
