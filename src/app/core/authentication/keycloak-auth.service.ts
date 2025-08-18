import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, timer, switchMap, catchError, tap, map, of } from 'rxjs';
import { KeycloakTokenResponse, KeycloakJWTPayload, User } from './interface';
import { KeycloakConfigService } from './keycloak-config.service';
import { TokenService } from './token.service';

/**
 * Service for handling Keycloak authentication
 * Supports both password grant and authorization code flow
 */
@Injectable({
  providedIn: 'root',
})
export class KeycloakAuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly keycloakConfig = inject(KeycloakConfigService);
  private readonly tokenService = inject(TokenService);

  // Signals for reactive state
  private readonly isAuthenticated = signal(false);
  private readonly userInfo = signal<User | null>(null);
  private readonly authError = signal<string | null>(null);
  private readonly isRefreshing = signal(false);

  // Public computed signals
  readonly authenticated = computed(() => this.isAuthenticated());
  readonly user = computed(() => this.userInfo());
  readonly error = computed(() => this.authError());
  readonly refreshing = computed(() => this.isRefreshing());

  // Store for PKCE verifier
  private codeVerifier: string | null = null;

  constructor() {
    // Initialize authentication state
    this.initializeAuthState();
  }

  /**
   * Initialize authentication state from stored token
   */
  private initializeAuthState(): void {
    if (this.tokenService.valid()) {
      this.isAuthenticated.set(true);
      const token = this.tokenService.getBearerToken();
      if (token) {
        const payload = this.parseJWT(token);
        if (payload) {
          // Preserve existing user data during initialization
          const currentUser = this.userInfo();
          const newUserFromJWT = this.mapJWTToUser(payload);

          const mergedUser = {
            ...newUserFromJWT,
            // Preserve these fields if they exist
            accessible_tenants: currentUser?.accessible_tenants,
            user_tenant_roles: currentUser?.user_tenant_roles,
            active_tenant_id: currentUser?.active_tenant_id || newUserFromJWT.tenant_id,
            roles: currentUser?.roles || newUserFromJWT.roles,
          };

          this.userInfo.set(mergedUser);
        }
      }
    }
  }

  /**
   * Login using direct password grant (username/password)
   * @param username User's username
   * @param password User's password
   * @returns Observable of login success
   */
  loginWithPassword(username: string, password: string): Observable<boolean> {
    const body = new HttpParams()
      .set('grant_type', 'password')
      .set('client_id', this.keycloakConfig.getClientId())
      .set('username', username)
      .set('password', password)
      .set('scope', 'openid profile email');

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    return this.http
      .post<KeycloakTokenResponse>(this.keycloakConfig.getTokenUrl(), body.toString(), { headers })
      .pipe(
        tap(response => this.handleTokenResponse(response)),
        map(() => true),
        catchError(error => {
          this.authError.set(error.error?.error_description || 'Authentication failed');
          // Re-throw the error so it can be handled by the component
          return throwError(() => error);
        })
      );
  }

  /**
   * Initiate authorization code flow
   * @param redirectUri URI to redirect after authentication
   * @param state Optional state parameter for CSRF protection
   */
  async loginWithRedirect(redirectUri?: string, state?: string): Promise<void> {
    // Generate PKCE code verifier and challenge
    this.codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(this.codeVerifier);

    // Store verifier and state in session storage
    sessionStorage.setItem('pkce_code_verifier', this.codeVerifier);
    if (state) {
      sessionStorage.setItem('auth_state', state);
    }

    const authUrl = this.keycloakConfig.buildAuthorizationUrl({
      redirectUri: redirectUri || window.location.origin + '/auth/callback',
      responseType: 'code',
      scope: 'openid profile email',
      state: state || this.generateRandomString(16),
    });

    // Add PKCE challenge
    const urlWithPKCE = `${authUrl}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

    // Redirect to Keycloak
    window.location.href = urlWithPKCE;
  }

  /**
   * Handle authorization code callback
   * @param code Authorization code from Keycloak
   * @param state State parameter for CSRF validation
   * @returns Observable of authentication success
   */
  handleAuthCallback(code: string, state?: string): Observable<boolean> {
    // Validate state if provided
    if (state) {
      const storedState = sessionStorage.getItem('auth_state');
      if (state !== storedState) {
        this.authError.set('Invalid state parameter - possible CSRF attack');
        return of(false);
      }
    }

    // Retrieve PKCE verifier
    const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
    if (!codeVerifier) {
      this.authError.set('Missing PKCE code verifier');
      return of(false);
    }

    const body = new HttpParams()
      .set('grant_type', 'authorization_code')
      .set('client_id', this.keycloakConfig.getClientId())
      .set('code', code)
      .set('redirect_uri', window.location.origin + '/auth/callback')
      .set('code_verifier', codeVerifier);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    return this.http
      .post<KeycloakTokenResponse>(this.keycloakConfig.getTokenUrl(), body.toString(), { headers })
      .pipe(
        tap(response => {
          this.handleTokenResponse(response);
          // Clean up session storage
          sessionStorage.removeItem('pkce_code_verifier');
          sessionStorage.removeItem('auth_state');
        }),
        map(() => true),
        catchError(error => {
          this.authError.set(error.error?.error_description || 'Authentication failed');
          return of(false);
        })
      );
  }

  /**
   * Refresh the access token using refresh token
   * @returns Observable of refresh success
   */
  refreshToken(): Observable<boolean> {
    const refreshToken = this.tokenService.getRefreshToken();
    if (!refreshToken) {
      this.authError.set('No refresh token available');
      return of(false);
    }

    if (this.isRefreshing()) {
      return of(false);
    }

    this.isRefreshing.set(true);

    const body = new HttpParams()
      .set('grant_type', 'refresh_token')
      .set('client_id', this.keycloakConfig.getClientId())
      .set('refresh_token', refreshToken);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    return this.http
      .post<KeycloakTokenResponse>(this.keycloakConfig.getTokenUrl(), body.toString(), { headers })
      .pipe(
        tap(response => {
          this.handleTokenResponse(response);
          this.isRefreshing.set(false);
        }),
        map(() => true),
        catchError(error => {
          this.authError.set(error.error?.error_description || 'Token refresh failed');
          this.isRefreshing.set(false);
          this.logout();
          return of(false);
        })
      );
  }

  /**
   * Set up automatic token refresh
   * @param bufferTime Time in seconds before expiry to refresh (default: 60)
   */
  setupAutoRefresh(bufferTime = 60): void {
    if (!this.tokenService.valid()) {
      return;
    }

    const token = this.tokenService.getBearerToken();
    if (!token) {
      return;
    }

    const payload = this.parseJWT(token);
    if (!payload || !payload.exp) {
      return;
    }

    const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
    const refreshTime = (expiresIn - bufferTime) * 1000;

    if (refreshTime > 0) {
      timer(refreshTime)
        .pipe(switchMap(() => this.refreshToken()))
        .subscribe();
    }
  }

  /**
   * Logout user and redirect to Keycloak logout
   * @param redirectUri Optional URI to redirect after logout
   */
  logout(redirectUri?: string): void {
    // Clear local authentication state
    this.tokenService.clear();
    this.isAuthenticated.set(false);
    this.userInfo.set(null);
    this.authError.set(null);

    // Get current ID token for logout
    const idToken = sessionStorage.getItem('id_token');

    // Build logout URL
    const logoutUrl = this.keycloakConfig.buildLogoutUrl(redirectUri || window.location.origin);

    // Add ID token hint if available
    const finalLogoutUrl = idToken ? `${logoutUrl}&id_token_hint=${idToken}` : logoutUrl;

    // Clear session storage
    sessionStorage.removeItem('id_token');

    // Redirect to Keycloak logout
    window.location.href = finalLogoutUrl;
  }

  /**
   * Get user info from Keycloak userinfo endpoint
   * @returns Observable of user information
   */
  getUserInfo(): Observable<User> {
    const token = this.tokenService.getBearerToken();
    if (!token) {
      return throwError(() => new Error('No access token available'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<any>(this.keycloakConfig.getUserInfoUrl(), { headers }).pipe(
      map(userInfo => this.mapUserInfoToUser(userInfo)),
      tap(user => this.userInfo.set(user)),
      catchError(error => {
        this.authError.set('Failed to fetch user info');
        return throwError(() => error);
      })
    );
  }

  /**
   * Handle token response from Keycloak
   * @param response Token response from Keycloak
   */
  private handleTokenResponse(response: KeycloakTokenResponse): void {
    // Store tokens
    this.tokenService.set({
      'access_token': response.access_token,
      'refresh_token': response.refresh_token,
      'expires_in': response.expires_in,
      'token_type': response.token_type,
      'id_token': response.id_token,
      'refresh_expires_in': response.refresh_expires_in,
      'not-before-policy': response['not-before-policy'],
      'session_state': response.session_state,
      'scope': response.scope,
    });

    // Store ID token separately for logout
    if (response.id_token) {
      sessionStorage.setItem('id_token', response.id_token);
    }

    // Parse access token for user info
    const payload = this.parseJWT(response.access_token);
    if (payload) {
      // IMPORTANT: Preserve existing user data that's not in the JWT
      const currentUser = this.userInfo();
      const newUserFromJWT = this.mapJWTToUser(payload);

      // Merge the new JWT data with preserved fields
      const mergedUser = {
        ...newUserFromJWT,
        // Preserve these fields as they're not in the JWT
        accessible_tenants: currentUser?.accessible_tenants,
        user_tenant_roles: currentUser?.user_tenant_roles,
        active_tenant_id: currentUser?.active_tenant_id || newUserFromJWT.tenant_id,
        // Keep the roles from current user if they were set during tenant switch
        roles: currentUser?.roles || newUserFromJWT.roles,
      };

      console.log('Keycloak handleTokenResponse - preserving user data:', {
        had_accessible_tenants: currentUser?.accessible_tenants?.length || 0,
        preserved_accessible_tenants: mergedUser.accessible_tenants?.length || 0,
      });

      this.userInfo.set(mergedUser);
    }

    this.isAuthenticated.set(true);
    this.authError.set(null);

    // Set up auto refresh
    this.setupAutoRefresh();
  }

  /**
   * Parse JWT token
   * @param token JWT token string
   * @returns Parsed JWT payload or null
   */
  parseJWT(token: string): KeycloakJWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(atob(parts[1]));
      return payload as KeycloakJWTPayload;
    } catch (error) {
      console.error('Failed to parse JWT:', error);
      return null;
    }
  }

  /**
   * Map JWT payload to User object
   * @param payload JWT payload
   * @returns User object
   */
  private mapJWTToUser(payload: KeycloakJWTPayload): User {
    return {
      id: payload.sub,
      preferred_username: payload.preferred_username,
      email: payload.email,
      email_verified: payload.email_verified,
      name: payload.name || `${payload.given_name} ${payload.family_name}`.trim(),
      given_name: payload.given_name,
      family_name: payload.family_name,
      tenant_id: payload.tenant_id,
      clinic_name: payload.clinic_name,
      clinic_type: payload.clinic_type,
      realm_access: payload.realm_access,
      resource_access: payload.resource_access,
      roles: payload.realm_access?.roles || [],
    };
  }

  /**
   * Map userinfo response to User object
   * @param userInfo Userinfo response from Keycloak
   * @returns User object
   */
  private mapUserInfoToUser(userInfo: any): User {
    return {
      id: userInfo.sub,
      preferred_username: userInfo.preferred_username,
      email: userInfo.email,
      email_verified: userInfo.email_verified,
      name: userInfo.name,
      given_name: userInfo.given_name,
      family_name: userInfo.family_name,
      tenant_id: userInfo.tenant_id,
      clinic_name: userInfo.clinic_name,
      clinic_type: userInfo.clinic_type,
      roles: userInfo.roles || [],
    };
  }

  /**
   * Generate PKCE code verifier
   * @returns Code verifier string
   */
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  /**
   * Generate PKCE code challenge from verifier
   * @param verifier Code verifier
   * @returns Code challenge string
   */
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const buffer = await crypto.subtle.digest('SHA-256', data);
    return this.base64URLEncode(new Uint8Array(buffer));
  }

  /**
   * Generate random string for state parameter
   * @param length Length of string
   * @returns Random string
   */
  private generateRandomString(length: number): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  /**
   * Base64 URL encode
   * @param buffer Array buffer
   * @returns Base64 URL encoded string
   */
  private base64URLEncode(buffer: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...buffer));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Check if user has specific role
   * @param role Role name to check
   * @param client Optional client ID for resource-specific roles
   * @returns True if user has role
   */
  hasRole(role: string, client?: string): boolean {
    const user = this.userInfo();
    if (!user) {
      return false;
    }

    if (client && user.resource_access?.[client]) {
      return user.resource_access[client].roles.includes(role);
    }

    return user.realm_access?.roles.includes(role) || false;
  }

  /**
   * Get all user roles
   * @param client Optional client ID for resource-specific roles
   * @returns Array of role names
   */
  getRoles(client?: string): string[] {
    const user = this.userInfo();
    if (!user) {
      return [];
    }

    if (client && user.resource_access?.[client]) {
      return user.resource_access[client].roles;
    }

    return user.realm_access?.roles || [];
  }

  /**
   * Clear authentication error
   */
  clearError(): void {
    this.authError.set(null);
  }
}
