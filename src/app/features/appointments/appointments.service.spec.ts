import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { AppointmentsService } from './appointments.service';
import { API_CONFIG, ApiService } from '@core/api';
import { Page } from '@core/models';
import {
  AppointmentCardDto,
  AppointmentCreateRequest,
  AppointmentStatus,
  UpcomingAppointmentDto,
} from './appointments.models';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:8080';
  const basePath = '/api/v1/appointments';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiService,
        AppointmentsService,
        { provide: API_CONFIG, useValue: { baseUrl, withCredentials: true } },
      ],
    });

    service = TestBed.inject(AppointmentsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('createAppointment', () => {
    it('should create a new appointment', () => {
      const request: AppointmentCreateRequest = {
        specialtyId: '550e8400-e29b-41d4-a716-446655440000',
        patientId: '550e8400-e29b-41d4-a716-446655440001',
        appointmentDatetime: '2024-07-15T10:30:00Z',
        durationMinutes: 30,
        status: AppointmentStatus.SCHEDULED,
      };

      const mockResponse: AppointmentCardDto = {
        appointmentId: '550e8400-e29b-41d4-a716-446655440002',
        patientId: request.patientId,
        patientFullName: 'John Doe',
        patientPublicId: 'P001',
        startTime: '10:30',
        endTime: '11:00',
        appointmentType: 'Checkup',
        practitionerTag: 'Dr. Smith',
        patientPhoneNumber: '123-456-7890',
        patientGender: 'Male',
        isActive: true,
        hasFinancialAlert: false,
        status: AppointmentStatus.SCHEDULED,
      };

      service.createAppointment(request).subscribe(result => {
        expect(result).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}${basePath}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockResponse);
    });
  });

  describe('getAppointmentById', () => {
    it('should get appointment by ID with string parameter', done => {
      const appointmentId = '550e8400-e29b-41d4-a716-446655440002';
      const mockResponse: AppointmentCardDto = {
        appointmentId,
        patientId: '550e8400-e29b-41d4-a716-446655440001',
        patientFullName: 'John Doe',
        patientPublicId: 'P001',
        startTime: '10:30',
        endTime: '11:00',
        appointmentType: 'Checkup',
        practitionerTag: 'Dr. Smith',
        patientPhoneNumber: '123-456-7890',
        patientGender: 'Male',
        isActive: true,
        hasFinancialAlert: false,
        status: AppointmentStatus.SCHEDULED,
      };

      const resource = service.getAppointmentById(appointmentId);

      // Check initial state
      expect(resource.value()).toBeUndefined();
      expect(resource.isLoading()).toBe(true);
      expect(resource.error()).toBeNull();

      // Wait for the request to be made
      setTimeout(() => {
        const req = httpMock.expectOne(`${baseUrl}${basePath}/${appointmentId}`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);

        // Check final state
        setTimeout(() => {
          expect(resource.value()).toEqual(mockResponse);
          expect(resource.isLoading()).toBe(false);
          expect(resource.error()).toBeNull();
          done();
        });
      });
    });

    it('should get appointment by ID with signal parameter', done => {
      const appointmentId = signal('550e8400-e29b-41d4-a716-446655440002');
      const mockResponse: AppointmentCardDto = {
        appointmentId: appointmentId(),
        patientId: '550e8400-e29b-41d4-a716-446655440001',
        patientFullName: 'John Doe',
        patientPublicId: 'P001',
        startTime: '10:30',
        endTime: '11:00',
        appointmentType: 'Checkup',
        practitionerTag: 'Dr. Smith',
        patientPhoneNumber: '123-456-7890',
        patientGender: 'Male',
        isActive: true,
        hasFinancialAlert: false,
        status: AppointmentStatus.SCHEDULED,
      };

      const resource = service.getAppointmentById(appointmentId);

      setTimeout(() => {
        const req = httpMock.expectOne(`${baseUrl}${basePath}/${appointmentId()}`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);

        setTimeout(() => {
          expect(resource.value()).toEqual(mockResponse);
          done();
        });
      });
    });
  });

  describe('getPatientAppointments', () => {
    it('should get patient appointments with pagination', () => {
      const patientId = '550e8400-e29b-41d4-a716-446655440001';
      const mockPage: Page<AppointmentCardDto> = {
        content: [
          {
            appointmentId: '550e8400-e29b-41d4-a716-446655440002',
            patientId,
            patientFullName: 'John Doe',
            patientPublicId: 'P001',
            startTime: '10:30',
            endTime: '11:00',
            appointmentType: 'Checkup',
            practitionerTag: 'Dr. Smith',
            patientPhoneNumber: '123-456-7890',
            patientGender: 'Male',
            isActive: true,
            hasFinancialAlert: false,
            status: AppointmentStatus.SCHEDULED,
          },
        ],
        totalElements: 1,
        totalPages: 1,
        number: 0,
        size: 20,
        numberOfElements: 1,
        first: true,
        last: true,
        empty: false,
        sort: { sorted: false, unsorted: true, empty: true },
        pageable: { page: 0, size: 20, sort: '' },
      };

      service.getPatientAppointments(patientId, { page: 0, size: 20 }).subscribe(result => {
        expect(result).toEqual(mockPage);
      });

      const req = httpMock.expectOne(
        `${baseUrl}${basePath}/patient/${patientId}?page=0&size=20&sort=appointmentDateTime`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPage);
    });
  });

  describe('getUpcomingAppointmentsForPatient', () => {
    it('should get upcoming appointments for patient', () => {
      const patientId = '550e8400-e29b-41d4-a716-446655440001';
      const mockAppointments: UpcomingAppointmentDto[] = [
        {
          appointmentId: '550e8400-e29b-41d4-a716-446655440002',
          appointmentDateTime: '2024-07-15T10:30:00Z',
          specialty: 'General Dentistry',
          treatmentType: 'Checkup',
          doctorName: 'Dr. Smith',
          status: AppointmentStatus.SCHEDULED,
          durationMinutes: 30,
        },
      ];

      service.getUpcomingAppointmentsForPatient(patientId).subscribe(result => {
        expect(result).toEqual(mockAppointments);
      });

      const req = httpMock.expectOne(`${baseUrl}${basePath}/patient/${patientId}/upcoming`);
      expect(req.request.method).toBe('GET');
      req.flush(mockAppointments);
    });
  });

  describe('getAppointmentsForDate', () => {
    it('should get appointments for specific date', () => {
      const date = '2024-07-15';
      const mockAppointments: AppointmentCardDto[] = [
        {
          appointmentId: '550e8400-e29b-41d4-a716-446655440002',
          patientId: '550e8400-e29b-41d4-a716-446655440001',
          patientFullName: 'John Doe',
          patientPublicId: 'P001',
          startTime: '10:30',
          endTime: '11:00',
          appointmentType: 'Checkup',
          practitionerTag: 'Dr. Smith',
          patientPhoneNumber: '123-456-7890',
          patientGender: 'Male',
          isActive: true,
          hasFinancialAlert: false,
          status: AppointmentStatus.SCHEDULED,
        },
      ];

      service.getAppointmentsForDate(date).subscribe(result => {
        expect(result).toEqual(mockAppointments);
      });

      const req = httpMock.expectOne(`${baseUrl}${basePath}/date/${date}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockAppointments);
    });
  });

  describe('getAppointmentsByDateRange', () => {
    it('should get appointments by date range', () => {
      const startDateTime = '2024-07-15T00:00:00Z';
      const endDateTime = '2024-07-15T23:59:59Z';
      const mockAppointments: AppointmentCardDto[] = [
        {
          appointmentId: '550e8400-e29b-41d4-a716-446655440002',
          patientId: '550e8400-e29b-41d4-a716-446655440001',
          patientFullName: 'John Doe',
          patientPublicId: 'P001',
          startTime: '10:30',
          endTime: '11:00',
          appointmentType: 'Checkup',
          practitionerTag: 'Dr. Smith',
          patientPhoneNumber: '123-456-7890',
          patientGender: 'Male',
          isActive: true,
          hasFinancialAlert: false,
          status: AppointmentStatus.SCHEDULED,
        },
      ];

      service.getAppointmentsByDateRange(startDateTime, endDateTime).subscribe(result => {
        expect(result).toEqual(mockAppointments);
      });

      const req = httpMock.expectOne(
        `${baseUrl}${basePath}/date-range?startDateTime=${encodeURIComponent(startDateTime)}&endDateTime=${encodeURIComponent(endDateTime)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockAppointments);
    });
  });
});
