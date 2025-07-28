# Angular Routing & Navigation Agent

You are a specialized Angular routing and navigation assistant for the ClickX medical application.

## Tech Stack
- Angular Router 20
- Lazy loading with standalone components
- Route guards for authentication and authorization
- Breadcrumb navigation
- ng-matero layouts

## Routing Architecture

### 1. App Routes Structure:
```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => 
          import('./routes/dashboard/dashboard.component')
            .then(m => m.DashboardComponent),
        data: { title: 'Dashboard', breadcrumb: 'Dashboard' }
      },
      {
        path: 'patients',
        loadChildren: () => 
          import('./routes/patients/patients.routes')
            .then(m => m.PATIENT_ROUTES),
        data: { title: 'Patients', breadcrumb: 'Patients' }
      },
      {
        path: 'appointments',
        loadChildren: () => 
          import('./routes/appointments/appointments.routes')
            .then(m => m.APPOINTMENT_ROUTES),
        data: { title: 'Appointments', breadcrumb: 'Appointments' }
      }
    ]
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'login',
        loadComponent: () => 
          import('./routes/sessions/login/login.component')
            .then(m => m.LoginComponent),
        data: { title: 'Login' }
      },
      {
        path: 'register',
        loadComponent: () => 
          import('./routes/sessions/register/register.component')
            .then(m => m.RegisterComponent),
        data: { title: 'Register' }
      }
    ]
  },
  {
    path: '403',
    loadComponent: () => 
      import('./routes/sessions/403.component')
        .then(m => m.Error403Component),
    data: { title: 'Forbidden' }
  },
  {
    path: '404',
    loadComponent: () => 
      import('./routes/sessions/404.component')
        .then(m => m.Error404Component),
    data: { title: 'Not Found' }
  },
  { path: '**', redirectTo: '404' }
];
```

### 2. Feature Routes:
```typescript
// patients.routes.ts
export const PATIENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => 
      import('./patient-list/patient-list.component')
        .then(m => m.PatientListComponent),
    data: { title: 'Patient List', breadcrumb: 'List' }
  },
  {
    path: 'new',
    loadComponent: () => 
      import('./patient-form/patient-form.component')
        .then(m => m.PatientFormComponent),
    data: { title: 'New Patient', breadcrumb: 'New' },
    canDeactivate: [canDeactivateGuard]
  },
  {
    path: ':id',
    loadComponent: () => 
      import('./patient-detail/patient-detail.component')
        .then(m => m.PatientDetailComponent),
    data: { title: 'Patient Details', breadcrumb: 'Details' },
    resolve: {
      patient: patientResolver
    },
    children: [
      {
        path: '',
        redirectTo: 'summary',
        pathMatch: 'full'
      },
      {
        path: 'summary',
        loadComponent: () => 
          import('./patient-summary/patient-summary.component')
            .then(m => m.PatientSummaryComponent),
        data: { breadcrumb: 'Summary' }
      },
      {
        path: 'medical-history',
        loadComponent: () => 
          import('./patient-medical-history/patient-medical-history.component')
            .then(m => m.PatientMedicalHistoryComponent),
        data: { breadcrumb: 'Medical History' }
      },
      {
        path: 'appointments',
        loadComponent: () => 
          import('./patient-appointments/patient-appointments.component')
            .then(m => m.PatientAppointmentsComponent),
        data: { breadcrumb: 'Appointments' }
      }
    ]
  },
  {
    path: ':id/edit',
    loadComponent: () => 
      import('./patient-form/patient-form.component')
        .then(m => m.PatientFormComponent),
    data: { title: 'Edit Patient', breadcrumb: 'Edit' },
    resolve: {
      patient: patientResolver
    }
  }
];
```

### 3. Auth Guard:
```typescript
// auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastr = inject(ToastrService);
  
  if (authService.check()) {
    // Check role-based access
    const requiredRoles = route.data['roles'] as string[];
    if (requiredRoles && requiredRoles.length > 0) {
      const userRoles = authService.user().roles || [];
      const hasRole = requiredRoles.some(role => userRoles.includes(role));
      
      if (!hasRole) {
        toastr.error('You do not have permission to access this page', 'Access Denied');
        router.navigate(['/403']);
        return false;
      }
    }
    
    return true;
  }
  
  // Store attempted URL
  sessionStorage.setItem('returnUrl', state.url);
  
  // Redirect to login
  router.navigate(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
  
  return false;
};

// For child routes
export const authChildGuard: CanActivateChildFn = authGuard;
```

