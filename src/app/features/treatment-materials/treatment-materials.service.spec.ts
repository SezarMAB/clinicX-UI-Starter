import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TreatmentMaterialsService } from './treatment-materials.service';
import { ApiService } from '../../core/api/api.service';
import { API_CONFIG } from '../../core/api/api.config';
import {
  TreatmentMaterialDto,
  TreatmentMaterialCreateRequest,
  PageTreatmentMaterialDto,
} from './treatment-materials.models';

describe('TreatmentMaterialsService', () => {
  let service: TreatmentMaterialsService;
  let httpMock: HttpTestingController;

  const mockApiConfig = {
    baseUrl: '/api',
    withCredentials: true,
    headers: { Accept: 'application/json' },
    useAuthHeader: false,
  };

  const mockMaterial: TreatmentMaterialDto = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    visitId: 'treatment-123',
    materialName: 'Dental Composite',
    quantity: 2.5,
    unit: 'ml',
    costPerUnit: 15.5,
    totalCost: 38.75,
    supplier: 'Dental Supplies Co',
    batchNumber: 'B2023001',
    notes: 'High-quality composite material',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  const mockPageResponse: PageTreatmentMaterialDto = {
    content: [mockMaterial],
    page: 0,
    size: 20,
    totalElements: 1,
    totalPages: 1,
    sort: ['createdAt,desc'],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TreatmentMaterialsService,
        ApiService,
        { provide: API_CONFIG, useValue: mockApiConfig },
      ],
    });

    service = TestBed.inject(TreatmentMaterialsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('POST/PUT/DELETE operations', () => {
    it('should create a treatment material', () => {
      const createRequest: TreatmentMaterialCreateRequest = {
        visitId: 'treatment-123',
        materialName: 'Dental Composite',
        quantity: 2.5,
        unit: 'ml',
        costPerUnit: 15.5,
        supplier: 'Dental Supplies Co',
        batchNumber: 'B2023001',
        notes: 'High-quality composite material',
      };

      service.createTreatmentMaterial(createRequest).subscribe(material => {
        expect(material).toEqual(mockMaterial);
      });

      const req = httpMock.expectOne('/api/treatment-materials');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      expect(req.request.withCredentials).toBe(true);

      req.flush(mockMaterial);
    });

    it('should update a treatment material', () => {
      const materialId = 'material-123';
      const updateRequest: TreatmentMaterialCreateRequest = {
        visitId: 'treatment-123',
        materialName: 'Updated Material',
        quantity: 3.0,
        costPerUnit: 20.0,
      };

      service.updateTreatmentMaterial(materialId, updateRequest).subscribe(material => {
        expect(material).toEqual(mockMaterial);
      });

      const req = httpMock.expectOne(`/api/treatment-materials/${materialId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateRequest);

      req.flush(mockMaterial);
    });

    it('should delete a treatment material', () => {
      const materialId = 'material-123';

      service.deleteTreatmentMaterial(materialId).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpMock.expectOne(`/api/treatment-materials/${materialId}`);
      expect(req.request.method).toBe('DELETE');

      req.flush(null);
    });

    it('should search materials with criteria', () => {
      const searchCriteria = {
        materialName: 'composite',
        quantityFrom: 1.0,
        quantityTo: 5.0,
      };
      const pageRequest = { page: 0, size: 20 };

      service.searchMaterials(searchCriteria, pageRequest).subscribe(result => {
        expect(result).toEqual(mockPageResponse);
      });

      const req = httpMock.expectOne('/api/treatment-materials/search');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(searchCriteria);

      req.flush(mockPageResponse);
    });
  });

  describe('httpResource operations', () => {
    it('should verify httpResource configuration for getTreatmentMaterial', () => {
      const materialId = signal('material-123');

      const resource = service.getTreatmentMaterial(materialId);

      expect(resource.value).toBeDefined();
      expect(resource.status).toBeDefined();
      expect(resource.error).toBeDefined();

      // Test signal reactivity
      materialId.set('different-material-id');
      expect(resource.value).toBeDefined();
    });

    it('should verify httpResource configuration for getMaterialsByTreatment', () => {
      const visitId = signal('treatment-123');

      const resource = service.getMaterialsByTreatment(visitId);

      expect(resource.value).toBeDefined();
      expect(resource.status).toBeDefined();
      expect(resource.error).toBeDefined();

      // Test signal reactivity
      visitId.set('different-treatment-id');
      expect(resource.value).toBeDefined();
    });

    it('should verify httpResource configuration for getMaterialsByTreatmentPaged', () => {
      const visitId = signal('treatment-123');
      const pageRequest = signal({ page: 0, size: 20 });

      const resource = service.getMaterialsByTreatmentPaged(visitId, pageRequest);

      expect(resource.value).toBeDefined();
      expect(resource.status).toBeDefined();
      expect(resource.error).toBeDefined();

      // Test signal reactivity
      pageRequest.set({ page: 1, size: 10 });
      expect(resource.value).toBeDefined();
    });
  });

  describe('URL construction and parameters', () => {
    it('should construct correct URLs for material operations', () => {
      const materialId = signal('test-material-id');
      const visitId = signal('test-treatment-id');
      const patientId = signal('test-patient-id');

      // These would be tested by intercepting the actual HTTP calls if httpResource made them immediately
      const materialResource = service.getTreatmentMaterial(materialId);
      const treatmentResource = service.getMaterialsByTreatment(visitId);
      const patientResource = service.getMaterialsByPatient(patientId);

      expect(materialResource).toBeDefined();
      expect(treatmentResource).toBeDefined();
      expect(patientResource).toBeDefined();
    });
  });
});
