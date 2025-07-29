import { TestBed } from '@angular/core/testing';
import { KeycloakConfigService } from './keycloak-config.service';

describe('KeycloakConfigService', () => {
  let service: KeycloakConfigService;
  let originalHostname: string;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    originalHostname = window.location.hostname;
  });

  afterEach(() => {
    // Restore original hostname
    Object.defineProperty(window.location, 'hostname', {
      writable: true,
      value: originalHostname,
    });
  });

  const setHostname = (hostname: string) => {
    Object.defineProperty(window.location, 'hostname', {
      writable: true,
      value: hostname,
    });
  };

  it('should be created', () => {
    service = TestBed.inject(KeycloakConfigService);
    expect(service).toBeTruthy();
  });

  describe('realm detection', () => {
    it('should return master realm for localhost', () => {
      setHostname('localhost');
      service = TestBed.inject(KeycloakConfigService);
      expect(service.getRealm()).toBe('master');
    });

    it('should return master realm for 127.0.0.1', () => {
      setHostname('127.0.0.1');
      service = TestBed.inject(KeycloakConfigService);
      expect(service.getRealm()).toBe('master');
    });

    it('should extract subdomain and build realm name', () => {
      setHostname('clinic1.app.com');
      service = TestBed.inject(KeycloakConfigService);
      expect(service.getRealm()).toBe('clinic-clinic1');
    });

    it('should handle complex subdomains', () => {
      setHostname('medical-center.clickx.io');
      service = TestBed.inject(KeycloakConfigService);
      expect(service.getRealm()).toBe('clinic-medical-center');
    });

    it('should return master realm if no subdomain', () => {
      setHostname('localhost.localdomain');
      service = TestBed.inject(KeycloakConfigService);
      expect(service.getRealm()).toBe('clinic-localhost');
    });
  });

  describe('URL generation', () => {
    beforeEach(() => {
      setHostname('clinic1.app.com');
      service = TestBed.inject(KeycloakConfigService);
    });

    it('should generate correct auth URL', () => {
      const authUrl = service.getAuthUrl();
      expect(authUrl).toContain('/realms/clinic-clinic1/protocol/openid-connect/auth');
    });

    it('should generate correct token URL', () => {
      const tokenUrl = service.getTokenUrl();
      expect(tokenUrl).toContain('/realms/clinic-clinic1/protocol/openid-connect/token');
    });

    it('should generate correct logout URL', () => {
      const logoutUrl = service.getLogoutUrl();
      expect(logoutUrl).toContain('/realms/clinic-clinic1/protocol/openid-connect/logout');
    });

    it('should generate correct user info URL', () => {
      const userInfoUrl = service.getUserInfoUrl();
      expect(userInfoUrl).toContain('/realms/clinic-clinic1/protocol/openid-connect/userinfo');
    });

    it('should generate correct JWKS URL', () => {
      const jwksUrl = service.getJwksUrl();
      expect(jwksUrl).toContain('/realms/clinic-clinic1/protocol/openid-connect/certs');
    });

    it('should generate correct discovery URL', () => {
      const discoveryUrl = service.getDiscoveryUrl();
      expect(discoveryUrl).toContain('/realms/clinic-clinic1/.well-known/openid-configuration');
    });
  });

  describe('authorization URL builder', () => {
    beforeEach(() => {
      service = TestBed.inject(KeycloakConfigService);
    });

    it('should build authorization URL with required parameters', () => {
      const authUrl = service.buildAuthorizationUrl({
        redirectUri: 'http://localhost:4200/callback',
      });

      expect(authUrl).toContain('client_id=');
      expect(authUrl).toContain('redirect_uri=http://localhost:4200/callback');
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('scope=openid+profile+email');
    });

    it('should include optional parameters when provided', () => {
      const authUrl = service.buildAuthorizationUrl({
        redirectUri: 'http://localhost:4200/callback',
        responseType: 'token',
        scope: 'openid',
        state: 'test-state',
        nonce: 'test-nonce',
      });

      expect(authUrl).toContain('response_type=token');
      expect(authUrl).toContain('scope=openid');
      expect(authUrl).toContain('state=test-state');
      expect(authUrl).toContain('nonce=test-nonce');
    });
  });

  describe('logout URL builder', () => {
    beforeEach(() => {
      service = TestBed.inject(KeycloakConfigService);
    });

    it('should build logout URL without redirect', () => {
      const logoutUrl = service.buildLogoutUrl();
      expect(logoutUrl).toContain('client_id=');
      expect(logoutUrl).not.toContain('post_logout_redirect_uri');
    });

    it('should build logout URL with redirect', () => {
      const logoutUrl = service.buildLogoutUrl('http://localhost:4200/login');
      expect(logoutUrl).toContain('client_id=');
      expect(logoutUrl).toContain('post_logout_redirect_uri=http://localhost:4200/login');
    });
  });

  describe('utility methods', () => {
    it('should detect development environment correctly', () => {
      setHostname('localhost');
      service = TestBed.inject(KeycloakConfigService);
      expect(service.isDevelopment()).toBe(true);

      setHostname('127.0.0.1');
      service = TestBed.inject(KeycloakConfigService);
      expect(service.isDevelopment()).toBe(true);

      setHostname('clinic1.app.com');
      service = TestBed.inject(KeycloakConfigService);
      expect(service.isDevelopment()).toBe(false);
    });

    it('should allow realm update', () => {
      service = TestBed.inject(KeycloakConfigService);
      service.setRealm('custom-realm');
      expect(service.getRealm()).toBe('custom-realm');
    });

    it('should return correct client ID', () => {
      service = TestBed.inject(KeycloakConfigService);
      expect(service.getClientId()).toBe('clinicx-frontend');
    });

    it('should return correct Keycloak URL', () => {
      service = TestBed.inject(KeycloakConfigService);
      expect(service.getKeycloakUrl()).toBeDefined();
    });
  });
});
