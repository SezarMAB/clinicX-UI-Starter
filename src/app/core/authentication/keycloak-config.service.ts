import { Injectable } from '@angular/core';
import { environment } from '@env/environment';

/**
 * Service for managing Keycloak configuration and URLs
 * Handles multi-tenant realm detection based on subdomain
 */
@Injectable({
  providedIn: 'root',
})
export class KeycloakConfigService {
  private readonly keycloakBaseUrl = environment.keycloakUrl;
  private readonly clientId = environment.keycloakClientId;
  private realmName: string;

  constructor() {
    this.realmName = this.detectRealm();
  }

  /**
   * Extract subdomain from hostname and build realm name
   * @returns The detected realm name
   */
  private detectRealm(): string {
    const hostname = window.location.hostname;

    // Handle localhost and development environments
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'master'; // Default realm for development
    }

    // Extract subdomain from hostname (e.g., clinic1.app.com -> clinic1)
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const subdomain = parts[0];
      // Build realm name as clinic-{subdomain}
      return `${subdomain}-realm`;
    }

    // Fallback to master realm if no subdomain detected
    return 'master';
  }

  /**
   * Get the current realm name
   */
  getRealm(): string {
    return this.realmName;
  }

  /**
   * Get Keycloak base URL
   */
  getKeycloakUrl(): string {
    return this.keycloakBaseUrl;
  }

  /**
   * Get client ID
   */
  getClientId(): string {
    return this.clientId;
  }

  /**
   * Get the authorization endpoint URL
   */
  getAuthUrl(): string {
    return `${this.keycloakBaseUrl}/realms/${this.realmName}/protocol/openid-connect/auth`;
  }

  /**
   * Get the token endpoint URL
   */
  getTokenUrl(): string {
    return `${this.keycloakBaseUrl}/realms/${this.realmName}/protocol/openid-connect/token`;
  }

  /**
   * Get the logout endpoint URL
   */
  getLogoutUrl(): string {
    return `${this.keycloakBaseUrl}/realms/${this.realmName}/protocol/openid-connect/logout`;
  }

  /**
   * Get the user info endpoint URL
   */
  getUserInfoUrl(): string {
    return `${this.keycloakBaseUrl}/realms/${this.realmName}/protocol/openid-connect/userinfo`;
  }

  /**
   * Get the JWKS (JSON Web Key Set) endpoint URL
   */
  getJwksUrl(): string {
    return `${this.keycloakBaseUrl}/realms/${this.realmName}/protocol/openid-connect/certs`;
  }

  /**
   * Get the OpenID Connect discovery document URL
   */
  getDiscoveryUrl(): string {
    return `${this.keycloakBaseUrl}/realms/${this.realmName}/.well-known/openid-configuration`;
  }

  /**
   * Build authorization URL with parameters
   */
  buildAuthorizationUrl(params: {
    redirectUri: string;
    responseType?: string;
    scope?: string;
    state?: string;
    nonce?: string;
  }): string {
    const urlParams = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: params.redirectUri,
      response_type: params.responseType || 'code',
      scope: params.scope || 'openid profile email',
    });

    if (params.state) {
      urlParams.set('state', params.state);
    }

    if (params.nonce) {
      urlParams.set('nonce', params.nonce);
    }

    return `${this.getAuthUrl()}?${urlParams.toString()}`;
  }

  /**
   * Build logout URL with redirect
   */
  buildLogoutUrl(redirectUri?: string): string {
    const urlParams = new URLSearchParams({
      client_id: this.clientId,
    });

    if (redirectUri) {
      urlParams.set('post_logout_redirect_uri', redirectUri);
    }

    return `${this.getLogoutUrl()}?${urlParams.toString()}`;
  }

  /**
   * Check if running in development mode
   */
  isDevelopment(): boolean {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1';
  }

  /**
   * Update realm (useful for testing or dynamic realm switching)
   */
  setRealm(realm: string): void {
    this.realmName = realm;
  }
}
