import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';

import { AppointmentsListComponent } from './appointments-list.component';
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

describe('AppointmentsListComponent', () => {
  let component: AppointmentsListComponent;
  let fixture: ComponentFixture<AppointmentsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentsListComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AppointmentsService, useValue: mockAppointmentsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should format time correctly', () => {
    expect(component.formatTime('09:30:00')).toBe('09:30');
    expect(component.formatTime('14:45:30')).toBe('14:45');
  });

  it('should return correct status colors', () => {
    expect(component.getStatusColor(AppointmentStatus.CONFIRMED)).toBe('var(--med-success)');
    expect(component.getStatusColor(AppointmentStatus.CANCELLED)).toBe('var(--med-error)');
    expect(component.getStatusColor(AppointmentStatus.SCHEDULED)).toBe('var(--med-info)');
  });

  it('should return correct status icons', () => {
    expect(component.getStatusIcon(AppointmentStatus.CONFIRMED)).toBe('check_circle');
    expect(component.getStatusIcon(AppointmentStatus.CANCELLED)).toBe('cancel');
    expect(component.getStatusIcon(AppointmentStatus.SCHEDULED)).toBe('schedule');
  });

  it('should return correct gender icons', () => {
    expect(component.getGenderIcon('MALE')).toBe('male');
    expect(component.getGenderIcon('FEMALE')).toBe('female');
    expect(component.getGenderIcon('OTHER')).toBe('person');
  });

  it('should emit appointment selection', () => {
    spyOn(component.appointmentSelected, 'emit');

    const mockAppointment = {
      appointmentId: '1',
      patientId: 'patient-1',
      patientFullName: 'Test Patient',
      patientPublicId: 'P-001',
      startTime: '09:00:00',
      endTime: '09:30:00',
      appointmentType: 'Consultation',
      notes: 'some notes',
      practitionerTag: 'Dr. Test',
      patientPhoneNumber: '+1234567890',
      patientGender: 'MALE',
      isActive: true,
      hasFinancialAlert: false,
      status: AppointmentStatus.CONFIRMED,
    };

    component.onAppointmentClick(mockAppointment);

    expect(component.selectedAppointmentId()).toBe('1');
    expect(component.appointmentSelected.emit).toHaveBeenCalledWith(mockAppointment);
  });

  it('should calculate appointment counts correctly', () => {
    component.appointments.set([
      {
        appointmentId: '1',
        patientId: 'patient-1',
        patientFullName: 'Test Patient 1',
        patientPublicId: 'P-001',
        startTime: '09:00:00',
        endTime: '09:30:00',
        appointmentType: 'Consultation',
        practitionerTag: 'Dr. Test',
        patientPhoneNumber: '+1234567890',
        patientGender: 'MALE',
        notes: 'some notes',
        isActive: true,
        hasFinancialAlert: false,
        status: AppointmentStatus.CONFIRMED,
      },
      {
        appointmentId: '2',
        patientId: 'patient-2',
        patientFullName: 'Test Patient 2',
        patientPublicId: 'P-002',
        startTime: '10:00:00',
        endTime: '10:30:00',
        appointmentType: 'Consultation',
        practitionerTag: 'Dr. Test',
        notes: 'some notes',
        patientPhoneNumber: '+1234567891',
        patientGender: 'FEMALE',
        isActive: true,
        hasFinancialAlert: false,
        status: AppointmentStatus.SCHEDULED,
      },
    ]);

    expect(component.appointmentCount()).toBe(2);
    expect(component.upcomingAppointments().length).toBe(2);
  });

  it('should handle loading state', () => {
    component.isLoading.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loading-container')).toBeTruthy();
  });

  it('should handle error state', () => {
    component.error.set('Test error');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error-container')).toBeTruthy();
  });
});
