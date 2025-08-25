# Patient Financial & Treatment Management - Implementation Plan

## Overview
Comprehensive implementation of treatment, payment, and invoicing functionality for the patient module following Angular 18 best practices with signal-based architecture and Material Design 3 theming.

## Architecture Principles
- **Signal-based state management** using Angular 18 signals
- **Standalone components** with OnPush change detection
- **Reactive forms** with comprehensive validation
- **Dark/Light theme support** using CSS variables from medical-theme.scss
- **Role-based access control** with permission guards
- **Responsive design** with mobile-first approach
- **Accessibility** with ARIA labels and keyboard navigation

## Component Structure

### 1. Treatment Management

#### Components
```
patient-treatments/
├── treatment-list/
│   ├── treatment-list.component.ts
│   ├── treatment-list.component.html
│   └── treatment-list.component.scss
├── treatment-details/
│   ├── treatment-details.component.ts
│   └── treatment-details.component.html
├── treatment-timeline/
│   ├── treatment-timeline.component.ts
│   └── treatment-timeline.component.html
└── dialogs/
    ├── treatment-create-dialog/
    ├── treatment-edit-dialog/
    └── treatment-materials-dialog/
```

#### Features
- Treatment history timeline view
- Tooth chart integration
- Material tracking
- Cost calculation
- Status management (PLANNED, IN_PROGRESS, COMPLETED, CANCELLED)
- Treatment notes with rich text editor

### 2. Payment Management

#### Components
```
patient-payments/
├── payment-list/
│   ├── payment-list.component.ts
│   └── payment-list.component.html
├── payment-summary/
│   ├── payment-summary.component.ts
│   └── payment-summary.component.html
├── credit-balance/
│   ├── credit-balance.component.ts
│   └── credit-balance.component.html
└── dialogs/
    ├── payment-create-dialog/
    ├── payment-refund-dialog/
    └── advance-payment-dialog/
```

#### Features
- Multiple payment methods (CASH, CARD, BANK_TRANSFER, INSURANCE)
- Partial payments
- Advance payments/credits
- Refund processing
- Payment receipt generation
- Payment history with filters

### 3. Invoice Management

#### Components
```
patient-invoices/
├── invoice-list/
│   ├── invoice-list.component.ts
│   └── invoice-list.component.html
├── invoice-details/
│   ├── invoice-details.component.ts
│   └── invoice-details.component.html
├── invoice-preview/
│   ├── invoice-preview.component.ts
│   └── invoice-preview.component.html
└── dialogs/
    ├── invoice-create-dialog/
    ├── invoice-edit-dialog/
    └── invoice-payment-dialog/
```

#### Features
- Auto-generated invoice numbers
- Line items with treatments
- Tax calculation
- Discount application
- Invoice status tracking
- PDF generation
- Email sending

### 4. Financial Dashboard

#### Components
```
patient-financial/
├── financial-dashboard/
│   ├── financial-dashboard.component.ts
│   └── financial-dashboard.component.html
├── balance-card/
├── payment-chart/
├── outstanding-invoices/
└── financial-summary/
```

## Shared Components & Services

### Dialogs
```typescript
// Base dialog with theme support
export abstract class BaseFinancialDialog<T> {
  protected readonly theme = signal<'light' | 'dark'>('light');
  abstract save(): void;
  abstract cancel(): void;
}
```

### Services
```typescript
// Financial calculations service
@Injectable({ providedIn: 'root' })
export class FinancialCalculationService {
  calculateTax(amount: number, rate: number): number
  calculateDiscount(amount: number, discount: DiscountType): number
  calculateBalance(invoices: Invoice[], payments: Payment[]): number
}

// PDF generation service
@Injectable({ providedIn: 'root' })
export class PdfGenerationService {
  generateInvoicePdf(invoice: Invoice): Observable<Blob>
  generateReceiptPdf(payment: Payment): Observable<Blob>
  generateStatement(patient: Patient, dateRange: DateRange): Observable<Blob>
}
```

