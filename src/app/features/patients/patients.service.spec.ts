import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { PatientsService } from './patients.service';
import { API_CONFIG, ApiService } from '@core/api';
import { Page } from '@core/models';
import {
  PatientCreateRequest,
  PatientUpdateRequest,
  PatientSummaryDto,
  PatientSearchCriteria,
} from './patients.models';

describe('PatientsService', () => {
  let service: PatientsService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:8080';
  const basePath = '/api/v1/patients';

  const mockPatient: PatientSummaryDto = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    publicFacingId: 'P001',
    fullName: 'John Doe',
    dateOfBirth: '1990-01-01',
    age: 34,
    gender: 'Male',
    phoneNumber: '123-456-7890',
    email: 'john.doe@example.com',
    address: '123 Main St',
    insuranceProvider: 'BlueCross',
    insuranceNumber: 'BC123456',
    importantMedicalNotes: 'Allergic to penicillin',
    balance: 150.0,
    hasAlert: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiService,
        PatientsService,
        { provide: API_CONFIG, useValue: { baseUrl, withCredentials: true } },
      ],
    });

    service = TestBed.inject(PatientsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAllPatients', () => {
    it('should get all patients with pagination', () => {
      const mockPage: Page<PatientSummaryDto> = {
        content: [mockPatient],
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

      service.getAllPatients(undefined, { page: 0, size: 20 }).subscribe(result => {
        expect(result).toEqual(mockPage);
      });

      const req = httpMock.expectOne(`${baseUrl}${basePath}?page=0&size=20&sort=fullName`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPage);
    });

    it('should get patients with search term', () => {
      const searchTerm = 'John';
      const mockPage: Page<PatientSummaryDto> = {
        content: [mockPatient],
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

      service.getAllPatients(searchTerm).subscribe(result => {
        expect(result).toEqual(mockPage);
      });

      const req = httpMock.expectOne(
        `${baseUrl}${basePath}?searchTerm=${searchTerm}&page=0&size=20&sort=fullName`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPage);
    });
  });

  describe('createPatient', () => {
    it('should create a new patient', () => {
      const request: PatientCreateRequest = {
        fullName: 'John Doe',
        dateOfBirth: '1990-01-01',
        gender: 'Male',
        phoneNumber: '123-456-7890',
        email: 'john.doe@example.com',
      };

      service.createPatient(request).subscribe(result => {
        expect(result).toEqual(mockPatient);
      });

      const req = httpMock.expectOne(`${baseUrl}${basePath}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockPatient);
    });
  });

  describe('getPatientById', () => {
    it('should get patient by ID with string parameter', done => {
      const patientId = mockPatient.id;
      const resource = service.getPatientById(patientId);

      // Check initial state
      expect(resource.value()).toBeUndefined();
      expect(resource.isLoading()).toBe(true);
      expect(resource.error()).toBeNull();

      // Wait for the request
      setTimeout(() => {
        const req = httpMock.expectOne(`${baseUrl}${basePath}/${patientId}`);
        expect(req.request.method).toBe('GET');
        req.flush(mockPatient);

        // Check final state
        setTimeout(() => {
          expect(resource.value()).toEqual(mockPatient);
          expect(resource.isLoading()).toBe(false);
          expect(resource.error()).toBeNull();
          done();
        });
      });
    });

    it('should get patient by ID with signal parameter', done => {
      const patientId = signal(mockPatient.id);
      const resource = service.getPatientById(patientId);

      setTimeout(() => {
        const req = httpMock.expectOne(`${baseUrl}${basePath}/${patientId()}`);
        expect(req.request.method).toBe('GET');
        req.flush(mockPatient);

        setTimeout(() => {
          expect(resource.value()).toEqual(mockPatient);
          done();
        });
      });
    });
  });

  describe('updatePatient', () => {
    it('should update a patient', () => {
      const patientId = mockPatient.id;
      const request: PatientUpdateRequest = {
        fullName: 'John Doe Updated',
        dateOfBirth: '1990-01-01',
        phoneNumber: '987-654-3210',
      };

      service.updatePatient(patientId, request).subscribe(result => {
        expect(result).toEqual({ ...mockPatient, ...request });
      });

      const req = httpMock.expectOne(`${baseUrl}${basePath}/${patientId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush({ ...mockPatient, ...request });
    });
  });

  describe('deletePatient', () => {
    it('should delete a patient', () => {
      const patientId = mockPatient.id;

      service.deletePatient(patientId).subscribe(result => {
        expect(result).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}${basePath}/${patientId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });

  describe('searchPatients', () => {
    it('should search patients with criteria', () => {
      const criteria: PatientSearchCriteria = {
        searchTerm: 'John',
        gender: 'Male',
        ageFrom: 20,
        ageTo: 40,
        hasOutstandingBalance: true,
      };

      const mockPage: Page<PatientSummaryDto> = {
        content: [mockPatient],
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

      service.searchPatients(criteria).subscribe(result => {
        expect(result).toEqual(mockPage);
      });

      const req = httpMock.expectOne(`${baseUrl}${basePath}/search?page=0&size=20&sort=fullName`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(criteria);
      req.flush(mockPage);
    });
  });

  describe('getPatientTreatmentHistory', () => {
    it('should get patient treatment history', () => {
      const patientId = mockPatient.id;
      const mockPage = {
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: 20,
        numberOfElements: 0,
        first: true,
        last: true,
        empty: true,
        sort: { sorted: false, unsorted: true, empty: true },
        pageable: { page: 0, size: 20, sort: '' },
      };

      service.getPatientTreatmentHistory(patientId).subscribe(result => {
        expect(result).toEqual(mockPage);
      });

      const req = httpMock.expectOne(
        `${baseUrl}${basePath}/${patientId}/treatments?page=0&size=20&sort=treatmentDate`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPage);
    });
  });
});