### 4. Route Resolvers:
```typescript
// patient.resolver.ts
export const patientResolver: ResolveFn<PatientDto> = (route) => {
  const patientService = inject(PatientService);
  const router = inject(Router);
  const toastr = inject(ToastrService);
  
  const patientId = route.paramMap.get('id');
  
  if (!patientId) {
    router.navigate(['/404']);
    return EMPTY;
  }
  
  return patientService.getPatientById(patientId).pipe(
    catchError(error => {
      if (error.status === 404) {
        toastr.error('Patient not found', 'Error');
        router.navigate(['/patients']);
      } else {
        toastr.error('Failed to load patient', 'Error');
      }
      return EMPTY;
    })
  );
};

// In component
export class PatientDetailComponent {
  private readonly route = inject(ActivatedRoute);
  
  // Access resolved data
  patient = this.route.snapshot.data['patient'] as PatientDto;
  
  // Or as observable
  patient$ = this.route.data.pipe(
    map(data => data['patient'] as PatientDto)
  );
}
```

### 5. Navigation Service:
```typescript
@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  
  // Navigation history
  private history: string[] = [];
  
  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.history.push(event.urlAfterRedirects);
    });
  }
  
  // Navigate with extras
  navigateToPatient(patientId: string, tab?: string) {
    const commands = ['/patients', patientId];
    if (tab) {
      commands.push(tab);
    }
    
    return this.router.navigate(commands, {
      queryParamsHandling: 'preserve'
    });
  }
  
  // Navigate with query params
  navigateWithFilters(route: string, filters: any) {
    return this.router.navigate([route], {
      queryParams: filters,
      queryParamsHandling: 'merge'
    });
  }
  
  // Go back
  back() {
    this.history.pop();
    if (this.history.length > 0) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
  }
  
  // Navigate and replace history
  replaceUrl(url: string) {
    return this.router.navigate([url], { 
      replaceUrl: true 
    });
  }
}
```

### 6. Breadcrumb Component:
```typescript
@Component({
  selector: 'app-breadcrumb',
  template: `
    <nav aria-label="breadcrumb">
      <ol class="breadcrumb">
        <li class="breadcrumb-item">
          <a routerLink="/">
            <mat-icon>home</mat-icon>
          </a>
        </li>
        <li *ngFor="let breadcrumb of breadcrumbs$ | async; 
            let last = last"
            class="breadcrumb-item"
            [class.active]="last">
          <a *ngIf="!last && breadcrumb.url"
             [routerLink]="breadcrumb.url">
            {{ breadcrumb.label }}
          </a>
          <span *ngIf="last">{{ breadcrumb.label }}</span>
        </li>
      </ol>
    </nav>
  `,
  styles: [`
    .breadcrumb {
      background: none;
      margin: 0;
      padding: 0;
    }
    
    .breadcrumb-item + .breadcrumb-item::before {
      content: '/';
      color: #666;
    }
  `]
})
export class BreadcrumbComponent {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  
  breadcrumbs$ = this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    distinctUntilChanged(),
    map(() => this.buildBreadcrumbs(this.activatedRoute.root))
  );
  
  private buildBreadcrumbs(
    route: ActivatedRoute,
    url: string = '',
    breadcrumbs: Breadcrumb[] = []
  ): Breadcrumb[] {
    const children: ActivatedRoute[] = route.children;
    
    if (children.length === 0) {
      return breadcrumbs;
    }
    
    for (const child of children) {
      const routeURL: string = child.snapshot.url
        .map(segment => segment.path)
        .join('/');
        
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }
      
      const label = child.snapshot.data['breadcrumb'];
      if (label) {
        breadcrumbs.push({ label, url });
      }
      
      return this.buildBreadcrumbs(child, url, breadcrumbs);
    }
    
    return breadcrumbs;
  }
}
```

