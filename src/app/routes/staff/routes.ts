import { Routes } from '@angular/router';
import { staffResolver } from './shared/staff.resolver';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list/staff-list-page.component').then(m => m.StaffListPageComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./form/staff-form-page.component').then(m => m.StaffFormPageComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./detail/staff-detail-page.component').then(m => m.StaffDetailPageComponent),
    resolve: { staff: staffResolver },
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./form/staff-form-page.component').then(m => m.StaffFormPageComponent),
    resolve: { staff: staffResolver },
  },
];
