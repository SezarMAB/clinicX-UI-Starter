import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AuthService } from './auth.service';
import { TenantService } from './tenant.service';

/**
 * Centralized service for role management in multi-tenant environment.
 * This service ensures that only tenant-specific roles are used for authorization,
 * and realm_access.roles are NEVER used except for GLOBAL_* prefixed roles.
 *
 * CRITICAL SECURITY: This service enforces the same role isolation as the backend:
 * - Regular realm roles are completely ignored
 * - Only user_tenant_roles[currentTenant] are used for authorization
 * - Only GLOBAL_* prefixed realm roles are allowed for system-wide access
 */
@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private readonly authService = inject(AuthService);
  private readonly tenantService = inject(TenantService);

  /**
   * Check if user has a specific role in the current tenant.
   * NEVER checks realm_access.roles except for GLOBAL_* roles.
   *
   * @param role The role to check (e.g., 'ADMIN', 'DOCTOR')
   * @param tenantId Optional tenant ID (defaults to current tenant)
   */
  hasRole(role: string, tenantId?: string): Observable<boolean> {
    return this.authService.user().pipe(
      map(user => {
        const tenant = tenantId || user.active_tenant_id || this.tenantService.tenantId();

        if (!tenant) {
          console.warn('No tenant context available for role check');
          return false;
        }

        // CRITICAL: Only check user_tenant_roles for the specific tenant
        const tenantRoles = user.user_tenant_roles?.[tenant] || [];
        const hasRole = tenantRoles.includes(role);

        if (!hasRole) {
          console.debug(`User does not have role '${role}' in tenant '${tenant}'`);
        }

        return hasRole;
      })
    );
  }

  /**
   * Check if user has ANY of the specified roles in the current tenant.
   *
   * @param roles Array of roles to check
   * @param tenantId Optional tenant ID
   */
  hasAnyRole(roles: string[], tenantId?: string): Observable<boolean> {
    return this.authService.user().pipe(
      map(user => {
        const tenant = tenantId || user.active_tenant_id || this.tenantService.tenantId();

        if (!tenant) {
          console.warn('No tenant context available for role check');
          return false;
        }

        const tenantRoles = user.user_tenant_roles?.[tenant] || [];
        return roles.some(role => tenantRoles.includes(role));
      })
    );
  }

  /**
   * Check if user has ALL of the specified roles in the current tenant.
   *
   * @param roles Array of roles that user must have
   * @param tenantId Optional tenant ID
   */
  hasAllRoles(roles: string[], tenantId?: string): Observable<boolean> {
    return this.authService.user().pipe(
      map(user => {
        const tenant = tenantId || user.active_tenant_id || this.tenantService.tenantId();

        if (!tenant) {
          console.warn('No tenant context available for role check');
          return false;
        }

        const tenantRoles = user.user_tenant_roles?.[tenant] || [];
        return roles.every(role => tenantRoles.includes(role));
      })
    );
  }

  /**
   * Get all roles for the current tenant.
   * Returns ONLY tenant-specific roles, never realm_access.roles.
   */
  getCurrentTenantRoles(): Observable<string[]> {
    return this.authService.user().pipe(
      map(user => {
        const tenant = user.active_tenant_id || this.tenantService.tenantId();

        if (!tenant) {
          console.warn('No tenant context available');
          return [];
        }

        // CRITICAL: Only return roles from user_tenant_roles
        const roles = user.user_tenant_roles?.[tenant] || [];
        console.log(`Current roles in tenant ${tenant}:`, roles);
        return roles;
      })
    );
  }

  /**
   * Get roles for a specific tenant.
   *
   * @param tenantId The tenant ID
   */
  getTenantRoles(tenantId: string): Observable<string[]> {
    return this.authService.user().pipe(
      map(user => {
        return user.user_tenant_roles?.[tenantId] || [];
      })
    );
  }

  /**
   * Get all tenant-role mappings for the current user.
   */
  getAllTenantRoles(): Observable<{ [tenantId: string]: string[] }> {
    return this.authService.user().pipe(map(user => user.user_tenant_roles || {}));
  }

  /**
   * Check if user has a GLOBAL role (system-wide access).
   * ONLY checks for roles with GLOBAL_ prefix from realm_access.
   * All other realm roles are completely ignored.
   *
   * @param role The global role to check (must start with GLOBAL_)
   */
  hasGlobalRole(role: string): Observable<boolean> {
    if (!role.startsWith('GLOBAL_')) {
      console.error(`⚠️ Invalid global role check: '${role}' must start with GLOBAL_`);
      return this.authService.user().pipe(map(() => false));
    }

    return this.authService.user().pipe(
      map(user => {
        // CRITICAL: Only check GLOBAL_* prefixed roles from realm_access
        const globalRoles = (user.realm_access?.roles || []).filter(
          r => r && r.startsWith('GLOBAL_')
        );

        const hasRole = globalRoles.includes(role);

        if (hasRole) {
          console.log(`User has global role: ${role}`);
        }

        return hasRole;
      })
    );
  }

  /**
   * Get all global roles for the current user.
   * Returns ONLY GLOBAL_* prefixed roles from realm_access.
   */
  getGlobalRoles(): Observable<string[]> {
    return this.authService.user().pipe(
      map(user => {
        // CRITICAL: Filter to only GLOBAL_* prefixed roles
        const globalRoles = (user.realm_access?.roles || []).filter(
          role => role && role.startsWith('GLOBAL_')
        );

        if (globalRoles.length > 0) {
          console.log('User global roles:', globalRoles);
        }

        return globalRoles;
      })
    );
  }

  /**
   * Check if user is an admin in the current tenant.
   * Convenience method for common check.
   */
  isAdmin(tenantId?: string): Observable<boolean> {
    return this.hasRole('ADMIN', tenantId);
  }

  /**
   * Check if user is a doctor in the current tenant.
   * Convenience method for common check.
   */
  isDoctor(tenantId?: string): Observable<boolean> {
    return this.hasRole('DOCTOR', tenantId);
  }

  /**
   * Check if user is staff in the current tenant.
   * Convenience method for common check.
   */
  isStaff(tenantId?: string): Observable<boolean> {
    return this.hasRole('STAFF', tenantId);
  }

  /**
   * Check if user has global support role.
   * This role typically allows read-only access across all tenants.
   */
  hasGlobalSupport(): Observable<boolean> {
    return this.hasGlobalRole('GLOBAL_SUPPORT');
  }

  /**
   * Check if user has global admin role.
   * This role typically allows full system administration.
   */
  hasGlobalAdmin(): Observable<boolean> {
    return this.hasGlobalRole('GLOBAL_ADMIN');
  }

  /**
   * Get the highest role for the current tenant.
   * Returns the most privileged role from a predefined hierarchy.
   */
  getHighestRole(tenantId?: string): Observable<string | null> {
    const roleHierarchy = ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'STAFF', 'VIEWER'];

    return this.authService.user().pipe(
      map(user => {
        const tenant = tenantId || user.active_tenant_id || this.tenantService.tenantId();

        if (!tenant) {
          return null;
        }

        const tenantRoles = user.user_tenant_roles?.[tenant] || [];

        for (const role of roleHierarchy) {
          if (tenantRoles.includes(role)) {
            return role;
          }
        }

        return null;
      })
    );
  }

  /**
   * Log current role state for debugging.
   * Useful for troubleshooting authorization issues.
   */
  debugRoles(): void {
    this.authService
      .user()
      .pipe(
        map(user => {
          const currentTenant = user.active_tenant_id || this.tenantService.tenantId();

          console.group('🔐 Role Debug Information');
          console.log('Current Tenant:', currentTenant);
          console.log('User Tenant Roles:', user.user_tenant_roles);

          if (currentTenant && user.user_tenant_roles) {
            console.log('Current Tenant Roles:', user.user_tenant_roles[currentTenant]);
          }

          const globalRoles = (user.realm_access?.roles || []).filter(
            r => r && r.startsWith('GLOBAL_')
          );
          console.log('Global Roles:', globalRoles);

          // Warning about deprecated usage
          const nonGlobalRealmRoles = (user.realm_access?.roles || []).filter(
            r => r && !r.startsWith('GLOBAL_')
          );
          if (nonGlobalRealmRoles.length > 0) {
            console.warn(
              '⚠️ Non-global realm roles detected (these are ignored):',
              nonGlobalRealmRoles
            );
          }

          if (user.resource_access && Object.keys(user.resource_access).length > 0) {
            console.warn('⚠️ Resource access detected (these are ignored):', user.resource_access);
          }

          console.groupEnd();
        })
      )
      .subscribe();
  }
}
