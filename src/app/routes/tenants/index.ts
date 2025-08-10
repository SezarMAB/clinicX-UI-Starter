/**
 * Barrel export for the Tenants feature module
 * Provides centralized exports for all tenant-related components and utilities
 */

// Routes
export { routes, tenantDetailResolver } from './routes';

// Pages
export { TenantsListPage } from './components/tenants-list/tenants-list.page';
export { TenantDetailPage } from './components/tenant-detail/tenant-detail.page';

// Dialogs
export { TenantFormDialog } from './components/tenant-form/tenant-form.dialog';
export { ConfirmDeleteDialog } from './components/confirm-delete/confirm-delete.dialog';

// Components
export { TableSkeletonComponent } from './components/table-skeleton.component';
export { EmptyStateComponent } from './components/empty-state.component';

// Validators
export {
  subdomainAvailabilityValidator,
  createSubdomainValidator,
} from './validators/subdomain-availability.validator';
