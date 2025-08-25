import { Routes } from '@angular/router';
import { authGuard } from '@core';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./list/staff-list-page.component').then(m => m.StaffListPageComponent),
        data: {
          title: 'Tenant User Management',
          breadcrumb: 'Users',
        },
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
];
