import { Routes } from '@angular/router';
import { PatientListComponent } from './patient-list/patient-list.component';
import { PatientDetailsComponent } from './patient-details/patient-details.component';
import { PatientRegistrationComponent } from './patient-registration/patient-registration.component';
import { authGuard, tenantRoleGuard, combinedRoleGuard } from '@core/authentication';

/**
 * Tenant-aware patient routes.
 * These routes use the new security model where roles are checked
 * within the context of the current tenant only.
 *
 * To use this file, rename it to patient.routes.ts
 */
export const routes: Routes = [
  { path: '', redirectTo: 'list', pathMatch: 'full' },
  {
    path: 'list',
    component: PatientListComponent,
    canActivate: [
      authGuard,
      tenantRoleGuard(['ADMIN', 'MANAGER', 'DOCTOR', 'NURSE', 'SUPER_ADMIN']),
    ],
    data: {
      title: 'Patient List',
      breadcrumb: 'List',
    },
  },
  {
    path: 'register',
    component: PatientRegistrationComponent,
    canActivate: [
      authGuard,
      tenantRoleGuard(['RECEPTIONIST', 'NURSE', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN']),
    ],
    data: {
      title: 'Register Patient',
      breadcrumb: 'Register',
    },
  },
  {
    path: 'details/:id',
    component: PatientDetailsComponent,
    canActivate: [
      authGuard,
      // Example: Allow tenant staff OR global support to view patient details
      combinedRoleGuard(
        ['ADMIN', 'MANAGER', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'SUPER_ADMIN'],
        ['GLOBAL_SUPPORT'] // Global support can view (read-only) across tenants
      ),
    ],
    data: {
      title: 'Patient Details',
      breadcrumb: 'Details',
    },
  },
];

/**
 * Migration Notes:
 *
 * 1. Changed from ngxPermissionsGuard to tenantRoleGuard
 *    - More explicit about tenant context
 *    - Better error messages
 *    - Consistent with backend security model
 *
 * 2. Added combinedRoleGuard example for patient details
 *    - Shows how to allow both tenant-specific and global roles
 *    - GLOBAL_SUPPORT can view patients across all tenants
 *
 * 3. Removed permissions object from route data
 *    - No longer needed with new guards
 *    - Cleaner route configuration
 *
 * 4. Security implications:
 *    - User with DOCTOR role in tenant-a cannot access patients in tenant-b
 *    - User with GLOBAL_SUPPORT can view (but not edit) in all tenants
 *    - Each tenant's data is completely isolated
 */
