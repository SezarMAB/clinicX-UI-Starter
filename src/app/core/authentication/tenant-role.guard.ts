import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthService } from './auth.service';
import { TenantService } from './tenant.service';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Tenant-aware role guard that checks roles for the current tenant only.
 * This guard ensures that realm_access.roles are NEVER used for authorization
 * except for explicit GLOBAL_* roles.
 *
 * Usage in routes:
 * {
 *   path: 'admin',
 *   canActivate: [tenantRoleGuard(['ADMIN'])],
 *   component: AdminComponent
 * }
 */
export const tenantRoleGuard = (requiredRoles: string[]) => {
  return (route?: ActivatedRouteSnapshot, state?: RouterStateSnapshot) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const tenantService = inject(TenantService);
    const snackBar = inject(MatSnackBar);

    return auth.user().pipe(
      take(1),
      map(user => {
        // Check if user is authenticated
        if (!auth.check()) {
          console.warn('User not authenticated, redirecting to login');
          return router.parseUrl('/auth/login');
        }

        // Get current tenant from user or tenant service
        const currentTenant = user.active_tenant_id || tenantService.tenantId();

        if (!currentTenant) {
          snackBar.open('No tenant context available. Please select a tenant.', 'OK', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
          console.error('No tenant context available for authorization check');
          return router.parseUrl('/tenant-selection');
        }

        // CRITICAL: Get roles for current tenant ONLY from user_tenant_roles
        // NEVER use realm_access.roles for tenant-specific authorization
        const tenantRoles = user.user_tenant_roles?.[currentTenant] || [];

        console.log(`Checking tenant roles for ${currentTenant}:`, tenantRoles);
        console.log('Required roles:', requiredRoles);

        // Check if user has any of the required roles in the current tenant
        const hasRequiredRole = requiredRoles.some(role => tenantRoles.includes(role));

        if (hasRequiredRole) {
          console.log(`✅ Access granted: User has required role(s) in tenant ${currentTenant}`);
          return true;
        } else {
          // Log security event for audit
          console.error(`🚫 Access denied: User lacks required roles in tenant ${currentTenant}`);
          console.error(`Required: ${requiredRoles.join(', ')}, Has: ${tenantRoles.join(', ')}`);

          snackBar.open(
            `Access denied. You do not have the required permissions in ${user.clinic_name || currentTenant}.`,
            'OK',
            {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['error-snackbar'],
            }
          );

          // Redirect to dashboard
          return router.parseUrl('/dashboard');
        }
      })
    );
  };
};

/**
 * Global role guard for system-wide roles.
 * ONLY checks for GLOBAL_* prefixed roles from realm_access.
 * All other realm roles are completely ignored.
 *
 * Usage in routes:
 * {
 *   path: 'system-admin',
 *   canActivate: [globalRoleGuard(['GLOBAL_ADMIN'])],
 *   component: SystemAdminComponent
 * }
 */
export const globalRoleGuard = (requiredRoles: string[]) => {
  return (route?: ActivatedRouteSnapshot, state?: RouterStateSnapshot) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const snackBar = inject(MatSnackBar);

    return auth.user().pipe(
      take(1),
      map(user => {
        // Check if user is authenticated
        if (!auth.check()) {
          console.warn('User not authenticated, redirecting to login');
          return router.parseUrl('/auth/login');
        }

        // CRITICAL: Only check GLOBAL_* prefixed roles from realm_access
        // All other realm roles are completely ignored for security
        const globalRoles = (user.realm_access?.roles || []).filter(
          role => role && role.startsWith('GLOBAL_')
        );

        console.log('Checking global roles:', globalRoles);
        console.log('Required global roles:', requiredRoles);

        // Validate that all required roles start with GLOBAL_
        const invalidRoles = requiredRoles.filter(role => !role.startsWith('GLOBAL_'));
        if (invalidRoles.length > 0) {
          console.error(`⚠️ Invalid roles for globalRoleGuard: ${invalidRoles.join(', ')}`);
          console.error('globalRoleGuard can only check GLOBAL_* prefixed roles');
        }

        const hasRequiredRole = requiredRoles.some(role => globalRoles.includes(role));

        if (hasRequiredRole) {
          console.log('✅ Global access granted');
          return true;
        } else {
          console.error('🚫 Global access denied');

          snackBar.open(
            'Access denied. You do not have the required system-level permissions.',
            'OK',
            {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['error-snackbar'],
            }
          );

          return router.parseUrl('/dashboard');
        }
      })
    );
  };
};

/**
 * Combined guard that checks both tenant and global roles.
 * Useful for features that require either tenant-specific OR global access.
 *
 * Usage in routes:
 * {
 *   path: 'settings',
 *   canActivate: [combinedRoleGuard(['ADMIN'], ['GLOBAL_SUPPORT'])],
 *   component: SettingsComponent
 * }
 */
export const combinedRoleGuard = (tenantRoles: string[], globalRoles: string[] = []) => {
  return (route?: ActivatedRouteSnapshot, state?: RouterStateSnapshot) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const tenantService = inject(TenantService);

    return auth.user().pipe(
      take(1),
      map(user => {
        if (!auth.check()) {
          return router.parseUrl('/auth/login');
        }

        // Check global roles first (if any specified)
        if (globalRoles.length > 0) {
          const userGlobalRoles = (user.realm_access?.roles || []).filter(
            role => role && role.startsWith('GLOBAL_')
          );

          const hasGlobalRole = globalRoles.some(role => userGlobalRoles.includes(role));

          if (hasGlobalRole) {
            console.log('✅ Access granted via global role');
            return true;
          }
        }

        // Check tenant roles
        const currentTenant = user.active_tenant_id || tenantService.tenantId();
        if (currentTenant && tenantRoles.length > 0) {
          const userTenantRoles = user.user_tenant_roles?.[currentTenant] || [];

          const hasTenantRole = tenantRoles.some(role => userTenantRoles.includes(role));

          if (hasTenantRole) {
            console.log('✅ Access granted via tenant role');
            return true;
          }
        }

        console.error('🚫 Access denied: No matching tenant or global roles');
        return router.parseUrl('/dashboard');
      })
    );
  };
};
