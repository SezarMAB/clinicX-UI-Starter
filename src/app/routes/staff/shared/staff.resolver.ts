import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, of } from 'rxjs';
import { StaffApiService } from '../../../features/staff/staff-api.service';
import { StaffDto } from '../../../features/staff/staff.models';

export const staffResolver: ResolveFn<StaffDto | null> = route => {
  const staffApi = inject(StaffApiService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  const id = route.paramMap.get('id');

  if (!id) {
    router.navigate(['/staff']);
    snackBar.open('Invalid staff ID', 'Close', { duration: 3000 });
    return of(null);
  }

  return staffApi.getByIdOnce(id).pipe(
    catchError(error => {
      if (error.status === 404) {
        router.navigate(['/staff']);
        snackBar.open('Staff member not found', 'Close', { duration: 3000 });
      } else {
        router.navigate(['/staff']);
        snackBar.open('Error loading staff member', 'Close', { duration: 3000 });
      }
      return of(null);
    })
  );
};
