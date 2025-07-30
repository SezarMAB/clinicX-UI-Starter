// import { inject } from '@angular/core';
// import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
// import { map, take } from 'rxjs';
// import { AuthService } from './auth.service';
// import { FeatureFlagService, FeatureCode } from '@core/services/feature-flag.service';
// import { MatSnackBar } from '@angular/material/snack-bar';
//
// /**
//  * Tenant-aware route guard that checks both authentication and tenant access
//  *
//  * Usage in routes:
//  * {
//  *   path: 'dental',
//  *   canActivate: [tenantGuard()],
//  *   component: DentalComponent
//  * }
//  */
// export const tenantGuard = () => {
//   return (route?: ActivatedRouteSnapshot, state?: RouterStateSnapshot) => {
//     const auth = inject(AuthService);
//     const router = inject(Router);
//
//     return auth.user().pipe(
//       take(1),
//       map(user => {
//         // Check if user is authenticated
//         if (!auth.check()) {
//           return router.parseUrl('/auth/login');
//         }
//
//         // Check if user has an active tenant
//         if (!user.active_tenant_id) {
//           // If user has accessible tenants but no active one, they need to select one
//           if (user.accessible_tenants && user.accessible_tenants.length > 0) {
//             return router.parseUrl('/tenant-selection');
//           }
//           // No tenants available
//           return router.parseUrl('/no-access');
//         }
//
//         return true;
//       })
//     );
//   };
// };
//
// /**
//  * Feature-based route guard that checks if a feature is available for the current tenant
//  *
//  * Usage in routes:
//  * {
//  *   path: 'dental/charts',
//  *   canActivate: [featureGuard('DENTAL_CHARTS')],
//  *   component: DentalChartsComponent
//  * }
//  */
// export const featureGuard = (requiredFeature: FeatureCode | FeatureCode[]) => {
//   return (route?: ActivatedRouteSnapshot, state?: RouterStateSnapshot) => {
//     const auth = inject(AuthService);
//     const router = inject(Router);
//     const featureFlagService = inject(FeatureFlagService);
//     const snackBar = inject(MatSnackBar);
//
//     const features = Array.isArray(requiredFeature) ? requiredFeature : [requiredFeature];
//
//     return auth.user().pipe(
//       take(1),
//       map(user => {
//         // Check if user is authenticated
//         if (!auth.check()) {
//           return router.parseUrl('/auth/login');
//         }
//
//         // Check if user has the required feature
//         const hasFeature = featureFlagService.hasAnyFeature(...features);
//
//         if (hasFeature) {
//           return true;
//         } else {
//           // Show feature not available message
//           const specialty = featureFlagService.currentTenantSpecialty();
//           snackBar.open(
//             `This feature is not available for ${specialty} specialty. Please contact your administrator.`,
//             'OK',
//             {
//               duration: 5000,
//               horizontalPosition: 'center',
//               verticalPosition: 'top',
//               panelClass: ['warning-snackbar'],
//             }
//           );
//
//           // Redirect to dashboard
//           return router.parseUrl('/dashboard');
//         }
//       })
//     );
//   };
// };
//
// /**
//  * Combined guard that checks authentication, tenant access, role, and features
//  *
//  * Usage in routes:
//  * {
//  *   path: 'admin/dental-settings',
//  *   canActivate: [combinedGuard({
//  *     roles: ['ADMIN', 'SUPER_ADMIN'],
//  *     features: ['DENTAL'],
//  *     requireAllFeatures: false
//  *   })],
//  *   component: DentalSettingsComponent
//  * }
//  */
// export interface CombinedGuardOptions {
//   roles?: string[];
//   features?: FeatureCode[];
//   requireAllRoles?: boolean;
//   requireAllFeatures?: boolean;
// }
//
// export const combinedGuard = (options: CombinedGuardOptions) => {
//   return (route?: ActivatedRouteSnapshot, state?: RouterStateSnapshot) => {
//     const auth = inject(AuthService);
//     const router = inject(Router);
//     const featureFlagService = inject(FeatureFlagService);
//     const snackBar = inject(MatSnackBar);
//
//     return auth.user().pipe(
//       take(1),
//       map(user => {
//         // Check if user is authenticated
//         if (!auth.check()) {
//           return router.parseUrl('/auth/login');
//         }
//
//         // Check if user has an active tenant
//         if (!user.active_tenant_id) {
//           return router.parseUrl('/tenant-selection');
//         }
//
//         // Check roles if specified
//         if (options.roles && options.roles.length > 0) {
//           const userRoles = user.realm_access?.roles || [];
//           const hasRole = options.requireAllRoles
//             ? options.roles.every(role => userRoles.includes(role))
//             : options.roles.some(role => userRoles.includes(role));
//
//           if (!hasRole) {
//             snackBar.open('Access denied. Insufficient permissions.', 'OK', {
//               duration: 5000,
//               panelClass: ['error-snackbar'],
//             });
//             return router.parseUrl('/dashboard');
//           }
//         }
//
//         // Check features if specified
//         if (options.features && options.features.length > 0) {
//           const hasFeature = options.requireAllFeatures
//             ? featureFlagService.hasAllFeatures(...options.features)
//             : featureFlagService.hasAnyFeature(...options.features);
//
//           if (!hasFeature) {
//             snackBar.open('This feature is not available for your tenant.', 'OK', {
//               duration: 5000,
//               panelClass: ['warning-snackbar'],
//             });
//             return router.parseUrl('/dashboard');
//           }
//         }
//
//         return true;
//       })
//     );
//   };
// };
