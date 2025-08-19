import { Routes } from '@angular/router';
import { AppointmentsDashboardComponent } from './appointments-dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: AppointmentsDashboardComponent,
    data: {
      title: 'appointments.dashboard',
      breadcrumb: 'appointments.dashboard',
    },
  },
  {
    path: 'dashboard',
    component: AppointmentsDashboardComponent,
    data: {
      title: 'appointments.dashboard',
      breadcrumb: 'appointments.dashboard',
    },
  },
];
