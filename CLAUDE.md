# ClickX Medical Management System - Project Documentation

## Executive Summary

ClickX is a comprehensive medical clinic management system built with Angular 20, implementing modern reactive patterns with signals, standalone components, and Angular Material Design. The application provides patient management, appointment scheduling, treatment tracking, and multi-tenant support with role-based access control.

## Technology Stack

### Core Framework
- **Angular 20.1.1** - Latest Angular with signals and standalone components
- **TypeScript 5.8.3** - Strict type checking enabled
- **RxJS 7.8.0** - Reactive programming
- **Zone.js 0.15.1** - Change detection

### UI Framework
- **Angular Material 20.1.1** - Material Design components
- **Angular CDK 20.1.1** - Component Development Kit
- **Ng-Matero 20.0.1** - Material extensions
- **NgX-Formly 7.0.0** - Dynamic forms
- **ApexCharts 5.2.0** - Data visualization

### State Management & Data
- **Angular Signals** - Reactive state management
- **HTTP Resources** - Signal-based HTTP operations
- **Angular Forms** - Reactive forms with validation

### Authentication & Authorization
- **Keycloak Integration** - OAuth2/OIDC authentication
- **NGX-Permissions 19.0.0** - Role-based access control
- **JWT Token Management** - Token refresh and validation

### Internationalization
- **@ngx-translate 16.0.0** - Multi-language support (EN/AR)
- **Date-fns 4.1.0** - Date formatting and localization
- **RTL Support** - Arabic language support

### Development Tools
- **Yarn** - Package manager (required)
- **ESLint** - TypeScript linting
- **Stylelint** - SCSS linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Webpack Bundle Analyzer** - Bundle optimization

## Project Architecture

### Directory Structure

```
starter/
├── src/
│   ├── app/
│   │   ├── core/           # Core services and infrastructure
│   │   │   ├── api/        # HTTP service abstraction
│   │   │   ├── authentication/  # Auth services & guards
│   │   │   ├── bootstrap/  # App initialization
│   │   │   ├── interceptors/    # HTTP interceptors
│   │   │   └── models/     # Core data models
│   │   ├── features/       # Feature services & models
│   │   │   ├── patients/   # Patient management
│   │   │   ├── appointments/    # Appointment scheduling
│   │   │   ├── treatments/ # Treatment tracking
│   │   │   ├── staff/      # Staff management
│   │   │   └── tenants/    # Multi-tenancy
│   │   ├── routes/         # UI components & pages
│   │   │   ├── patient/    # Patient module
│   │   │   ├── appointments/    # Appointments UI
│   │   │   ├── staff/      # Staff UI
│   │   │   ├── tenants/    # Tenant management UI
│   │   │   └── sessions/   # Auth pages
│   │   ├── shared/         # Shared components & utils
│   │   └── theme/          # Layout & theming
│   ├── assets/             # Static assets
│   ├── environments/       # Environment configs
│   └── public/
│       └── i18n/          # Translation files
```

### Key Architectural Patterns

#### 1. Signal-Based State Management
```typescript
// State signals
patients = signal<PatientDto[]>([]);
loading = signal(false);
pageIndex = signal(0);

// Computed signals for derived state
filteredPatients = computed(() => 
  this.patients().filter(p => p.name.includes(this.searchTerm()))
);

// Effects for side effects
effect(() => {
  const patients = this.patients();
  console.log('Patients updated:', patients);
});
```

#### 2. HTTP Resource Pattern
```typescript
// Signal-based HTTP for GET operations
getAllPatients(pageRequest: Signal<PageRequest>) {
  return this.apiService.apiGetResource<Page<PatientDto>>(
    '/api/v1/patients',
    { params: computed(() => pageRequest()) }
  );
}

// Observable-based for mutations
createPatient(patient: PatientCreateRequest): Observable<PatientDto> {
  return this.apiService.post<PatientDto>('/api/v1/patients', patient);
}
```

#### 3. Standalone Components
```typescript
@Component({
  selector: 'app-patient-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatCardModule, TranslateModule],
  templateUrl: './patient-list.component.html'
})
```

## Coding Standards & Conventions

### TypeScript/Angular
- **Strict Mode**: TypeScript strict mode enabled
- **Change Detection**: OnPush strategy for all components
- **Component Structure**: Standalone components only
- **Naming Conventions**:
  - Components: `PascalCase` with `.component.ts` suffix
  - Services: `PascalCase` with `.service.ts` suffix
  - Models: `PascalCase` with `.models.ts` suffix
  - Interfaces: `PascalCase` with `Dto` suffix for DTOs
- **File Organization**: Feature-based organization
- **Imports**: Use path aliases (`@core`, `@features`, `@shared`)

