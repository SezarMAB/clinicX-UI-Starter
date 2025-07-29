import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { KeycloakAuthService } from './keycloak-auth.service';
import { KeycloakConfigService } from './keycloak-config.service';
import { TokenService } from './token.service';
import { KeycloakTokenResponse } from './interface';

describe('KeycloakAuthService', () => {
  let service: KeycloakAuthService;
  let httpMock: HttpTestingController;
  let keycloakConfigService: jasmine.SpyObj<KeycloakConfigService>;
  let tokenService: jasmine.SpyObj<TokenService>;
  let router: jasmine.SpyObj<Router>;

  const mockTokenResponse: KeycloakTokenResponse = {
    'access_token': 'mock-access-token',
    'refresh_token': 'mock-refresh-token',
    'expires_in': 300,
    'refresh_expires_in': 1800,
    'token_type': 'Bearer',
    'id_token': 'mock-id-token',
    'not-before-policy': 0,
    'session_state': 'mock-session-state',
    'scope': 'openid profile email',
  };

  const mockJWTPayload = {
    sub: '123',
    preferred_username: 'testuser',
    email: 'test@example.com',
    email_verified: true,
    name: 'Test User',
    given_name: 'Test',
    family_name: 'User',
    tenant_id: 'clinic-1',
    clinic_name: 'Test Clinic',
    clinic_type: 'general',
    realm_access: { roles: ['user', 'admin'] },
    exp: Math.floor(Date.now() / 1000) + 300,
  };

  beforeEach(() => {
    const keycloakConfigSpy = jasmine.createSpyObj('KeycloakConfigService', [
      'getTokenUrl',
      'getUserInfoUrl',
      'getClientId',
      'buildAuthorizationUrl',
      'buildLogoutUrl',
    ]);
    const tokenServiceSpy = jasmine.createSpyObj('TokenService', [
      'valid',
      'set',
      'clear',
      'getBearerToken',
      'getRefreshToken',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        KeycloakAuthService,
        { provide: KeycloakConfigService, useValue: keycloakConfigSpy },
        { provide: TokenService, useValue: tokenServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(KeycloakAuthService);
    httpMock = TestBed.inject(HttpTestingController);
    keycloakConfigService = TestBed.inject(
      KeycloakConfigService
    ) as jasmine.SpyObj<KeycloakConfigService>;
    tokenService = TestBed.inject(TokenService) as jasmine.SpyObj<TokenService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Set up default spy return values
    keycloakConfigService.getTokenUrl.and.returnValue('https://keycloak.example.com/token');
    keycloakConfigService.getUserInfoUrl.and.returnValue('https://keycloak.example.com/userinfo');
    keycloakConfigService.getClientId.and.returnValue('test-client');
    tokenService.valid.and.returnValue(false);
    tokenService.getBearerToken.and.returnValue('');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loginWithPassword', () => {
    it('should login successfully with username and password', done => {
      service.loginWithPassword('testuser', 'password').subscribe(result => {
        expect(result).toBe(true);
        expect(tokenService.set).toHaveBeenCalled();
        expect(service.authenticated()).toBe(true);
        done();
      });

      const req = httpMock.expectOne('https://keycloak.example.com/token');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toContain('grant_type=password');
      expect(req.request.body).toContain('username=testuser');
      req.flush(mockTokenResponse);
    });

    it('should handle login failure', done => {
      service.loginWithPassword('testuser', 'wrongpassword').subscribe(result => {
        expect(result).toBe(false);
        expect(service.error()).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne('https://keycloak.example.com/token');
      req.flush(
        { error: 'invalid_grant', error_description: 'Invalid credentials' },
        { status: 401, statusText: 'Unauthorized' }
      );
    });
  });

  describe('handleAuthCallback', () => {
    beforeEach(() => {
      sessionStorage.setItem('pkce_code_verifier', 'test-verifier');
      sessionStorage.setItem('auth_state', 'test-state');
    });

    afterEach(() => {
      sessionStorage.clear();
    });

    it('should handle authorization code callback successfully', done => {
      service.handleAuthCallback('test-code', 'test-state').subscribe(result => {
        expect(result).toBe(true);
        expect(tokenService.set).toHaveBeenCalled();
        expect(sessionStorage.getItem('pkce_code_verifier')).toBeNull();
        done();
      });

      const req = httpMock.expectOne('https://keycloak.example.com/token');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toContain('grant_type=authorization_code');
      expect(req.request.body).toContain('code=test-code');
      req.flush(mockTokenResponse);
    });

    it('should reject callback with invalid state', done => {
      service.handleAuthCallback('test-code', 'wrong-state').subscribe(result => {
        expect(result).toBe(false);
        expect(service.error()).toContain('Invalid state parameter');
        done();
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', done => {
      tokenService.getRefreshToken.and.returnValue('mock-refresh-token');

      service.refreshToken().subscribe(result => {
        expect(result).toBe(true);
        expect(tokenService.set).toHaveBeenCalled();
        expect(service.refreshing()).toBe(false);
        done();
      });

      const req = httpMock.expectOne('https://keycloak.example.com/token');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toContain('grant_type=refresh_token');
      req.flush(mockTokenResponse);
    });

    it('should handle refresh failure', done => {
      tokenService.getRefreshToken.and.returnValue('mock-refresh-token');

      service.refreshToken().subscribe(result => {
        expect(result).toBe(false);
        expect(service.error()).toContain('Token refresh failed');
        done();
      });

      const req = httpMock.expectOne('https://keycloak.example.com/token');
      req.flush({ error: 'invalid_grant' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('getUserInfo', () => {
    it('should fetch user info successfully', done => {
      tokenService.getBearerToken.and.returnValue('mock-access-token');

      const mockUserInfo = {
        sub: '123',
        preferred_username: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
      };

      service.getUserInfo().subscribe(user => {
        expect(user.id).toBe('123');
        expect(user.email).toBe('test@example.com');
        done();
      });

      const req = httpMock.expectOne('https://keycloak.example.com/userinfo');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-access-token');
      req.flush(mockUserInfo);
    });
  });

  describe('role management', () => {
    beforeEach(() => {
      // Mock the parseJWT method to return a valid payload
      spyOn<any>(service, 'parseJWT').and.returnValue(mockJWTPayload);
      tokenService.valid.and.returnValue(true);
      tokenService.getBearerToken.and.returnValue('mock-token');

      // Re-initialize to set user info
      (service as any).initializeAuthState();
    });

    it('should check if user has realm role', () => {
      expect(service.hasRole('admin')).toBe(true);
      expect(service.hasRole('superadmin')).toBe(false);
    });

    it('should get all realm roles', () => {
      const roles = service.getRoles();
      expect(roles).toEqual(['user', 'admin']);
    });
  });

  describe('logout', () => {
    it('should clear local state and redirect to Keycloak logout', () => {
      keycloakConfigService.buildLogoutUrl.and.returnValue('https://keycloak.example.com/logout');

      // Mock window.location.href
      delete (window as any).location;
      (window as any).location = { href: '' };

      service.logout();

      expect(tokenService.clear).toHaveBeenCalled();
      expect(service.authenticated()).toBe(false);
      expect(service.user()).toBeNull();
      expect(window.location.href).toContain('https://keycloak.example.com/logout');
    });
  });
});
