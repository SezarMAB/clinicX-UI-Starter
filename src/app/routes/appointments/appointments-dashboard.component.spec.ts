import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';

import { AppointmentsDashboardComponent } from './appointments-dashboard.component';
import { AppointmentsService } from '@features/appointments/appointments.service';
import { AppointmentStatus } from '@features/appointments/appointments.models';

// Mock appointments service
const mockAppointmentsService = {
  getTodayAppointments: () => ({
    isLoading: signal(false),
    error: signal(null),
    value: signal([
      {
        appointmentId: '1',
        patientId: 'patient-1',
        patientFullName: 'Test Patient',
        patientPublicId: 'P-001',
        startTime: '09:00:00',
        endTime: '09:30:00',
        appointmentType: 'Consultation',
        practitionerTag: 'Dr. Test',
        patientPhoneNumber: '+1234567890',
        patientGender: 'MALE',
        isActive: true,
        hasFinancialAlert: false,
        status: AppointmentStatus.CONFIRMED,
      },
    ]),
  }),
};

describe('AppointmentsDashboardComponent', () => {
  let component: AppointmentsDashboardComponent;
  let fixture: ComponentFixture<AppointmentsDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentsDashboardComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AppointmentsService, useValue: mockAppointmentsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with sidenav open', () => {
    expect(component.sidenavOpen()).toBe(true);
  });

  it('should toggle sidenav state', () => {
    const initialState = component.sidenavOpen();
    component.onToggleSidenav();
    expect(component.sidenavOpen()).toBe(!initialState);
  });

  it('should close sidenav', () => {
    component.onCloseSidenav();
    expect(component.sidenavOpen()).toBe(false);
  });

  it('should handle appointment selection', () => {
    const mockAppointment = {
      appointmentId: '1',
      patientId: 'patient-1',
      patientFullName: 'Test Patient',
      patientPublicId: 'P-001',
      startTime: '09:00:00',
      endTime: '09:30:00',
      appointmentType: 'Consultation',
      practitionerTag: 'Dr. Test',
      patientPhoneNumber: '+1234567890',
      patientGender: 'MALE',
      isActive: true,
      hasFinancialAlert: false,
      status: AppointmentStatus.CONFIRMED,
    };

    component.onAppointmentSelected(mockAppointment);

    expect(component.selectedAppointment()).toEqual(mockAppointment);
    expect(component.selectedPatientId()).toBe('patient-1');
  });

  it('should render sidenav container', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('mat-sidenav-container')).toBeTruthy();
  });

  it('should render appointments list component', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-appointments-list')).toBeTruthy();
  });
});
