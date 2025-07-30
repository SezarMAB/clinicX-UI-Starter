import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';

import { PatientRegistrationComponent } from './patient-registration.component';
import { PatientsService } from '@features/patients/patients.service';
import { PatientCreateRequest, PatientSummaryDto } from '@features/patients/patients.models';

describe('PatientRegistrationComponent', () => {
  let component: PatientRegistrationComponent;
  let fixture: ComponentFixture<PatientRegistrationComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockPatientsService: jasmine.SpyObj<PatientsService>;
  let mockToastr: jasmine.SpyObj<ToastrService>;

  const mockPatientResponse: PatientSummaryDto = {
    id: '123',
    publicFacingId: 'P123',
    fullName: 'John Doe',
    dateOfBirth: '1990-01-01',
    age: 33,
    balance: 0,
    hasAlert: false,
  };

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockPatientsService = jasmine.createSpyObj('PatientsService', ['createPatient']);
    mockToastr = jasmine.createSpyObj('ToastrService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [
        PatientRegistrationComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatIconModule,
        MatProgressSpinnerModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: PatientsService, useValue: mockPatientsService },
        { provide: ToastrService, useValue: mockToastr },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PatientRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.registrationForm.get('fullName')?.value).toBe('');
    expect(component.registrationForm.get('dateOfBirth')?.value).toBe('');
    expect(component.registrationForm.get('gender')?.value).toBe('');
    expect(component.registrationForm.get('phoneNumber')?.value).toBe('');
    expect(component.registrationForm.get('email')?.value).toBe('');
    expect(component.registrationForm.get('address')?.value).toBe('');
    expect(component.registrationForm.get('insuranceProvider')?.value).toBe('');
    expect(component.registrationForm.get('insuranceNumber')?.value).toBe('');
    expect(component.registrationForm.get('importantMedicalNotes')?.value).toBe('');
  });

  it('should mark form as invalid when required fields are empty', () => {
    expect(component.registrationForm.invalid).toBeTruthy();
  });

  it('should mark form as valid when required fields are filled', () => {
    component.registrationForm.patchValue({
      fullName: 'John Doe',
      dateOfBirth: new Date('1990-01-01'),
    });
    expect(component.registrationForm.valid).toBeTruthy();
  });

  it('should validate email format', () => {
    const emailControl = component.registrationForm.get('email');

    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBeTruthy();

    emailControl?.setValue('valid@email.com');
    expect(emailControl?.hasError('email')).toBeFalsy();
  });

  it('should validate phone number format', () => {
    const phoneControl = component.registrationForm.get('phoneNumber');

    phoneControl?.setValue('invalid-phone!@#');
    expect(phoneControl?.hasError('pattern')).toBeTruthy();

    phoneControl?.setValue('+1 (555) 123-4567');
    expect(phoneControl?.hasError('pattern')).toBeFalsy();
  });

  it('should validate max length constraints', () => {
    const fullNameControl = component.registrationForm.get('fullName');

    fullNameControl?.setValue('a'.repeat(151));
    expect(fullNameControl?.hasError('maxlength')).toBeTruthy();

    fullNameControl?.setValue('a'.repeat(150));
    expect(fullNameControl?.hasError('maxlength')).toBeFalsy();
  });

  it('should not submit form when invalid', () => {
    component.onSubmit();
    expect(mockPatientsService.createPatient).not.toHaveBeenCalled();
  });

  it('should submit form when valid', () => {
    mockPatientsService.createPatient.and.returnValue(of(mockPatientResponse));

    component.registrationForm.patchValue({
      fullName: 'John Doe',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'Male',
      phoneNumber: '+1 (555) 123-4567',
      email: 'john@example.com',
    });

    component.onSubmit();

    expect(mockPatientsService.createPatient).toHaveBeenCalledWith({
      fullName: 'John Doe',
      dateOfBirth: '1990-01-01',
      gender: 'Male',
      phoneNumber: '+1 (555) 123-4567',
      email: 'john@example.com',
      address: undefined,
      insuranceProvider: undefined,
      insuranceNumber: undefined,
      importantMedicalNotes: undefined,
    } as PatientCreateRequest);
  });

  it('should show success message and navigate on successful registration', () => {
    mockPatientsService.createPatient.and.returnValue(of(mockPatientResponse));

    component.registrationForm.patchValue({
      fullName: 'John Doe',
      dateOfBirth: new Date('1990-01-01'),
    });

    component.onSubmit();

    expect(mockToastr.success).toHaveBeenCalledWith('Patient registered successfully', 'Success');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/patient', '123']);
    expect(component.loading()).toBeFalsy();
  });

  it('should show error message on registration failure', () => {
    const errorResponse = {
      error: { message: 'Registration failed' },
    };
    mockPatientsService.createPatient.and.returnValue(throwError(() => errorResponse));

    component.registrationForm.patchValue({
      fullName: 'John Doe',
      dateOfBirth: new Date('1990-01-01'),
    });

    component.onSubmit();

    expect(mockToastr.error).toHaveBeenCalledWith('Registration failed', 'Error');
    expect(component.loading()).toBeFalsy();
  });

  it('should navigate back on cancel', () => {
    component.onCancel();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/patient']);
  });

  it('should return appropriate error messages', () => {
    const fullNameControl = component.registrationForm.get('fullName');
    fullNameControl?.setErrors({ required: true });
    fullNameControl?.markAsTouched();

    expect(component.getErrorMessage('fullName')).toBe('Full name is required');

    fullNameControl?.setErrors({ maxlength: { requiredLength: 150 } });
    expect(component.getErrorMessage('fullName')).toBe('Maximum 150 characters allowed');

    const emailControl = component.registrationForm.get('email');
    emailControl?.setErrors({ email: true });
    emailControl?.markAsTouched();

    expect(component.getErrorMessage('email')).toBe('Please enter a valid email address');
  });

  it('should format date correctly', () => {
    const date = new Date('2023-05-15');
    const formatted = component.formatDate(date);
    expect(formatted).toBe('2023-05-15');
  });

  it('should set loading state during submission', () => {
    mockPatientsService.createPatient.and.returnValue(of(mockPatientResponse));

    component.registrationForm.patchValue({
      fullName: 'John Doe',
      dateOfBirth: new Date('1990-01-01'),
    });

    expect(component.loading()).toBeFalsy();

    component.onSubmit();

    // Loading should be set to false after successful submission
    expect(component.loading()).toBeFalsy();
  });
});