### HTML Templates
- **Angular Control Flow**: Use `@if`, `@for`, `@switch` (no *ngIf, *ngFor)
- **Internationalization**: All text through translate pipe
- **Accessibility**: ARIA labels and semantic HTML
- **Material Components**: Use Angular Material components

### SCSS Styling
- **CSS Variables**: Use theme variables for colors
- **BEM Naming**: Block-Element-Modifier convention
- **Responsive**: Mobile-first approach
- **Theme Support**: Light/dark theme compatibility
- **Angular Material v20 MDC Cleanup**:
  - **NEVER use `::ng-deep`** - It's deprecated and breaks encapsulation
  - **NEVER target MDC internals** - No `.mat-mdc-*` or `.mdc-*` selectors
  - **Use public selectors only as example**:
    - `.mat-mdc-header-cell` → `th[mat-header-cell]`
    - `.mat-mdc-cell` → `td[mat-cell]`
    - `.mat-mdc-icon-button` → `button[mat-icon-button]`
    - `.mat-mdc-paginator` → `mat-paginator`
  - **Global styles for overlays**: Use `.cdk-overlay-container` in global styles
  - **Density tokens**: Use Material's density system globally, not local hacks
  - **Form field sizing**: Use density tokens in `styles.scss`, not component overrides
  - **NO  appearance="outline"**: 

### State Management
- **Signals**: Use signals for synchronous state
- **Observables**: Use for async operations
- **Computed**: Use for derived state
- **Effects**: Use sparingly, only in constructors

### API Integration
- **Service Layer**: All API calls through feature services
- **Error Handling**: Centralized error interceptor
- **Loading States**: Signal-based loading indicators
- **Pagination**: Consistent PageRequest/Page models

### Forms
- **Reactive Forms**: FormBuilder with validators
- **Custom Validators**: Domain-specific validation
- **Error Messages**: Internationalized error display
- **Material Form Fields**: Consistent styling

## Common Tasks & Commands

### Development
```bash
# Install dependencies (use Yarn only)
yarn install

# Start development server
yarn start
# or
ng serve --proxy-config proxy.conf.json --watch

# Build for production
yarn build:prod

# Run linting
yarn lint

# Run tests
yarn test

# Analyze bundle
yarn analyze
```

### Code Generation
```bash
# Generate a new component
ng generate component routes/module-name/component-name --standalone

# Generate a new service
ng generate service features/feature-name/service-name

# Generate a new guard
ng generate guard core/guards/guard-name
```

## API Endpoints

### Base URL
- Development: `http://localhost:8080`
- Production: Configured in environment

### Key Endpoints
- `/api/v1/patients` - Patient management
- `/api/v1/appointments` - Appointment scheduling
- `/api/v1/treatments` - Treatment records
- `/api/v1/staff` - Staff management
- `/api/v1/tenants` - Tenant operations
- `/api/v1/auth` - Authentication

## Authentication Flow

1. **Keycloak Integration** (if enabled)
   - OAuth2/OIDC flow
   - JWT token management
   - Auto token refresh

2. **Session-Based Auth** (default)
   - Cookie-based sessions
   - CSRF protection
   - Server-side session management

## Multi-Tenancy

- **Tenant Isolation**: Data segregated by tenant ID
- **Tenant Switching**: UI component for switching
- **Role-Based Access**: Permissions per tenant
- **Subdomain Support**: Tenant-specific subdomains

## Internationalization

### Supported Languages
- English (en-US) - Default
- Arabic (ar-SY) - RTL support

### Translation Keys Structure
```
common.*          - Common UI elements
patients.*        - Patient module
appointments.*    - Appointments module
treatments.*      - Treatments module
validation.*      - Form validation messages
```

## Material Design Theme

