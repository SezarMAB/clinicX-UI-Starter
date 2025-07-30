import { Routes } from '@angular/router';
import { PatientListComponent } from './patient-list/patient-list.component';
import { PatientDetailsComponent } from './patient-details/patient-details.component';
import { PatientRegistrationComponent } from './patient-registration/patient-registration.component';
import { authGuard } from '@core/authentication';
import { ngxPermissionsGuard } from 'ngx-permissions';

export const routes: Routes = [
  { path: '', redirectTo: 'list', pathMatch: 'full' },
  {
    path: 'list',
    component: PatientListComponent,
    canActivate: [authGuard, ngxPermissionsGuard],
    data: {
      title: 'Patient List',
      permissions: {
        only: ['ADMIN', 'MANAGER', 'DOCTOR', 'NURSE', 'SUPER_ADMIN'],
        redirectTo: '/dashboard',
      },
    },
  },
  {
    path: 'register',
    component: PatientRegistrationComponent,
    canActivate: [authGuard, ngxPermissionsGuard],
    data: {
      title: 'Register Patient',
      permissions: {
        only: ['RECEPTIONIST', 'NURSE', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN'],
        redirectTo: '/dashboard',
      },
    },
  },
  {
    path: 'details/:id',
    component: PatientDetailsComponent,
    canActivate: [authGuard, ngxPermissionsGuard],
    data: {
      title: 'Patient Details',
      permissions: {
        only: ['ADMIN', 'MANAGER', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'SUPER_ADMIN'],
        redirectTo: '/dashboard',
      },
    },
  },
];
