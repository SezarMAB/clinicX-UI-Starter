import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ApiService } from '../../core/api/api.service';
import { API_CONFIG } from '../../core/api/api.config';
import { SecuredTenantExamplesService } from './secured-tenant-examples.service';

describe('SecuredTenantExamplesService', () => {
  let service: SecuredTenantExamplesService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SecuredTenantExamplesService,
        ApiService,
        {
          provide: API_CONFIG,
          useValue: {
            baseUrl: '/api',
            withCredentials: true,
            headers: { Accept: 'application/json' },
          },
        },
      ],
    });

    service = TestBed.inject(SecuredTenantExamplesService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTenantSettings', () => {
    it('should get tenant settings by ID', () => {
      const tenantId = signal('tenant-123');
      const mockSettings = { setting1: 'value1', setting2: 'value2' };

      const resource = service.getTenantSettings(tenantId);

      // Trigger the resource by accessing its value
      const result = resource.value();

      const req = httpTestingController.expectOne('/api/v1/secure/tenants/tenant-123/settings');
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);

      req.flush(mockSettings);
    });
  });

  describe('updateMedicalRecord', () => {
    it('should update medical record', () => {
      const recordId = 'record-123';
      const recordData = { field1: 'value1', field2: 'value2' };
      const expectedResponse = { status: 'updated', recordId };

      service.updateMedicalRecord(recordId, recordData).subscribe(response => {
        expect(response).toEqual(expectedResponse);
      });

      const req = httpTestingController.expectOne('/api/v1/secure/medical-records/record-123');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(recordData);
      expect(req.request.withCredentials).toBe(true);

      req.flush(expectedResponse);
    });
  });

  describe('performDynamicAction', () => {
    it('should perform dynamic action', () => {
      const actionRequest = { action: 'test', data: { key: 'value' } };
      const expectedResponse = { result: 'success' };

      service.performDynamicAction(actionRequest).subscribe(response => {
        expect(response).toEqual(expectedResponse);
      });

      const req = httpTestingController.expectOne('/api/v1/secure/dynamic-action');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(actionRequest);
      expect(req.request.withCredentials).toBe(true);

      req.flush(expectedResponse);
    });
  });
});
