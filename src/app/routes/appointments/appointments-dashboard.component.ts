import { Component, inject, signal, computed, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    TranslateModule,
    AppointmentsListComponent,
    PatientDetailsComponent,
  ],
})
export class AppointmentsDashboardComponent implements OnInit {
  /*------------- DI -------------*/
  private readonly dir = inject(AppDirectionality);

  /*------------- State Management -------------*/
  readonly selectedPatientId = signal<string | null>(null);
  readonly selectedAppointment = signal<AppointmentCardDto | null>(null);
  readonly today = new Date();
  readonly appointmentCount = signal(0);
  readonly upcomingCount = signal(0);
  readonly completedCount = signal(0);

  /*------------- Resize Properties -------------*/
  readonly panelWidth = signal(314); // Default width in pixels
  private isResizing = false;
  private startX = 0;
  private startWidth = 0;
  private readonly minPanelWidth = 150; // Allow smaller width for appointments list
  private readonly maxPanelWidth = 600;

  /*------------- Layout Order -------------*/
  readonly layoutOrder = signal<'panel-first' | 'details-first'>('panel-first');

  /*------------- Computed Values -------------*/
  readonly direction = computed(() => {
    const dir = this.dir.valueSignal();
    return dir;
  });
  readonly isRtl = computed(() => {
    const isRtl = this.dir.valueSignal() === 'rtl';
    return isRtl;
  });
  readonly shouldReverseLayout = computed(() => this.layoutOrder() === 'details-first');
  readonly scrollbarDir = computed(() => (this.direction() === 'rtl' ? 'ltr' : 'rtl'));

  /*------------- Lifecycle Hooks -------------*/
  ngOnInit(): void {
    // Load saved panel width from localStorage
    const savedWidth = localStorage.getItem('appointments-panel-width');
    if (savedWidth) {
      const width = parseInt(savedWidth, 10);
      if (width >= this.minPanelWidth && width <= this.maxPanelWidth) {
        this.panelWidth.set(width);
      }
    }

    // Load saved layout order
    const savedOrder = localStorage.getItem('appointments-layout-order') as
      | 'panel-first'
      | 'details-first';
    if (savedOrder) {
      this.layoutOrder.set(savedOrder);
    }
  }

  /*------------- Event Handlers -------------*/
  onAppointmentSelected(appointment: AppointmentCardDto): void {
    this.selectedAppointment.set(appointment);
    this.selectedPatientId.set(appointment.patientId);
  }

  updateAppointmentCount(count: number): void {
    this.appointmentCount.set(count);
  }

  toggleLayout(): void {
    const newOrder = this.layoutOrder() === 'panel-first' ? 'details-first' : 'panel-first';
    this.layoutOrder.set(newOrder);
    // Save to localStorage
    localStorage.setItem('appointments-layout-order', newOrder);
  }

  startResize(event: MouseEvent | TouchEvent): void {
    event.preventDefault();
    this.isResizing = true;
    this.startX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    this.startWidth = this.panelWidth();

    // Add cursor style during resize
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  @HostListener('window:mousemove', ['$event'])
  @HostListener('window:touchmove', ['$event'])
  onMouseMove(event: MouseEvent | TouchEvent): void {
    if (!this.isResizing) return;

    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const isPanelOnRight = this.shouldReverseLayout();
    const isRtl = this.isRtl();

    let diff = clientX - this.startX;

    // Determine if we need to invert the diff based on panel position and RTL
    // Panel on left + LTR: drag right = increase (diff positive)
    // Panel on left + RTL: drag left = increase (diff negative, so invert)
    // Panel on right + LTR: drag left = increase (diff negative, so invert)
    // Panel on right + RTL: drag right = increase (diff positive)

    if ((isPanelOnRight && !isRtl) || (!isPanelOnRight && isRtl)) {
      diff = -diff;
    }

    const newWidth = this.startWidth + diff;
    if (newWidth >= this.minPanelWidth && newWidth <= this.maxPanelWidth) {
      this.panelWidth.set(newWidth);
    }
  }

  @HostListener('window:mouseup')
  @HostListener('window:touchend')
  onMouseUp(): void {
    if (this.isResizing) {
      this.isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      // Save the width to localStorage for persistence
      localStorage.setItem('appointments-panel-width', this.panelWidth().toString());
    }
  }

  getStatusIcon(status: string | undefined): string {
    if (!status) return 'help';
    switch (status) {
      case 'SCHEDULED':
        return 'event';
      case 'CONFIRMED':
        return 'event_available';
      case 'COMPLETED':
        return 'check_circle';
      case 'CANCELLED':
        return 'cancel';
      case 'NO_SHOW':
        return 'person_off';
      case 'RESCHEDULED':
        return 'update';
      default:
        return 'help';
    }
  }
}
