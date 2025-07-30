import { Routes } from '@angular/router';
import { PatientListComponent } from './patient-list/patient-list.component';
import { PatientDetailsComponent } from './patient-details/patient-details.component';
import { PatientRegistrationComponent } from './patient-registration/patient-registration.component';
import { authGuard, roleGuard } from '@core/authentication';

export const routes: Routes = [
  { path: '', redirectTo: 'list', pathMatch: 'full' },
  {
    path: 'list',
    component: PatientListComponent,
    canActivate: [authGuard],
    data: { title: 'Patient List' },
  },
  {
    path: 'register',
    component: PatientRegistrationComponent,
    canActivate: [
      authGuard,
      roleGuard(['RECEPTIONIST', 'NURSE', 'DOCTOR', 'ADMIN', 'SUPER_ADMIN']),
    ],
    data: { title: 'Register Patient' },
  },
  {
    path: 'details/:id',
    component: PatientDetailsComponent,
    canActivate: [authGuard],
    data: { title: 'Patient Details' },
  },
];