### Directives
```typescript
// Currency input formatter
@Directive({
  selector: '[appCurrencyInput]',
  standalone: true
})
export class CurrencyInputDirective {}

// Permission-based visibility
@Directive({
  selector: '[appFinancialPermission]',
  standalone: true
})
export class FinancialPermissionDirective {}
```

### Pipes
```typescript
// Currency formatting with locale support
@Pipe({ name: 'medicalCurrency', standalone: true })
export class MedicalCurrencyPipe {}

// Invoice status badge
@Pipe({ name: 'invoiceStatus', standalone: true })
export class InvoiceStatusPipe {}

// Payment method icon
@Pipe({ name: 'paymentMethodIcon', standalone: true })
export class PaymentMethodIconPipe {}
```

## Theming Implementation

### Color Scheme Usage
```scss
// Component-specific theming
.treatment-card {
  background: var(--med-surface-white);
  border-left: 4px solid var(--med-primary-dark);
  
  &.urgent {
    border-left-color: var(--med-urgent);
  }
  
  &.completed {
    border-left-color: var(--med-success);
  }
}

.invoice-status {
  &.paid {
    background: var(--med-success);
    color: var(--med-text-on-dark);
  }
  
  &.overdue {
    background: var(--med-error);
    color: var(--med-text-on-dark);
  }
}

// Dark mode support
.theme-dark {
  .treatment-card {
    background: var(--med-surface-light);
  }
}
```

### Component Theme Mixin
```scss
@mixin financial-component-theme($theme) {
  .financial-dashboard {
    @include mat.elevation(2);
    padding: 24px;
    border-radius: 8px;
  }
}
```

## State Management

### Signal-based State
```typescript
// Treatment state management
export class TreatmentStateService {
  private readonly treatments = signal<Treatment[]>([]);
  private readonly loading = signal(false);
  private readonly selectedTreatment = signal<Treatment | null>(null);
  
  // Computed signals
  readonly completedTreatments = computed(() => 
    this.treatments().filter(t => t.status === 'COMPLETED')
  );
  
  readonly totalCost = computed(() =>
    this.treatments().reduce((sum, t) => sum + t.cost, 0)
  );
}
```

## Routing Configuration

```typescript
export const FINANCIAL_ROUTES: Routes = [
  {
    path: 'treatments',
    component: TreatmentListComponent,
    canActivate: [authGuard],
    data: { 
      title: 'Treatments',
      breadcrumb: 'Treatments',
      permissions: ['VIEW_TREATMENTS']
    }
  },
  {
    path: 'payments',
    component: PaymentListComponent,
    canActivate: [authGuard],
    data: {
      title: 'Payments',
      breadcrumb: 'Payments',
      permissions: ['VIEW_PAYMENTS']
    }
  },
  {
    path: 'invoices',
    component: InvoiceListComponent,
    canActivate: [authGuard],
    data: {
      title: 'Invoices',
      breadcrumb: 'Invoices',
      permissions: ['VIEW_INVOICES']
    }
  },
  {
    path: 'financial',
    component: FinancialDashboardComponent,
    canActivate: [authGuard],
    data: {
      title: 'Financial Overview',
      breadcrumb: 'Financial',
      permissions: ['VIEW_FINANCIAL']
    }
  }
];
```

## Implementation Phases

### Phase 1: Core Services & Models (Day 1-2)
1. Create DTOs and models
2. Implement API services
3. Set up state management
4. Create base components

### Phase 2: Treatment Management (Day 3-4)
1. Treatment list with filtering
2. Treatment details view
3. Create/Edit dialogs
4. Material tracking

### Phase 3: Payment System (Day 5-6)
1. Payment list and history
2. Payment creation dialog
3. Advance payment handling
4. Refund processing

### Phase 4: Invoice Management (Day 7-8)
1. Invoice list with status
2. Invoice creation wizard
3. Line items management
4. PDF generation

### Phase 5: Financial Dashboard (Day 9)
1. Balance calculations
2. Charts and analytics
3. Outstanding items
4. Financial summary

### Phase 6: Integration & Testing (Day 10)
1. Component integration
2. Theme testing
3. Permission testing
4. Mobile responsiveness

## File Structure

