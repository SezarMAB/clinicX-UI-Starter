/**
 * Barrel export for the Tenants feature module
 * Provides centralized exports for all tenant-related components and utilities
 */

// Routes
export { routes, tenantDetailResolver } from './routes';

// Pages
export { TenantsListComponent } from './components/tenants-list/tenants-list.component';
export { TenantDetailComponent } from './components/tenant-detail/tenant-detail.component';

// Dialogs
export { TenantFormDialogComponent } from './components/tenant-form/tenant-form-dialog.component';
export { ConfirmDeleteDialogComponent } from './components/confirm-delete/confirm-delete-dialog.component';

// Components
export { TableSkeletonComponent } from './components/table-skeleton.component';
export { EmptyStateComponent } from './components/empty-state.component';

// Validators
export {
  subdomainAvailabilityValidator,
  createSubdomainValidator,
} from './validators/subdomain-availability.validator';
