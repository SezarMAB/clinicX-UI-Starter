import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';

import { AppointmentsListComponent } from './appointments-list/appointments-list.component';
import { PatientDetailsComponent } from '../patient/patient-details/patient-details.component';
import { AppointmentCardDto } from '@features/appointments/appointments.models';
import { AppDirectionality } from '@shared/services/directionality.service';

@Component({
  selector: 'app-appointments-dashboard',
  templateUrl: './appointments-dashboard.component.html',
  styleUrl: './appointments-dashboard.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule,
    TranslateModule,
    AppointmentsListComponent,
    PatientDetailsComponent,
  ],
})
export class AppointmentsDashboardComponent {
  /*------------- DI -------------*/
  private readonly dir = inject(AppDirectionality);

  /*------------- State Management -------------*/
  readonly selectedPatientId = signal<string | null>(null);
  readonly selectedAppointment = signal<AppointmentCardDto | null>(null);
  readonly sidenavOpen = signal(true);
  readonly today = new Date();
  readonly appointmentCount = signal(0);

  /*------------- Computed Values -------------*/
  readonly direction = computed(() => {
    const dir = this.dir.valueSignal();
    console.log('Current direction:', dir);
    return dir;
  });
  readonly isRtl = computed(() => {
    const isRtl = this.dir.valueSignal() === 'rtl';
    console.log('Is RTL:', isRtl);
    return isRtl;
  });
  // For RTL: sidebar on right (end), For LTR: sidebar on left (start)
  readonly position = computed(() => {
    const pos = this.isRtl() ? 'end' : 'start';
    console.log('Sidenav position:', pos);
    return pos;
  });

  /*------------- Event Handlers -------------*/
  onAppointmentSelected(appointment: AppointmentCardDto): void {
    this.selectedAppointment.set(appointment);
    this.selectedPatientId.set(appointment.patientId);
  }

  updateAppointmentCount(count: number): void {
    this.appointmentCount.set(count);
  }

  onToggleSidenav(): void {
    this.sidenavOpen.update(v => !v);
  }

  onCloseSidenav(): void {
    this.sidenavOpen.set(false);
  }
}
