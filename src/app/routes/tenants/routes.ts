import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { TenantsService } from '@features/tenants/tenants.service';
import { TenantDetailDto } from '@features/tenants/tenants.models';
import { signal } from '@angular/core';
import { firstValueFrom, filter, take } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

/**
 * Resolver for tenant details
 * Fetches tenant data by ID from route params
 */
export const tenantDetailResolver: ResolveFn<TenantDetailDto | null> = async route => {
  const tenantsService = inject(TenantsService);
  const tenantId = route.paramMap.get('id');

  if (!tenantId) {
    return null;
  }

  const tenantIdSignal = signal(tenantId);
  const resource = tenantsService.getTenantById(tenantIdSignal);

  try {
    // Wait for the resource to load
    await firstValueFrom(
      toObservable(resource.isLoading).pipe(
        filter(loading => !loading),
        take(1)
      )
    );

    return resource.value() || null;
  } catch {
    return null;
  }
};

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/tenants-list/tenants-list.page').then(m => m.TenantsListPage),
    data: { title: 'Tenants Management' },
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/tenant-detail/tenant-detail.page').then(m => m.TenantDetailPage),
    resolve: {
      tenant: tenantDetailResolver,
    },
    data: { title: 'Tenant Details' },
  },
];
