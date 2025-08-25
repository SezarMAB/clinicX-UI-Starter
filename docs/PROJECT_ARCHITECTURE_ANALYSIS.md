# ClickX Medical Application - Architecture Analysis

## Tech Stack

### Core Technologies
- **Framework**: Angular 20.1.1 (latest)
- **Language**: TypeScript 5.8.3 with strict mode
- **Build System**: @angular-devkit/build-angular with application builder
- **Package Manager**: Yarn (enforced over npm)

### UI & Styling
- **Component Library**: Angular Material 20.1.1
- **UI Extensions**: @ng-matero/extensions 20.2.0
- **Theme**: Medical theme with teal/cyan primary colors
- **Styling**: SCSS with BEM methodology
- **CSS Framework**: Custom grid system and utility classes
- **Icons**: Material Icons

### State Management & Forms
- **Forms**: 
  - Reactive Forms (Angular native)
  - @ngx-formly for dynamic forms
- **State**: Signal-based reactive state (Angular 20)
- **HTTP**: httpResource API with custom ApiService wrapper

### Authentication & Permissions
- **Auth**: Token-based authentication (JWT)
- **Permissions**: ngx-permissions for RBAC
- **Session**: Support for session-based auth (withCredentials)

### Data & API
- **HTTP Client**: Angular HttpClient with interceptors
- **API Pattern**: RESTful with pagination support
- **Mock Data**: angular-in-memory-web-api for development

### Utilities
- **i18n**: @ngx-translate for internationalization
- **Date Handling**: date-fns with Material adapters
- **Charts**: ApexCharts
- **Toasts**: ngx-toastr
- **Progress**: ngx-progressbar

## Architecture Patterns

### 1. Project Structure
```
src/
├── app/
│   ├── core/              # Core services, guards, interceptors
│   ├── features/          # Feature modules (services, models)
│   ├── routes/            # Route components and pages
│   ├── shared/            # Shared components, directives, pipes
│   └── theme/             # Layout components and theming
├── styles/                # Global styles and theme files
├── environments/          # Environment configurations
└── assets/               # Static assets
```

### 2. Module Architecture
- **Standalone Components**: All components use Angular's standalone API
- **Lazy Loading**: Route-based lazy loading for features
- **Barrel Exports**: Each module exports through index.ts
- **Feature Modules**: Domain-driven feature organization

### 3. Service Architecture

#### API Service Pattern
```typescript
// Central API wrapper service
ApiService {
  - Thin wrapper around HttpClient
  - Support for both Observable and Signal patterns
  - Centralized error handling
  - Base URL and headers configuration
}

// Feature services extend API service
PatientsService {
  - Domain-specific endpoints
  - Both Observable and Signal-based methods
  - Type-safe DTOs
  - Pagination support
}
```

#### Authentication Flow
```typescript
AuthService → LoginService → TokenService
             ↓
         Interceptors (token, error handling)
```

### 4. Component Patterns

#### Signal-Based State Management
- Components use Angular Signals for reactive state
- Computed signals for derived state
- Effects for side effects
- Resource API for HTTP data fetching

#### Component Structure
```typescript
@Component({
  selector: 'app-component',
  standalone: true,
  imports: [...],
  templateUrl: './component.html',
  styleUrl: './component.scss'
})
export class Component {
  // Input signals
  id = input<string>();
  
  // State signals
  data = signal<Type | null>(null);
  isLoading = signal(false);
  
  // Computed values
  derivedValue = computed(() => ...);
  
  // Resources
  resource = service.getResource(id);
  
  // Effects
  constructor() {
    effect(() => {
      // React to signal changes
    });
  }
}
```

### 5. Styling Architecture

#### Theme System
- **Medical Theme**: Custom teal/cyan color scheme
- **Dark Mode**: Full dark theme support with CSS variables
- **Material Theming**: Extended Material Design theming
- **CSS Variables**: Semantic tokens for medical context

#### CSS Organization
```scss
styles/
├── _medical-theme.scss    # Medical-specific theme
├── _medical-overrides.scss # Component overrides
├── colors/                # Color systems (M2, M3)
├── grid/                  # Custom grid system
├── helpers/               # Utility classes
└── plugins/              # Third-party overrides
```

### 6. Routing Architecture
- **Lazy Routes**: Feature-based lazy loading
- **Route Guards**: Authentication guards
- **Nested Routes**: Hierarchical routing structure
- **Route Parameters**: Signal-based route param handling

### 7. Interceptor Chain
1. **NoopInterceptor**: Pass-through
2. **BaseUrlInterceptor**: Prepend base URL
3. **SettingsInterceptor**: Add settings headers
4. **TokenInterceptor**: Add auth token
5. **ApiInterceptor**: API-specific handling
6. **ErrorInterceptor**: Global error handling
7. **LoggingInterceptor**: Request/response logging

### 8. Medical Domain Features

#### Current Features
- **Patients**: Full CRUD with search, pagination
- **Appointments**: Scheduling and management
- **Treatments**: Treatment history and logging
- **Documents**: Document management
- **Notes**: Clinical notes
- **Lab Requests**: Laboratory request tracking
- **Invoices**: Financial records

#### Planned Features
- Dental Charts
- Procedures Catalog
- Treatment Materials
- Staff Management
- Specialties
- Clinic Configuration
- Financial Summaries

### 9. Key Design Decisions

1. **Standalone Components**: Better tree-shaking and simpler imports
2. **Signal-Based State**: Modern reactive patterns without RxJS complexity
3. **httpResource API**: Automatic reactivity for HTTP requests
4. **Medical Theme**: Purpose-built for healthcare UX
5. **Feature-First Organization**: Domain-driven structure
6. **Type Safety**: Strict TypeScript with comprehensive DTOs
7. **Internationalization**: Built-in multi-language support
8. **Responsive Design**: Mobile-first with Material breakpoints

### 10. Best Practices Observed

1. **Separation of Concerns**: Clear layer separation
2. **DRY Principle**: Shared services and utilities
3. **Type Safety**: Strong typing throughout
4. **Consistent Naming**: Clear, descriptive names
5. **Documentation**: JSDoc comments on services
6. **Testing**: Spec files for components/services
7. **Code Organization**: Logical file structure
8. **Performance**: Lazy loading and tree-shaking

## Configuration Files

### TypeScript Configuration
- Strict mode enabled
- Path aliases for clean imports
- Target: ES2022
- Module: ES2022

### Angular Configuration
- Standalone components default
- SCSS styling
- Strict template checking
- Production optimizations
- Budget limits enforced

### Development Tools
- ESLint for TypeScript linting
- Stylelint for SCSS
- Prettier for formatting
- Husky for pre-commit hooks
- Commitlint for commit messages

## Security Considerations

1. **Authentication**: JWT tokens with refresh support
2. **CORS**: Proxy configuration for development
3. **Interceptors**: Centralized auth handling
4. **Permissions**: Role-based access control
5. **Input Validation**: Form validators
6. **XSS Protection**: Angular's built-in sanitization

## Performance Optimizations

1. **Lazy Loading**: Route-based code splitting
2. **Tree Shaking**: Standalone components
3. **Signal Optimization**: Fine-grained reactivity
4. **Bundle Analysis**: Webpack bundle analyzer
5. **Production Build**: Optimized with hashing
6. **Caching**: HTTP resource caching

## Deployment

- **Build Command**: `yarn build:prod`
- **Output**: `dist/starter/`
- **Server**: Express server for production
- **Environment**: Environment-based configuration