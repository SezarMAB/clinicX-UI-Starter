import { Routes } from '@angular/router';
import { PatientListComponent } from './patient-list/patient-list.component';
import { PatientDetailsComponent } from './patient-details/patient-details.component';
import { ToothChartComponent } from './tooth-chart/tooth-chart.component';

export const routes: Routes = [
  { path: '', redirectTo: 'list', pathMatch: 'full' },
  { path: 'list', component: PatientListComponent },
  { path: 'details/:id', component: PatientDetailsComponent },
  { path: 'tooth-chart', component: ToothChartComponent },
  { path: 'tooth-chart/:patientId', component: ToothChartComponent },
];