```
starter/src/app/
├── routes/patient/
│   ├── patient-treatments/
│   ├── patient-payments/
│   ├── patient-invoices/
│   ├── patient-financial/
│   └── shared/
│       ├── dialogs/
│       ├── components/
│       └── services/
├── features/
│   ├── treatments/
│   ├── payments/
│   └── invoices/
└── shared/
    ├── directives/
    │   └── financial/
    ├── pipes/
    │   └── financial/
    └── utils/
        └── financial/
```

## Component Templates

### Treatment List Template Pattern
```html
<div class="treatment-list-container">
  <mat-toolbar class="page-toolbar">
    <h1>{{ 'treatments.title' | translate }}</h1>
    <span class="spacer"></span>
    <button mat-raised-button color="primary" (click)="createTreatment()">
      <mat-icon>add</mat-icon>
      {{ 'treatments.add_new' | translate }}
    </button>
  </mat-toolbar>

  <!-- Filters -->
  <mat-card class="filter-card">
    <mat-form-field appearance="outline">
      <mat-label>{{ 'treatments.search' | translate }}</mat-label>
      <input matInput [(ngModel)]="searchTerm" />
      <mat-icon matPrefix>search</mat-icon>
    </mat-form-field>
  </mat-card>

  <!-- Treatment Cards -->
  <div class="treatments-grid">
    @for (treatment of filteredTreatments(); track treatment.id) {
      <mat-card class="treatment-card" [class.completed]="treatment.status === 'COMPLETED'">
        <mat-card-header>
          <mat-card-title>{{ treatment.procedureName }}</mat-card-title>
          <mat-card-subtitle>{{ treatment.treatmentDate | date }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="treatment-info">
            <span class="cost">{{ treatment.cost | medicalCurrency }}</span>
            <mat-chip [class]="'status-' + treatment.status.toLowerCase()">
              {{ treatment.status | treatmentStatus }}
            </mat-chip>
          </div>
        </mat-card-content>
      </mat-card>
    }
  </div>
</div>
```

### Style Pattern
```scss
.treatment-list-container {
  padding: 24px;
  background: var(--med-surface-light);
  min-height: 100%;

  .page-toolbar {
    background: transparent;
    padding: 0;
    margin-bottom: 24px;

    h1 {
      color: var(--med-text-primary);
      font-weight: 500;
    }
  }

  .filter-card {
    margin-bottom: 24px;
    @include mat.elevation(1);
  }

  .treatments-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 16px;

    .treatment-card {
      @include mat.elevation-transition();
      cursor: pointer;

      &:hover {
        @include mat.elevation(4);
      }

      &.completed {
        opacity: 0.8;
        border-left: 4px solid var(--med-success);
      }
    }
  }
}

// Dark mode
.theme-dark {
  .treatment-list-container {
    background: var(--med-surface-variant);

    .treatment-card {
      background: var(--med-surface-light);
    }
  }
}
```

## Testing Strategy

### Unit Tests
- Service methods with mocked HTTP
- Component logic with TestBed
- Pipe transformations
- Directive behavior

### Integration Tests
- Dialog workflows
- Form submissions
- State management
- Navigation flows

### E2E Tests
- Complete payment flow
- Invoice generation
- Treatment creation
- Financial calculations

## Performance Considerations

1. **Virtual Scrolling** for large lists
2. **Lazy Loading** for routes
3. **OnPush Change Detection**
4. **Debounced Search** inputs
5. **Pagination** for data tables
6. **Memoized Calculations** with computed signals

## Accessibility Requirements

1. **ARIA Labels** on all interactive elements
2. **Keyboard Navigation** support
3. **Screen Reader** compatibility
4. **High Contrast** mode support
5. **Focus Management** in dialogs
6. **Error Announcements** for forms

## Security Considerations

1. **Input Sanitization** for all forms
2. **XSS Prevention** in templates
3. **CSRF Tokens** for mutations
4. **Permission Checks** at component level
5. **Audit Logging** for financial operations
6. **Data Encryption** for sensitive information

---

## Next Steps

1. Start with Phase 1 implementation
2. Create base services and models
3. Implement treatment management first
4. Progress through each phase systematically
5. Test each component thoroughly
6. Ensure theme consistency throughout