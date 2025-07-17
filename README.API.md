# Dental Clinic API Integration

This document describes the Angular workspace setup for the dental clinic REST API integration.

## Architecture Overview

The application follows a **feature-based modular architecture** with strict separation of concerns:

```
src/app/
├── core/
│   ├── api/
│   │   ├── api.service.ts        # Thin HTTP wrapper service
│   │   ├── api.config.ts         # API configuration
│   │   └── interceptors/
│   │       ├── auth.interceptor.ts    # Session-based auth
│   │       └── error.interceptor.ts   # Global error handling
│   └── models/
│       ├── error.model.ts        # Error models
│       └── pagination.model.ts   # Enhanced pagination
├── features/
│   ├── appointments/             # Appointment management
│   ├── patients/                 # Patient management
│   ├── treatments/               # Treatment records
│   ├── invoices/                 # Billing & payments
│   ├── staff/                    # Staff management
│   └── ...                       # Other feature modules
└── shared/                       # Shared utilities

```

## Key Design Decisions

### 1. Thin ApiService Wrapper
- All HTTP operations go through `ApiService`
- No direct `HttpClient` usage in feature services
- Supports both Observable and Signal-based patterns
- Automatic credential inclusion for session auth

### 2. Signal-Based Resources
- GET requests use `apiGetResource<T>()` for reactive updates
- Auto-refreshes when input signals change
- Provides loading, error, and value states

### 3. Session-Based Authentication
- Configured for Keycloak session authentication
- `withCredentials: true` for cookie-based sessions
- Auth interceptor prepared for session headers
- Easy to activate when backend is ready

### 4. Type Safety
- Fully typed DTOs generated from OpenAPI spec
- JSDoc comments for all public APIs
- Strict TypeScript configuration
- No `any` types

## Usage Examples

### Basic GET Request (Observable)
```typescript
// In a component
constructor(private patients: PatientsService) {}

loadPatients() {
  this.patients.getAllPatients('John', { page: 0, size: 20 })
    .subscribe(page => {
      console.log('Patients:', page.content);
    });
}
```

### Signal-Based GET Request
```typescript
// In a component
patientId = signal('550e8400-e29b-41d4-a716-446655440000');
patient = this.patients.getPatientById(this.patientId);

// In template
@if (patient.isLoading()) {
  <mat-spinner />
} @else if (patient.error()) {
  <div>Error: {{ patient.error().message }}</div>
} @else if (patient.value()) {
  <div>{{ patient.value().fullName }}</div>
}
```

### POST Request
```typescript
createPatient(data: PatientCreateRequest) {
  this.patients.createPatient(data).subscribe({
    next: patient => console.log('Created:', patient),
    error: err => console.error('Error:', err)
  });
}
```

### Advanced Search
```typescript
searchPatients() {
  const criteria: PatientSearchCriteria = {
    searchTerm: 'John',
    ageFrom: 20,
    ageTo: 50,
    hasOutstandingBalance: true
  };
  
  this.patients.searchPatients(criteria, { page: 0, size: 20 })
    .subscribe(results => {
      console.log('Found:', results.totalElements, 'patients');
    });
}
```

## Authentication Setup

The application is prepared for session-based authentication with Keycloak:

1. **Current State**: Pass-through mode with credentials
2. **To Activate**: 
   - Configure Keycloak for session-based auth
   - Uncomment session header logic in `auth.interceptor.ts`
   - Add CSRF token handling if required

## API Configuration

Configure the API in `app.config.ts`:

```typescript
provideApiConfig({
  baseUrl: 'http://localhost:8080',
  withCredentials: true,
  cacheTimeMs: 300000 // 5 minutes
})
```

## Testing

All services include comprehensive unit tests using `HttpTestingController`:

```bash
# Run all tests
ng test

# Run tests with coverage
ng test --code-coverage

# Run specific test file
ng test --include='**/patients.service.spec.ts'
```

## Build Commands

```bash
# Development build
ng build

# Production build (strict mode)
ng build --configuration=production --strict

# Serve application
ng serve

# Analyze bundle size
ng build --stats-json && webpack-bundle-analyzer dist/starter/stats.json
```

## Feature Services

### Generated Services (14 total)

1. **AppointmentsService** - Appointment scheduling
2. **PatientsService** - Patient records management
3. **TreatmentsService** - Treatment logging
4. **InvoicesService** - Billing and payments
5. **StaffService** - Staff management
6. **SpecialtiesService** - Medical specialties
7. **ProceduresService** - Dental procedures
8. **DocumentsService** - Patient documents
9. **NotesService** - Patient notes
10. **LabRequestsService** - Laboratory requests
11. **DentalChartsService** - Tooth conditions
12. **FinancialSummariesService** - Financial reports
13. **ClinicInfoService** - Clinic settings
14. **TreatmentMaterialsService** - Material tracking

Each service follows the same pattern:
- Dependency injection of `ApiService`
- Typed request/response models
- Observable and Signal-based methods
- Comprehensive error handling
- Full test coverage

## Error Handling

Global error handling through `errorInterceptor`:
- Automatic toast notifications
- Session expiry handling (401)
- Permission errors (403)
- Validation errors (422)
- Network errors
- Structured error responses

## Pagination

Enhanced pagination model with utilities:
```typescript
const page = new EnhancedPage(response);
console.log(page.displayRange); // { from: 1, to: 20 }
console.log(page.currentPage);   // 1 (for display)
console.log(page.hasNext);       // true/false
```

## Contributing

1. Follow Angular style guide
2. Maintain 100% type coverage
3. Add JSDoc comments
4. Write unit tests for new methods
5. Export through barrel files
6. No direct HTTP client usage

## License

[Your License Here]