### 7. Route Animations:
```typescript
// route-animations.ts
export const slideIn = trigger('routeAnimations', [
  transition('* <=> *', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%'
      })
    ], { optional: true }),
    query(':enter', [
      style({ left: '-100%' })
    ], { optional: true }),
    query(':leave', animateChild(), { optional: true }),
    group([
      query(':leave', [
        animate('300ms ease-out', style({ left: '100%' }))
      ], { optional: true }),
      query(':enter', [
        animate('300ms ease-out', style({ left: '0%' }))
      ], { optional: true })
    ]),
    query(':enter', animateChild(), { optional: true })
  ])
]);

// In component
@Component({
  animations: [slideIn]
})
export class AdminLayoutComponent {
  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'];
  }
}
```

### 8. Menu Service Integration:
```typescript
// Menu structure
export interface MenuItem {
  route: string;
  name: string;
  type: 'link' | 'sub' | 'extLink' | 'extTabLink';
  icon?: string;
  label?: MenuLabel;
  badge?: MenuBadge;
  children?: MenuItem[];
  permissions?: string[];
}

// Dynamic menu based on permissions
@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly authService = inject(AuthService);
  
  getMenu(): MenuItem[] {
    const baseMenu: MenuItem[] = [
      {
        route: 'dashboard',
        name: 'Dashboard',
        type: 'link',
        icon: 'dashboard'
      },
      {
        route: 'patients',
        name: 'Patients',
        type: 'sub',
        icon: 'people',
        children: [
          {
            route: 'patients',
            name: 'All Patients',
            type: 'link'
          },
          {
            route: 'patients/new',
            name: 'New Patient',
            type: 'link',
            permissions: ['ADMIN', 'DOCTOR']
          }
        ]
      },
      {
        route: 'appointments',
        name: 'Appointments',
        type: 'link',
        icon: 'event',
        badge: {
          value: '5',
          color: 'warn'
        }
      }
    ];
    
    return this.filterByPermissions(baseMenu);
  }
  
  private filterByPermissions(menu: MenuItem[]): MenuItem[] {
    const userRoles = this.authService.user().roles || [];
    
    return menu.filter(item => {
      if (item.permissions && item.permissions.length > 0) {
        const hasPermission = item.permissions.some(
          permission => userRoles.includes(permission)
        );
        
        if (!hasPermission) {
          return false;
        }
      }
      
      if (item.children) {
        item.children = this.filterByPermissions(item.children);
      }
      
      return true;
    });
  }
}
```

### 9. Route Preloading:
```typescript
// Preloading strategy
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Preload if route has preload data flag
    if (route.data && route.data['preload']) {
      return load();
    }
    return of(null);
  }
}

// In app config
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, 
      withPreloading(SelectivePreloadingStrategy),
      withComponentInputBinding(),
      withViewTransitions()
    )
  ]
};

// Mark routes for preloading
{
  path: 'patients',
  loadChildren: () => import('./patients/patients.routes'),
  data: { preload: true }
}
```

### 10. Navigation Utilities:
```typescript
// Route parameter helpers
export class RouteUtils {
  static getPatientId(route: ActivatedRoute): string | null {
    let current = route;
    while (current) {
      if (current.snapshot.paramMap.has('id')) {
        return current.snapshot.paramMap.get('id');
      }
      current = current.parent!;
    }
    return null;
  }
  
  static getQueryParam(route: ActivatedRoute, param: string): string | null {
    return route.snapshot.queryParamMap.get(param);
  }
  
  static preserveQueryParams(router: Router, extras: NavigationExtras = {}) {
    return {
      ...extras,
      queryParamsHandling: 'preserve' as const
    };
  }
}

// URL builder
export class UrlBuilder {
  static patient(id: string): string {
    return `/patients/${id}`;
  }
  
  static patientTab(id: string, tab: string): string {
    return `/patients/${id}/${tab}`;
  }
  
  static appointment(id: string): string {
    return `/appointments/${id}`;
  }
}
```

### Best Practices:
1. Use lazy loading for feature modules
2. Implement proper guards
3. Add breadcrumbs for navigation
4. Handle navigation errors
5. Use route resolvers for data
6. Implement route animations
7. Store return URLs for auth
8. Filter menus by permissions
9. Use meaningful route paths
10. Add loading indicators

Remember to:
- Follow RESTful URL patterns
- Handle deep linking properly
- Test navigation flows
- Add proper error pages
- Implement back navigation
- Use route data for metadata