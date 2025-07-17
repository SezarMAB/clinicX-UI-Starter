import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { TreatmentsService } from './treatments.service';
import { API_CONFIG, ApiService } from '@core/api';
import { Page } from '@core/models';
import {
  TreatmentCreateRequest,
  TreatmentLogDto,
  TreatmentSearchCriteria,
  TreatmentStatus,
} from './treatments.models';

describe('TreatmentsService', () => {
  let service: TreatmentsService;
  let httpMock: HttpTestingController;
  const baseUrl = 'http://localhost:8080';
  const basePath = '/api/v1/treatments';

  const mockTreatment: TreatmentLogDto = {
    treatmentId: '550e8400-e29b-41d4-a716-446655440000',
    treatmentDate: '2024-07-15',
    treatmentTime: '10:30',
    visitType: 'Regular',
    toothNumber: 11,
    treatmentName: 'Root Canal',
    doctorName: 'Dr. Smith',
    durationMinutes: 60,
    cost: 500,
    status: TreatmentStatus.COMPLETED,
    notes: 'Successful treatment',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApiService,
        TreatmentsService,
        { provide: API_CONFIG, useValue: { baseUrl, withCredentials: true } },
      ],
    });

    service = TestBed.inject(TreatmentsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('createTreatment', () => {
    it('should create a new treatment', () => {
      const patientId = '550e8400-e29b-41d4-a716-446655440001';
      const request: TreatmentCreateRequest = {
        treatmentDate: '2024-07-15',
        treatmentTime: '10:30',
        toothNumber: 11,
        procedureId: '550e8400-e29b-41d4-a716-446655440002',
        cost: 500,
        status: TreatmentStatus.SCHEDULED,
        doctorId: '550e8400-e29b-41d4-a716-446655440003',
      };

      service.createTreatment(patientId, request).subscribe(result => {
        expect(result).toEqual(mockTreatment);
      });

      const req = httpMock.expectOne(`${baseUrl}${basePath}?patientId=${patientId}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockTreatment);
    });
  });

  describe('getTreatmentById', () => {
    it('should get treatment by ID with string parameter', done => {
      const treatmentId = mockTreatment.treatmentId;
      const resource = service.getTreatmentById(treatmentId);

      setTimeout(() => {
        const req = httpMock.expectOne(`${baseUrl}${basePath}/${treatmentId}`);
        expect(req.request.method).toBe('GET');
        req.flush(mockTreatment);

        setTimeout(() => {
          expect(resource.value()).toEqual(mockTreatment);
          expect(resource.isLoading()).toBe(false);
          expect(resource.error()).toBeNull();
          done();
        });
      });
    });
  });

  describe('updateTreatment', () => {
    it('should update a treatment', () => {
      const treatmentId = mockTreatment.treatmentId;
      const request: TreatmentCreateRequest = {
        treatmentDate: '2024-07-15',
        treatmentTime: '10:30',
        toothNumber: 11,
        procedureId: '550e8400-e29b-41d4-a716-446655440002',
        cost: 600,
        status: TreatmentStatus.COMPLETED,
        doctorId: '550e8400-e29b-41d4-a716-446655440003',
        treatmentNotes: 'Updated notes',
      };

      service.updateTreatment(treatmentId, request).subscribe(result => {
        expect(result).toEqual({ ...mockTreatment, cost: 600 });
      });

      const req = httpMock.expectOne(`${baseUrl}${basePath}/${treatmentId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush({ ...mockTreatment, cost: 600 });
    });
  });

  describe('deleteTreatment', () => {
    it('should delete a treatment', () => {
      const treatmentId = mockTreatment.treatmentId;

      service.deleteTreatment(treatmentId).subscribe(result => {
        expect(result).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}${basePath}/${treatmentId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });

  describe('getPatientTreatmentHistory', () => {
    it('should get patient treatment history', () => {
      const patientId = '550e8400-e29b-41d4-a716-446655440001';
      const mockPage: Page<TreatmentLogDto> = {
        content: [mockTreatment],
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

      service.getPatientTreatmentHistory(patientId).subscribe(result => {
        expect(result).toEqual(mockPage);
      });

      const req = httpMock.expectOne(
        `${baseUrl}${basePath}/patient/${patientId}?page=0&size=20&sort=treatmentDate`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPage);
    });
  });

  describe('searchTreatments', () => {
    it('should search treatments with criteria', () => {
      const criteria: TreatmentSearchCriteria = {
        patientId: '550e8400-e29b-41d4-a716-446655440001',
        statuses: [TreatmentStatus.COMPLETED],
        treatmentDateFrom: '2024-01-01',
        treatmentDateTo: '2024-12-31',
        costFrom: 100,
        costTo: 1000,
      };

      const mockPage: Page<TreatmentLogDto> = {
        content: [mockTreatment],
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

      service.searchTreatments(criteria).subscribe(result => {
        expect(result).toEqual(mockPage);
      });

      const req = httpMock.expectOne(
        `${baseUrl}${basePath}/search?page=0&size=20&sort=treatmentDate`
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(criteria);
      req.flush(mockPage);
    });
  });
});
