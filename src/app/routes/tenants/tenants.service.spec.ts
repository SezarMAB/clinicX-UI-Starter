import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TenantsService } from '@features/tenants/tenants.service';
import { ApiService } from '@core/api/api.service';
import {
  TenantCreateRequest,
  TenantUpdateRequest,
  TenantCreationResponseDto,
  TenantDetailDto,
} from '@features/tenants/tenants.models';

describe('TenantsService Mutations', () => {
  let service: TenantsService;
  let httpMock: HttpTestingController;

  const mockTenantDetail: TenantDetailDto = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'test-tenant',
    displayName: 'Test Tenant Inc.',
    domain: 'test.example.com',
    status: 'ACTIVE',
    description: 'Test description',
    contactEmail: 'contact@test.com',
    contactPhone: '+1234567890',
    address: '123 Test St',
    maxUsers: 100,
    currentUsers: 10,
    subscriptionPlan: 'PROFESSIONAL',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    expirationDate: null,
  };

  const mockCreationResponse: TenantCreationResponseDto = {
    tenant: mockTenantDetail,
    adminUser: {
      userId: 'admin-123',
      username: 'admin',
      email: 'admin@test.com',
      temporaryPassword: 'TempPass123!',
    },
    keycloakRealm: 'test-tenant',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService, TenantsService],
    });

    service = TestBed.inject(TenantsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('createTenant', () => {
    it('should create a new tenant successfully', done => {
      const createRequest: TenantCreateRequest = {
        name: 'test-tenant',
        displayName: 'Test Tenant Inc.',
        domain: 'test.example.com',
        description: 'Test description',
        contactEmail: 'contact@test.com',
        contactPhone: '+1234567890',
        address: '123 Test St',
        maxUsers: 100,
        subscriptionPlan: 'PROFESSIONAL',
        adminUser: {
          username: 'admin',
          email: 'admin@test.com',
          firstName: 'Admin',
          lastName: 'User',
          temporaryPassword: true,
        },
      };

      service.createTenant(createRequest).subscribe({
        next: response => {
          expect(response).toEqual(mockCreationResponse);
          expect(response.tenant.name).toBe('test-tenant');
          expect(response.adminUser.temporaryPassword).toBeTruthy();
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne('/api/v1/tenants');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush(mockCreationResponse);
    });

    it('should handle creation error', done => {
      const createRequest: TenantCreateRequest = {
        name: 'invalid',
        displayName: 'Test',
        contactEmail: 'test@test.com',
        maxUsers: 10,
        subscriptionPlan: 'FREE',
        adminUser: {
          username: 'admin',
          email: 'admin@test.com',
          firstName: 'Admin',
          lastName: 'User',
        },
      };

      service.createTenant(createRequest).subscribe({
        next: () => done.fail('Should have failed'),
        error: error => {
          expect(error.status).toBe(400);
          expect(error.error.message).toBe('Subdomain already exists');
          done();
        },
      });

      const req = httpMock.expectOne('/api/v1/tenants');
      req.flush(
        { message: 'Subdomain already exists' },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });

  describe('updateTenant', () => {
    it('should update tenant successfully', done => {
      const updateRequest: TenantUpdateRequest = {
        displayName: 'Updated Tenant Name',
        contactEmail: 'newemail@test.com',
        maxUsers: 200,
      };

      const updatedTenant = { ...mockTenantDetail, ...updateRequest };

      service.updateTenant('123', updateRequest).subscribe({
        next: response => {
          expect(response.displayName).toBe('Updated Tenant Name');
          expect(response.contactEmail).toBe('newemail@test.com');
          expect(response.maxUsers).toBe(200);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne('/api/v1/tenants/123');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateRequest);
      req.flush(updatedTenant);
    });

    it('should handle update error for non-existent tenant', done => {
      const updateRequest: TenantUpdateRequest = {
        displayName: 'Updated Name',
      };

      service.updateTenant('nonexistent', updateRequest).subscribe({
        next: () => done.fail('Should have failed'),
        error: error => {
          expect(error.status).toBe(404);
          done();
        },
      });

      const req = httpMock.expectOne('/api/v1/tenants/nonexistent');
      req.flush(null, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('deleteTenant', () => {
    it('should delete tenant successfully', done => {
      service.deleteTenant('123').subscribe({
        next: () => {
          expect(true).toBe(true);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne('/api/v1/tenants/123');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should handle delete error for protected tenant', done => {
      service.deleteTenant('protected').subscribe({
        next: () => done.fail('Should have failed'),
        error: error => {
          expect(error.status).toBe(403);
          expect(error.error.message).toContain('cannot be deleted');
          done();
        },
      });

      const req = httpMock.expectOne('/api/v1/tenants/protected');
      req.flush(
        { message: 'This tenant cannot be deleted' },
        { status: 403, statusText: 'Forbidden' }
      );
    });
  });

  describe('activateTenant', () => {
    it('should activate tenant successfully', done => {
      service.activateTenant('123').subscribe({
        next: () => {
          expect(true).toBe(true);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne('/api/v1/tenants/123/activate');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(null);
    });

    it('should handle activation of already active tenant', done => {
      service.activateTenant('already-active').subscribe({
        next: () => done.fail('Should have failed'),
        error: error => {
          expect(error.status).toBe(409);
          expect(error.error.message).toBe('Tenant is already active');
          done();
        },
      });

      const req = httpMock.expectOne('/api/v1/tenants/already-active/activate');
      req.flush({ message: 'Tenant is already active' }, { status: 409, statusText: 'Conflict' });
    });
  });

  describe('deactivateTenant', () => {
    it('should deactivate tenant successfully', done => {
      service.deactivateTenant('123').subscribe({
        next: () => {
          expect(true).toBe(true);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne('/api/v1/tenants/123/deactivate');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(null);
    });

    it('should handle deactivation with active users', done => {
      service.deactivateTenant('has-users').subscribe({
        next: () => done.fail('Should have failed'),
        error: error => {
          expect(error.status).toBe(400);
          expect(error.error.message).toContain('active users');
          done();
        },
      });

      const req = httpMock.expectOne('/api/v1/tenants/has-users/deactivate');
      req.flush(
        { message: 'Cannot deactivate tenant with active users' },
        { status: 400, statusText: 'Bad Request' }
      );
    });
  });
});
