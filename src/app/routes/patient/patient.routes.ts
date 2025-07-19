import { Routes } from '@angular/router';
import { PatientListComponent } from './patient-list/patient-list.component';
import { PatientDetailsComponent } from './patient-details/patient-details.component';

export const routes: Routes = [
  { path: '/details/:id', component: PatientDetailsComponent },
  { path: 'list', component: PatientListComponent },
];
