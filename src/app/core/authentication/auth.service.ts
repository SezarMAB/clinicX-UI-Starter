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

  /**
   * Update the current user object and emit the change
   * Used after tenant switch to ensure the new tenant context is applied
   */
  updateUser(updates: Partial<User>): void {
    const currentUser = this.user$.value;
    const updatedUser = { ...currentUser, ...updates };
    this.user$.next(updatedUser);
  }

  menu() {
    return iif(() => this.check(), this.loginService.menu(), of([]));
  }

  private assignUser() {
    if (!this.check()) {
      return of({}).pipe(tap(user => this.user$.next(user)));
    }

    // Get the current user to preserve tenant context during refresh
    const currentUser = this.user$.value;
    const currentTenantId = currentUser?.active_tenant_id;

    console.log('assignUser called - current user state:', {
      active_tenant_id: currentUser?.active_tenant_id,
      accessible_tenants_count: currentUser?.accessible_tenants?.length || 0,
      user_tenant_roles_keys: Object.keys(currentUser?.user_tenant_roles || {}),
    });

    // Check if we already have user from Keycloak
    const keycloakUser = this.keycloakService.user();
    if (keycloakUser) {
      // Preserve the active_tenant_id and user_tenant_roles if we're in a tenant switch
      const mergedUser = {
        ...keycloakUser,
        // CRITICAL: Always preserve these fields from current user during tenant switch
        // The keycloak user won't have these updated values after token refresh
        active_tenant_id: currentUser?.active_tenant_id || keycloakUser.active_tenant_id,
        tenant_id: currentUser?.tenant_id || keycloakUser.tenant_id,
        user_tenant_roles: currentUser?.user_tenant_roles || keycloakUser.user_tenant_roles,
        // IMPORTANT: Always prefer current user's accessible_tenants as they don't change
        accessible_tenants:
          currentUser?.accessible_tenants && currentUser.accessible_tenants.length > 0
            ? currentUser.accessible_tenants
            : keycloakUser.accessible_tenants,
        // Update roles based on current tenant
        roles: currentUser?.roles || keycloakUser.roles,
        // Preserve other tenant info
        clinic_name: currentUser?.clinic_name || keycloakUser.clinic_name,
        clinic_type: currentUser?.clinic_type || keycloakUser.clinic_type,
        specialty: currentUser?.specialty || keycloakUser.specialty,
      };

      console.log('assignUser - merged user state:', {
        active_tenant_id: mergedUser.active_tenant_id,
        accessible_tenants_count: mergedUser.accessible_tenants?.length || 0,
        user_tenant_roles_keys: Object.keys(mergedUser.user_tenant_roles || {}),
        keycloak_had_tenants: keycloakUser.accessible_tenants?.length || 0,
      });

      // Always fetch tenants after token refresh to ensure we have the latest tenant/role data
      // This is critical for tenant switching to work properly
      console.log('Fetching tenants after token refresh');
      return this.tenantApiService.getMyTenants().pipe(
        map(tenants => {
          // Build user_tenant_roles from fetched tenants
          const userTenantRoles: { [tenantId: string]: string[] } = {};
          tenants.forEach(t => {
            if (t.roles && t.roles.length > 0) {
              userTenantRoles[t.tenant_id] = t.roles;
            }
          });

          // Build the final user object with fresh tenant data
          const finalUser = {
            ...mergedUser,
            accessible_tenants: tenants,
            // IMPORTANT: Keep the active_tenant_id from mergedUser (which preserves it from current user)
            // Don't default to first tenant as that would reset the tenant after switch
            active_tenant_id:
              mergedUser.active_tenant_id ||
              mergedUser.tenant_id ||
              (tenants.length > 0 ? tenants[0].tenant_id : undefined),
            user_tenant_roles: userTenantRoles, // Fresh role mapping from API
            // Ensure roles are set for the current tenant
            roles: (() => {
              const tenantId = mergedUser.active_tenant_id || mergedUser.tenant_id;
              return tenantId
                ? userTenantRoles[tenantId] || mergedUser.roles || []
                : mergedUser.roles || [];
            })(),
          };

          console.log('Final user after fetching tenants:', {
            active_tenant_id: finalUser.active_tenant_id,
            roles: finalUser.roles,
            accessible_tenants_count: finalUser.accessible_tenants.length,
          });

          return finalUser;
        }),
        tap(user => this.user$.next(user)),
        catchError(() => of(mergedUser).pipe(tap(user => this.user$.next(user))))
      );
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
            // CRITICAL CHANGE: Use tenant-specific roles instead of realm_access.roles
            roles: this.getCurrentTenantRoles(jwtPayload),
            // Keep realm_access but mark as deprecated in interface
            realm_access: jwtPayload.realm_access,
            // resource_access should never be used for authorization
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
              map(tenants => {
                // Build user_tenant_roles from fetched tenants if not in JWT
                const userTenantRoles = user.user_tenant_roles || {};
                tenants.forEach(t => {
                  if (t.roles && t.roles.length > 0) {
                    userTenantRoles[t.tenant_id] = t.roles;
                  }
                });

                return {
                  ...user,
                  accessible_tenants: tenants,
                  active_tenant_id:
                    user.active_tenant_id ||
                    (tenants.length > 0 ? tenants[0].tenant_id : undefined),
                  user_tenant_roles: userTenantRoles, // Ensure mapping is complete
                };
              }),
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

  /**
   * Get roles for the current tenant from JWT payload
   * CRITICAL: This method ensures we only use tenant-specific roles
   * and NEVER use realm_access.roles except for GLOBAL_* roles
   */
  private getCurrentTenantRoles(jwtPayload: KeycloakJWTPayload): string[] {
    // Determine the current tenant
    const currentTenant =
      jwtPayload.active_tenant_id || jwtPayload.tenant_id || this.tenantService.tenantId();

    if (!currentTenant || !jwtPayload.user_tenant_roles) {
      console.warn('No tenant context or user_tenant_roles available for role extraction');
      return [];
    }

    // Parse user_tenant_roles if needed
    const tenantRoles = this.parseUserTenantRoles(jwtPayload.user_tenant_roles);

    // Get roles for current tenant only
    const currentTenantRoles = tenantRoles[currentTenant] || [];

    // OPTIONAL: Include ONLY global roles (those with GLOBAL_ prefix)
    // These are the ONLY realm roles that should ever be used
    const globalRoles = (jwtPayload.realm_access?.roles || []).filter(
      (role: string) => role && role.startsWith('GLOBAL_')
    );

    // Combine tenant-specific roles with global roles
    const allRoles = [...currentTenantRoles, ...globalRoles];

    console.log(`Extracted roles for tenant ${currentTenant}:`, currentTenantRoles);
    if (globalRoles.length > 0) {
      console.log('Global roles included:', globalRoles);
    }

    return allRoles;
  }
}
