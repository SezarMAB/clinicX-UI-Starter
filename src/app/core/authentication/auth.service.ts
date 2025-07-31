import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, catchError, iif, map, merge, of, share, switchMap, tap } from 'rxjs';
import { filterObject, isEmptyObject } from './helpers';
import { User, KeycloakJWTPayload, AccessibleTenant } from './interface';
import { LoginService } from './login.service';
import { TokenService } from './token.service';
import { KeycloakAuthService } from './keycloak-auth.service';
import { TenantService } from './tenant.service';
import { TenantApiService } from './tenant-api.service';
import { JwtToken } from './token';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly loginService = inject(LoginService);
  private readonly tokenService = inject(TokenService);
  private readonly keycloakService = inject(KeycloakAuthService);
  private readonly tenantService = inject(TenantService);
  private readonly tenantApiService = inject(TenantApiService);

  private user$ = new BehaviorSubject<User>({});
  private change$ = merge(
    this.tokenService.change(),
    this.tokenService.refresh().pipe(switchMap(() => this.refresh()))
  ).pipe(
    switchMap(() => this.assignUser()),
    share()
  );

  init() {
    return new Promise<void>(resolve => this.change$.subscribe(() => resolve()));
  }

  change() {
    return this.change$;
  }

  check() {
    return this.tokenService.valid();
  }

  login(username: string, password: string, rememberMe = false) {
    // Use Keycloak for authentication
    return this.keycloakService.loginWithPassword(username, password).pipe(
      switchMap(() => {
        // Fetch user tenants after successful login
        return this.tenantApiService.getMyTenants().pipe(
          tap(tenants => {
            // Update user with fetched tenants
            const user = this.keycloakService.user();
            if (user && tenants.length > 0) {
              const updatedUser: User = {
                ...user,
                accessible_tenants: tenants,
                // Set active tenant to the first one if not already set
                active_tenant_id: user.active_tenant_id || tenants[0].tenant_id,
              };
              this.user$.next(updatedUser);

              // Update tenant service with the active tenant
              const activeTenant =
                tenants.find(t => t.tenant_id === updatedUser.active_tenant_id) || tenants[0];
              this.tenantService.setTenant({
                tenant_id: activeTenant.tenant_id,
                clinic_name: activeTenant.clinic_name,
                clinic_type: activeTenant.clinic_type,
                subdomain: this.tenantService.subdomain() || activeTenant.tenant_id,
              });
            } else if (user) {
              this.user$.next(user);
            }
          }),
          catchError(error => {
            console.error('Failed to fetch user tenants:', error);
            // Continue with login even if tenant fetch fails
            const user = this.keycloakService.user();
            if (user) {
              this.user$.next(user);
            }
            return of(null);
          })
        );
      }),
      map(() => this.check())
    );
  }

  /**
   * Initiate Keycloak redirect-based login
   */
  async loginWithRedirect(redirectUri?: string) {
    await this.keycloakService.loginWithRedirect(redirectUri);
  }

  refresh() {
    return this.keycloakService.refreshToken().pipe(
      tap(() => {
        // Update user info after refresh
        const user = this.keycloakService.user();
        if (user) {
          this.user$.next(user);
        }
      }),
      catchError(() => of(false)),
      map(() => this.check())
    );
  }

  logout() {
    return of(true).pipe(
      tap(async () => {
        await this.keycloakService.logout();
      }),
      map(() => !this.check())
    );
  }

  user() {
    return this.user$.pipe(share());
  }

  menu() {
    return iif(() => this.check(), this.loginService.menu(), of([]));
  }

  private assignUser() {
    if (!this.check()) {
      return of({}).pipe(tap(user => this.user$.next(user)));
    }

    // Check if we already have user from Keycloak
    const keycloakUser = this.keycloakService.user();
    if (keycloakUser) {
      // Fetch tenants if not already fetched
      if (!keycloakUser.accessible_tenants || keycloakUser.accessible_tenants.length === 0) {
        return this.tenantApiService.getMyTenants().pipe(
          map(tenants => ({
            ...keycloakUser,
            accessible_tenants: tenants,
            active_tenant_id:
              keycloakUser.active_tenant_id ||
              (tenants.length > 0 ? tenants[0].tenant_id : undefined),
          })),
          tap(user => this.user$.next(user)),
          catchError(() => of(keycloakUser).pipe(tap(user => this.user$.next(user))))
        );
      }
      return of(keycloakUser).pipe(tap(user => this.user$.next(user)));
    }

    if (!isEmptyObject(this.user$.getValue())) {
      return of(this.user$.getValue());
    }

    // Try to get user from token
    const token = this.tokenService.getBearerToken();
    if (token) {
      const accessToken = token.replace('Bearer ', '');
      if (JwtToken.is(accessToken)) {
        const jwtPayload = this.keycloakService.parseJWT(accessToken);
        if (jwtPayload) {
          const user: User = {
            id: jwtPayload.sub,
            name: jwtPayload.name || jwtPayload.preferred_username,
            email: jwtPayload.email,
            preferred_username: jwtPayload.preferred_username,
            tenant_id: jwtPayload.tenant_id,
            clinic_name: jwtPayload.clinic_name,
            clinic_type: jwtPayload.clinic_type,
            roles: jwtPayload.realm_access?.roles || [],
            realm_access: jwtPayload.realm_access,
            resource_access: jwtPayload.resource_access,
            // Phase 4 multi-tenant fields
            active_tenant_id: jwtPayload.active_tenant_id || jwtPayload.tenant_id,
            accessible_tenants: this.parseAccessibleTenants(jwtPayload.accessible_tenants),
            user_tenant_roles: this.parseUserTenantRoles(jwtPayload.user_tenant_roles),
            specialty: jwtPayload.specialty,
          };

          // Fetch tenants from API if not in JWT
          if (!user.accessible_tenants || user.accessible_tenants.length === 0) {
            return this.tenantApiService.getMyTenants().pipe(
              map(tenants => ({
                ...user,
                accessible_tenants: tenants,
                active_tenant_id:
                  user.active_tenant_id || (tenants.length > 0 ? tenants[0].tenant_id : undefined),
              })),
              tap(u => this.user$.next(u)),
              catchError(() => of(user).pipe(tap(u => this.user$.next(u))))
            );
          }

          return of(user).pipe(tap(u => this.user$.next(u)));
        }
      }
    }

    // Fallback to login service (for backward compatibility)
    return this.loginService.user().pipe(tap(user => this.user$.next(user)));
  }

  /**
   * Parse accessible tenants from JWT payload
   * The JWT might have it as a string in format "tenant1|name1|role1,tenant2|name2|role2"
   */
  private parseAccessibleTenants(accessibleTenants: any): AccessibleTenant[] {
    if (!accessibleTenants) return [];

    // If it's already an array, return it
    if (Array.isArray(accessibleTenants)) return accessibleTenants;

    // If it's a string, parse it
    if (typeof accessibleTenants === 'string') {
      try {
        // Example format: "dental-anas-4c40d19a|Dental Main anas|ADMIN"
        const tenantStrings = accessibleTenants.split(',');
        return tenantStrings
          .map(tenantStr => {
            const [tenant_id, clinic_name, role] = tenantStr.split('|');
            return {
              tenant_id: tenant_id || '',
              clinic_name: clinic_name || '',
              clinic_type: 'APPOINTMENTS', // Default, should come from API
              specialty: 'APPOINTMENTS' as any, // Default, should come from API
              roles: role ? [role] : [],
            };
          })
          .filter(t => t.tenant_id); // Filter out invalid entries
      } catch (error) {
        console.error('Failed to parse accessible_tenants:', error);
        return [];
      }
    }

    return [];
  }

  /**
   * Parse user tenant roles from JWT payload
   * The JWT might have it as a JSON string
   */
  private parseUserTenantRoles(userTenantRoles: any): { [tenantId: string]: string[] } {
    if (!userTenantRoles) return {};

    // If it's already an object, return it
    if (typeof userTenantRoles === 'object' && !Array.isArray(userTenantRoles)) {
      return userTenantRoles;
    }

    // If it's a string, try to parse it as JSON
    if (typeof userTenantRoles === 'string') {
      try {
        return JSON.parse(userTenantRoles);
      } catch (error) {
        console.error('Failed to parse user_tenant_roles:', error);
        return {};
      }
    }

    return {};
  }
}
