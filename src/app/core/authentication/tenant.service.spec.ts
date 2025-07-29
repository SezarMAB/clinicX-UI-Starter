import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { TenantService, TenantInfo } from './tenant.service';
import { TokenService } from './token.service';

describe('TenantService', () => {
  let service: TenantService;
  let tokenServiceMock: jasmine.SpyObj<TokenService>;
  let documentMock: any;

  beforeEach(() => {
    // Create mocks
    tokenServiceMock = jasmine.createSpyObj('TokenService', ['getBearerToken', 'change']);
    tokenServiceMock.change.and.returnValue(of(undefined));
    tokenServiceMock.getBearerToken.and.returnValue('');

    documentMock = {
      location: {
        hostname: 'localhost',
      },
    };

    TestBed.configureTestingModule({
      providers: [
        TenantService,
        { provide: TokenService, useValue: tokenServiceMock },
        { provide: DOCUMENT, useValue: documentMock },
      ],
    });

    service = TestBed.inject(TenantService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Subdomain Extraction', () => {
    it('should extract tenant info from subdomain', () => {
      documentMock.location.hostname = 'dental-clinic.clickx.com';

      // Recreate service to trigger initialization with new hostname
      service = TestBed.inject(TenantService);

      expect(service.tenantId()).toBe('dental-clinic');
      expect(service.clinicName()).toBe('Dental Clinic');
      expect(service.subdomain()).toBe('dental-clinic');
    });

    it('should return null for non-subdomain hostnames', () => {
      documentMock.location.hostname = 'clickx.com';

      service = TestBed.inject(TenantService);

      expect(service.currentTenant()).toBeNull();
    });

    it('should skip common subdomains', () => {
      const skipSubdomains = ['www', 'app', 'api', 'admin'];

      skipSubdomains.forEach(subdomain => {
        documentMock.location.hostname = `${subdomain}.clickx.com`;
        service = TestBed.inject(TenantService);

        expect(service.currentTenant()).toBeNull();
      });
    });
  });

  describe('JWT Token Parsing', () => {
    it('should extract tenant info from JWT token', () => {
      const mockPayload = {
        tenant_id: 'clinic-123',
        clinic_name: 'Test Clinic',
        clinic_type: 'dental',
        exp: 1234567890,
      };

      const encodedPayload = btoa(JSON.stringify(mockPayload));
      const mockJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${encodedPayload}.signature`;

      tokenServiceMock.getBearerToken.and.returnValue(`Bearer ${mockJwt}`);

      // Trigger token update
      service = TestBed.inject(TenantService);

      expect(service.tenantId()).toBe('clinic-123');
      expect(service.clinicName()).toBe('Test Clinic');
      expect(service.clinicType()).toBe('dental');
    });

    it('should handle invalid JWT format gracefully', () => {
      tokenServiceMock.getBearerToken.and.returnValue('Bearer invalid-jwt');

      service = TestBed.inject(TenantService);

      expect(service.hasValidTenant()).toBeFalse();
    });

    it('should handle missing tenant info in JWT', () => {
      const mockPayload = {
        sub: 'user-123',
        exp: 1234567890,
      };

      const encodedPayload = btoa(JSON.stringify(mockPayload));
      const mockJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${encodedPayload}.signature`;

      tokenServiceMock.getBearerToken.and.returnValue(`Bearer ${mockJwt}`);

      service = TestBed.inject(TenantService);

      // Should keep subdomain info if no tenant info in token
      expect(service.currentTenant()).toBeNull();
    });
  });

  describe('Manual Tenant Management', () => {
    it('should allow manual setting of tenant', () => {
      const tenantInfo: TenantInfo = {
        tenant_id: 'manual-tenant',
        clinic_name: 'Manual Clinic',
        clinic_type: 'general',
        subdomain: 'manual',
      };

      service.setTenant(tenantInfo);

      expect(service.currentTenant()).toEqual(tenantInfo);
      expect(service.hasValidTenant()).toBeTrue();
    });

    it('should clear tenant information', () => {
      const tenantInfo: TenantInfo = {
        tenant_id: 'test-tenant',
        clinic_name: 'Test Clinic',
        clinic_type: 'dental',
        subdomain: 'test',
      };

      service.setTenant(tenantInfo);
      expect(service.hasValidTenant()).toBeTrue();

      service.clearTenant();

      expect(service.currentTenant()).toBeNull();
      expect(service.hasValidTenant()).toBeFalse();
    });
  });

  describe('Tenant API URL', () => {
    beforeEach(() => {
      const tenantInfo: TenantInfo = {
        tenant_id: 'clinic-123',
        clinic_name: 'Test Clinic',
        clinic_type: 'dental',
        subdomain: 'clinic-123',
      };
      service.setTenant(tenantInfo);
    });

    it('should generate tenant-specific API URLs', () => {
      const path = '/api/v1/patients';
      const tenantUrl = service.getTenantApiUrl(path);

      expect(tenantUrl).toBe('/tenants/clinic-123/api/v1/patients');
    });

    it('should not modify URLs that already contain tenant info', () => {
      const path1 = '/tenants/clinic-123/api/v1/patients';
      const path2 = '/api/v1/clinic-123/settings';

      expect(service.getTenantApiUrl(path1)).toBe(path1);
      expect(service.getTenantApiUrl(path2)).toBe(path2);
    });

    it('should return original path if no tenant is set', () => {
      service.clearTenant();
      const path = '/api/v1/patients';

      expect(service.getTenantApiUrl(path)).toBe(path);
    });
  });

  describe('Access Control', () => {
    it('should check tenant access correctly', () => {
      const tenantInfo: TenantInfo = {
        tenant_id: 'clinic-123',
        clinic_name: 'Test Clinic',
        clinic_type: 'dental',
        subdomain: 'clinic-123',
      };
      service.setTenant(tenantInfo);

      expect(service.hasAccessToTenant('clinic-123')).toBeTrue();
      expect(service.hasAccessToTenant('other-clinic')).toBeFalse();
    });

    it('should return false if no tenant is set', () => {
      service.clearTenant();

      expect(service.hasAccessToTenant('any-clinic')).toBeFalse();
    });
  });

  describe('Computed Signals', () => {
    it('should provide reactive access to tenant properties', () => {
      const tenantInfo: TenantInfo = {
        tenant_id: 'signal-test',
        clinic_name: 'Signal Test Clinic',
        clinic_type: 'orthodontic',
        subdomain: 'signal-test',
      };

      // Initial state
      expect(service.tenantId()).toBeNull();
      expect(service.clinicName()).toBeNull();
      expect(service.clinicType()).toBeNull();
      expect(service.subdomain()).toBeNull();
      expect(service.hasValidTenant()).toBeFalse();

      // After setting tenant
      service.setTenant(tenantInfo);

      expect(service.tenantId()).toBe('signal-test');
      expect(service.clinicName()).toBe('Signal Test Clinic');
      expect(service.clinicType()).toBe('orthodontic');
      expect(service.subdomain()).toBe('signal-test');
      expect(service.hasValidTenant()).toBeTrue();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', () => {
      // Test with malformed JWT
      tokenServiceMock.getBearerToken.and.returnValue('Bearer malformed.jwt');

      service = TestBed.inject(TenantService);

      expect(service.tenantError()).toBeTruthy();
    });
  });

  describe('toString', () => {
    it('should return formatted tenant string', () => {
      const tenantInfo: TenantInfo = {
        tenant_id: 'clinic-999',
        clinic_name: 'ToString Test Clinic',
        clinic_type: 'pediatric',
        subdomain: 'tostring-test',
      };

      service.setTenant(tenantInfo);

      expect(service.toString()).toBe(
        'Tenant: ToString Test Clinic (ID: clinic-999, Type: pediatric)'
      );
    });

    it('should return no tenant message when tenant is not set', () => {
      service.clearTenant();

      expect(service.toString()).toBe('No tenant context');
    });
  });
});
