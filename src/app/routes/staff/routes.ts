import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list/staff-list-page.component').then(m => m.StaffListPageComponent),
  },
  // All staff operations (view, create, edit) are now handled via dialogs
  // opened from the staff list component
];
