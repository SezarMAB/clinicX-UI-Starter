import { Routes } from '@angular/router';
import { PatientListComponent } from './patient-list/patient-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'list', pathMatch: 'full' },
  { path: 'list', component: PatientListComponent },
];
