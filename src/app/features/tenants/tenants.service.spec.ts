import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TenantsService } from './tenants.service';
import { ApiService } from '../../core/api/api.service';
import { API_CONFIG } from '../../core/api/api.config';
import { TenantDetailDto, TenantCreateRequest } from './tenants.models';

describe('TenantsService', () => {
  let service: TenantsService;
  let httpMock: HttpTestingController;

  const mockApiConfig = {
    baseUrl: '/api',
    withCredentials: true,
    headers: { Accept: 'application/json' },
    useAuthHeader: false,
  };

  const mockTenant: TenantDetailDto = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'test-clinic',
    displayName: 'Test Clinic',
    domain: 'test.clinicx.com',
    status: 'ACTIVE',
    description: 'Test dental clinic',
    contactEmail: 'admin@testclinic.com',
    contactPhone: '+1234567890',
    address: '123 Dental St',
    maxUsers: 50,
    currentUsers: 5,
    subscriptionPlan: 'PROFESSIONAL',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    expirationDate: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TenantsService, ApiService, { provide: API_CONFIG, useValue: mockApiConfig }],
    });

    service = TestBed.inject(TenantsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create a tenant', () => {
    const createRequest: TenantCreateRequest = {
      name: 'new-clinic',
      displayName: 'New Clinic',
      contactEmail: 'admin@newclinic.com',
      maxUsers: 25,
      subscriptionPlan: 'BASIC',
      adminUser: {
        username: 'admin',
        email: 'admin@newclinic.com',
        firstName: 'Admin',
        lastName: 'User',
      },
    };

    service.createTenant(createRequest).subscribe();

    const req = httpMock.expectOne('/api/tenants');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createRequest);

    req.flush({ tenant: mockTenant, adminUser: {}, keycloakRealm: 'test' });
  });

  it('should verify httpResource for getTenantById', () => {
    const tenantId = signal('tenant-123');
    const resource = service.getTenantById(tenantId);

    expect(resource.value).toBeDefined();
    expect(resource.status).toBeDefined();
    expect(resource.error).toBeDefined();
  });
});
