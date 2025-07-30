import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { map, take } from 'rxjs';
import { AuthService } from './auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Role-based route guard
 *
 * Usage in routes:
 * {
 *   path: 'admin',
 *   canActivate: [roleGuard(['ADMIN', 'SUPER_ADMIN'])],
 *   component: AdminComponent
 * }
 */
export const roleGuard = (requiredRoles: string[]) => {
  return (route?: ActivatedRouteSnapshot, state?: RouterStateSnapshot) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const snackBar = inject(MatSnackBar);

    return auth.user().pipe(
      take(1),
      map(user => {
        // Check if user is authenticated
        if (!auth.check()) {
          return router.parseUrl('/auth/login');
        }

        // Get user roles based on current tenant
        const userRoles = user.realm_access?.roles || [];

        // Check if user has any of the required roles
        const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

        if (hasRequiredRole) {
          return true;
        } else {
          // Show access denied message
          snackBar.open('Access denied. You do not have the required permissions.', 'OK', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });

          // Redirect to dashboard or previous page
          return router.parseUrl('/dashboard');
        }
      })
    );
  };
};

/**
 * Permission-based route guard
 *
 * Usage in routes:
 * {
 *   path: 'edit',
 *   canActivate: [permissionGuard(['canEdit', 'canManagePatients'])],
 *   component: EditComponent
 * }
 */
export const permissionGuard = (requiredPermissions: string[]) => {
  return (route?: ActivatedRouteSnapshot, state?: RouterStateSnapshot) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const snackBar = inject(MatSnackBar);

    return auth.user().pipe(
      take(1),
      map(user => {
        // Check if user is authenticated
        if (!auth.check()) {
          return router.parseUrl('/auth/login');
        }

        // Get user permissions
        const userPermissions = user.permissions || [];

        // Check if user has any of the required permissions
        const hasRequiredPermission = requiredPermissions.some(permission =>
          userPermissions.includes(permission)
        );

        if (hasRequiredPermission) {
          return true;
        } else {
          // Show access denied message
          snackBar.open('Access denied. You do not have the required permissions.', 'OK', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });

          // Redirect to dashboard
          return router.parseUrl('/dashboard');
        }
      })
    );
  };
};
