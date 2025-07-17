/**
 * Public API for all feature modules
 *
 * This barrel export provides centralized access to all feature services and models.
 * Each feature module maintains its own internal organization while exposing
 * only the public API through its index.ts file.
 */

// Core features
export * from './appointments';
export * from './patients';
export * from './treatments';

// Financial features
export * from './invoices';
// export * from './financial-summaries';

// Clinical features
// export * from './dental-charts';
// export * from './procedures';
// export * from './treatment-materials';

// Administrative features
// export * from './staff';
// export * from './specialties';
// export * from './clinic-info';

// Documentation features
export * from './documents';
export * from './notes';
export * from './lab-requests';

/**
 * Feature modules not yet implemented:
 * - Dental Charts: Tooth condition management
 * - Procedures: Dental procedure catalog
 * - Treatment Materials: Material inventory tracking
 * - Staff: Staff member management
 * - Specialties: Medical specialty management
 * - Clinic Info: Clinic configuration
 * - Financial Summaries: Financial reporting
 *
 * To implement a new feature:
 * 1. Create folder: src/app/features/[feature-name]/
 * 2. Add models: [feature-name].models.ts
 * 3. Add service: [feature-name].service.ts
 * 4. Add tests: [feature-name].service.spec.ts
 * 5. Add barrel: index.ts
 * 6. Export from this file
 */
