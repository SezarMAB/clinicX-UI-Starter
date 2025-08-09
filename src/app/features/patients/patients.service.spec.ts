import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { PatientsService } from './patients.service';
import { ApiService } from '../../core/api/api.service';
import { API_CONFIG } from '../../core/api/api.config';
import {
  PatientSummaryDto,
  PatientCreateRequest,
  PatientUpdateRequest,
  PagePatientSummaryDto,
} from './patients.models';

describe('PatientsService', () => {
  let service: PatientsService;
  let httpMock: HttpTestingController;

  const mockApiConfig = {
    baseUrl: '/api',
    withCredentials: true,
    headers: { Accept: 'application/json' },
    useAuthHeader: false,
  };

  const mockPatient: PatientSummaryDto = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    publicFacingId: 'P-001',
    fullName: 'John Doe',
    dateOfBirth: '1980-01-15',
    age: 43,
    gender: 'MALE',
    phoneNumber: '+1234567890',
    email: 'john.doe@email.com',
    address: '123 Main St, City, State',
    insuranceProvider: 'Health Insurance Co',
    insuranceNumber: 'INS-123456',
    importantMedicalNotes: 'Allergic to penicillin',
    balance: 150.0,
    hasAlert: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PatientsService, ApiService, { provide: API_CONFIG, useValue: mockApiConfig }],
    });

    service = TestBed.inject(PatientsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('POST/PUT/DELETE operations', () => {
    it('should create a patient', () => {
      const createRequest: PatientCreateRequest = {
        fullName: 'Jane Smith',
        dateOfBirth: '1985-05-20',
        gender: 'FEMALE',
        phoneNumber: '+1987654321',
        email: 'jane.smith@email.com',
      };

      service.createPatient(createRequest).subscribe(patient => {
        expect(patient).toEqual(mockPatient);
      });

      const req = httpMock.expectOne('/api/patients');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      expect(req.request.withCredentials).toBe(true);

      req.flush(mockPatient);
    });

    it('should update a patient', () => {
      const patientId = 'patient-123';
      const updateRequest: PatientUpdateRequest = {
        fullName: 'John Updated Doe',
        dateOfBirth: '1980-01-15',
        phoneNumber: '+1111111111',
      };

      service.updatePatient(patientId, updateRequest).subscribe(patient => {
        expect(patient).toEqual(mockPatient);
      });

      const req = httpMock.expectOne(`/api/patients/${patientId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateRequest);

      req.flush(mockPatient);
    });

    it('should delete a patient', () => {
      const patientId = 'patient-123';

      service.deletePatient(patientId).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpMock.expectOne(`/api/patients/${patientId}`);
      expect(req.request.method).toBe('DELETE');

      req.flush(null);
    });
  });

  describe('httpResource operations', () => {
    it('should verify httpResource configuration for getPatientById', () => {
      const patientId = signal('patient-123');

      const resource = service.getPatientById(patientId);

      expect(resource.value).toBeDefined();
      expect(resource.status).toBeDefined();
      expect(resource.error).toBeDefined();

      // Test signal reactivity
      patientId.set('different-patient-id');
      expect(resource.value).toBeDefined();
    });

    it('should verify httpResource configuration for getAllPatients', () => {
      const pageRequest = signal({ page: 0, size: 20 });
      const searchTerm = signal('john');

      const resource = service.getAllPatients(pageRequest, searchTerm);

      expect(resource.value).toBeDefined();
      expect(resource.status).toBeDefined();
      expect(resource.error).toBeDefined();

      // Test signal reactivity
      pageRequest.set({ page: 1, size: 10 });
      expect(resource.value).toBeDefined();
    });
  });
});
