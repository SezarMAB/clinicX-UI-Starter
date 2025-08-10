/**
 * Barrel export for the Tenants feature module
 * Provides centralized exports for all tenant-related components and utilities
 */

// Routes
export { routes, tenantDetailResolver } from './routes';

// Pages
export { TenantsListPage } from './tenants-list.page';
export { TenantDetailPage } from './tenant-detail.page';

// Dialogs
export { TenantFormDialog } from './tenant-form.dialog';
export { ConfirmDeleteDialog } from './confirm-delete.dialog';

// Components
export { TableSkeletonComponent } from './components/table-skeleton.component';
export { EmptyStateComponent } from './components/empty-state.component';

// Validators
export {
  subdomainAvailabilityValidator,
  createSubdomainValidator,
} from './validators/subdomain-availability.validator';