### Color Palette
- **Primary**: Azure Blue (#0066CC)
- **Accent**: Teal
- **Warn**: Red
- **Success**: Green (#4CAF50)
- **Info**: Blue (#2196F3)

### CSS Variables
```scss
--med-primary-dark
--med-primary-hover
--med-surface-light
--med-surface-variant
--med-text-primary
--med-text-secondary
```

## Performance Optimizations

- **OnPush Change Detection**: Reduces change detection cycles
- **Lazy Loading**: Route-level code splitting
- **Virtual Scrolling**: For large lists (planned)
- **Debounced Search**: 300ms debounce on search inputs
- **Signal-Based Reactivity**: Automatic dependency tracking
- **HTTP Resource Caching**: Built-in caching for GET requests

## Security Considerations

- **CSRF Protection**: Enabled for session auth
- **XSS Prevention**: Angular sanitization
- **Input Validation**: Client and server-side
- **Role-Based Access**: Route guards and UI permissions
- **Secure Headers**: Configured in interceptors
- **Token Storage**: HttpOnly cookies preferred

## Testing Strategy

### Unit Testing
- **Framework**: Jasmine + Karma
- **Coverage Target**: 80%
- **Focus Areas**: Services, validators, utilities

### E2E Testing
- **Framework**: Protractor (legacy)
- **Migration Plan**: Move to Playwright

### Test Files
- `*.spec.ts` - Unit tests
- `*.e2e-spec.ts` - E2E tests

## Known Issues & Limitations

1. **Angular Material 20**: MDC migration - must clean up internal selectors
2. **Virtual Scrolling**: Not yet implemented for large datasets
3. **Offline Support**: No service worker implementation
4. **Real-time Updates**: WebSocket support pending

### Angular Material v20 Migration Notes

After upgrading to Angular Material v20, the following cleanup is required:

1. **Remove all `::ng-deep` usage** - This is deprecated and will be removed
2. **Replace MDC internal selectors** with public API selectors
3. **Move overlay styles to global** - Component styles can't pierce view encapsulation
4. **Use density system** - Don't hack form field heights with internal selectors
5. **Preserve app styles** - Keep application-specific classes and CSS variables

## Best Practices

### Component Development
1. Always use standalone components
2. Implement OnPush change detection
3. Use signals for state management
4. Provide loading and error states
5. Include proper TypeScript types
6. **SCSS Guidelines**:
   - No `::ng-deep` - style globally or use proper encapsulation
   - No MDC internals - use only public Material selectors
   - Use attribute selectors for Material components
   - Preserve app-specific classes and variables
   - Rely on global theming and density tokens

### Service Development
1. Use HTTP resources for GET operations
2. Return observables for mutations
3. Handle errors at service level
4. Provide mock data fallbacks
5. Document service methods

### Form Handling
1. Use reactive forms exclusively
2. Implement custom validators
3. Provide clear error messages
4. Support internationalization
5. Handle loading states

### Routing
1. Implement lazy loading
2. Use route guards for auth
3. Provide breadcrumb data
4. Handle route parameters reactively
5. Implement proper error pages

## Debugging Tips

### Common Issues
1. **Change Detection**: Use `ChangeDetectorRef.markForCheck()`
2. **Signal Context**: Effects must be in injection context
3. **CORS Issues**: Check proxy configuration
4. **Translation Keys**: Verify key exists in JSON files
5. **Material Theming**: Check CSS variable availability

### Debug Tools
- Angular DevTools browser extension
- Redux DevTools (for NgRx if used)
- Network tab for API debugging
- Console logging with debug interceptor

## Deployment

### Build Process
1. Run production build: `yarn build:prod`
2. Output in `dist/starter`
3. Serve with Node.js: `yarn serve:prod`

### Environment Configuration
- Update `environment.prod.ts`
- Configure API base URL
- Set authentication parameters
- Enable/disable features

### Docker Support
- Dockerfile available for containerization
- Multi-stage build for optimization
- Nginx configuration for serving

## Contributing Guidelines

1. **Branch Strategy**: Feature branches from develop
2. **Commit Messages**: Conventional commits format
3. **Code Review**: Required for all PRs
4. **Testing**: Tests must pass
5. **Documentation**: Update relevant docs

## Contact & Support

- **Documentation**: This file and inline code comments
- **Issue Tracking**: GitHub Issues
- **Team Communication**: Internal Slack/Teams

## Style Migration Guide for Angular Material v20

### Quick Reference - Selector Mapping

| Old MDC Selector | New Public Selector |
|-----------------|-------------------|
| `.mat-mdc-header-cell` | `th[mat-header-cell]` |
| `.mat-mdc-cell` | `td[mat-cell]` |
| `.mat-mdc-row` | `tr[mat-row]` |
| `.mat-mdc-header-row` | `tr[mat-header-row]` |
| `.mat-mdc-icon-button` | `button[mat-icon-button]` |
| `.mat-mdc-button` | `button[mat-button]` |
| `.mat-mdc-raised-button` | `button[mat-raised-button]` |
| `.mat-mdc-paginator` | `mat-paginator` |
| `.mat-mdc-form-field` | `mat-form-field` |
| `.mat-mdc-select` | `mat-select` |
| `.mat-mdc-input-element` | `input[matInput]` |
| `.mat-mdc-card` | `mat-card` |
| `.mat-mdc-checkbox` | `mat-checkbox` |

### Migration Checklist

- [ ] Remove all `::ng-deep` from component styles
- [ ] Replace all `.mat-mdc-*` selectors with public equivalents
- [ ] Remove all `.mdc-*` internal selectors
- [ ] Move overlay styles to global `styles.scss`
- [ ] Use density tokens for form field sizing
- [ ] Test all Material components after migration
- [ ] Verify theming still works correctly

---

*Document Version: 1.1*  
*Last Updated: 2025-01-22*  
*Framework: Angular 20 with Signals & Standalone Components*  
*Material Design: v20 with MDC cleanup guidelines*
