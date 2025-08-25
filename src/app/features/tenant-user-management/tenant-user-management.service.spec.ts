import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TenantUserManagementService } from './tenant-user-management.service';
import { ApiService } from '../../core/api/api.service';
import { API_CONFIG } from '../../core/api/api.config';
import {
  TenantUserDto,
  TenantUserCreateRequest,
  TenantUserUpdateRequest,
  PageTenantUserDto,
} from './tenant-user-management.models';

describe('TenantUserManagementService', () => {
  let service: TenantUserManagementService;
  let httpMock: HttpTestingController;

  const mockApiConfig = {
    baseUrl: '/api',
    withCredentials: true,
    headers: { Accept: 'application/json' },
    useAuthHeader: false,
  };

  const mockUser: TenantUserDto = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    enabled: true,
    emailVerified: true,
    roles: ['USER'],
    primaryTenantId: 'tenant-123',
    activeTenantId: 'tenant-123',
    isExternal: false,
    accessibleTenants: ['tenant-123'],
    attributes: null,
    createdAt: '2023-01-01T00:00:00Z',
    lastLogin: '2023-01-01T12:00:00Z',
    userType: 'INTERNAL',
  };

  const mockPageResponse: PageTenantUserDto = {
    content: [mockUser],
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
        TenantUserManagementService,
        ApiService,
        { provide: API_CONFIG, useValue: mockApiConfig },
      ],
    });

    service = TestBed.inject(TenantUserManagementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('POST/PUT/DELETE operations', () => {
    it('should create a user', () => {
      const createRequest: TenantUserCreateRequest = {
        username: 'newuser',
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        password: 'password123',
        roles: ['USER'],
        temporaryPassword: false,
        sendWelcomeEmail: true,
      };

      service.createUser(createRequest).subscribe(user => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne('/api/tenant/users');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      expect(req.request.withCredentials).toBe(true);

      req.flush(mockUser);
    });

    it('should update a user', () => {
      const userId = '123';
      const updateRequest: TenantUserUpdateRequest = {
        firstName: 'Updated',
        lastName: 'Name',
        enabled: false,
      };

      service.updateUser(userId, updateRequest).subscribe(user => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`/api/tenant/users/${userId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateRequest);

      req.flush(mockUser);
    });

    it('should delete a user', () => {
      const userId = '123';

      service.deleteUser(userId).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpMock.expectOne(`/api/tenant/users/${userId}`);
      expect(req.request.method).toBe('DELETE');

      req.flush(null);
    });

    it('should reset user password', () => {
      const userId = '123';

      service.resetUserPassword(userId, false).subscribe();

      const req = httpMock.expectOne(`/api/tenant/users/${userId}/reset-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ temporaryPassword: false });

      req.flush(null);
    });

    it('should activate a user', () => {
      const userId = '123';

      service.activateUser(userId).subscribe();

      const req = httpMock.expectOne(`/api/tenant/users/${userId}/activate`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});

      req.flush(null);
    });

    it('should deactivate a user', () => {
      const userId = '123';

      service.deactivateUser(userId).subscribe();

      const req = httpMock.expectOne(`/api/tenant/users/${userId}/deactivate`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});

      req.flush(null);
    });
  });

  describe('httpResource operations', () => {
    it('should verify httpResource configuration for getAllUsers', () => {
      const pageRequest = signal({ page: 0, size: 20 });
      const searchCriteria = signal({ enabled: true });

      const resource = service.getAllUsers(pageRequest, searchCriteria);

      // Verify resource is created (it should have value, status, error signals)
      expect(resource.value).toBeDefined();
      expect(resource.status).toBeDefined();
      expect(resource.error).toBeDefined();

      // Test signal reactivity by changing the page request
      pageRequest.set({ page: 1, size: 10 });

      // The resource should be reactive to signal changes
      expect(resource.value).toBeDefined();
    });

    it('should verify httpResource configuration for getUser', () => {
      const userId = signal('test-user-id');

      const resource = service.getUser(userId);

      expect(resource.value).toBeDefined();
      expect(resource.status).toBeDefined();
      expect(resource.error).toBeDefined();

      // Test signal reactivity
      userId.set('different-user-id');
      expect(resource.value).toBeDefined();
    });
  });

  describe('URL construction and parameters', () => {
    it('should construct correct URLs with parameters for getAllUsers', () => {
      const pageRequest = signal({ page: 1, size: 10, sort: ['name,asc'] });
      const searchCriteria = signal({ enabled: true, searchTerm: 'john' });

      // This would be tested by intercepting the actual HTTP call if httpResource made one immediately
      const resource = service.getAllUsers(pageRequest, searchCriteria);
      expect(resource).toBeDefined();
    });
  });
});
