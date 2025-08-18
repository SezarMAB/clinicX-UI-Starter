# Route Guard Migration Guide

## Overview
This guide helps you migrate from the old role-checking system to the new tenant-aware security model.

## Key Changes

### 1. StartupService Updated ✅
- Now loads roles from `user_tenant_roles[currentTenant]` instead of `realm_access.roles`
- Only GLOBAL_* prefixed roles from realm_access are honored
- ngx-permissions now works with tenant-specific roles

### 2. Guard Migration Options

You have two options for protecting routes:

#### Option A: Continue Using ngx-permissions (Recommended for existing code)
The StartupService has been updated to load tenant-specific roles into ngx-permissions, so existing guards will automatically work with tenant context:

```typescript
// This will now check tenant-specific roles automatically
{
  path: 'admin',
  canActivate: [authGuard, ngxPermissionsGuard],
  data: {
    permissions: {
      only: ['ADMIN'],  // Checks if user has ADMIN in current tenant
      redirectTo: '/dashboard'
    }
  }
}
```

#### Option B: Use New Tenant-Aware Guards (Recommended for new code)
For more explicit control and better error messages:

```typescript
import { tenantRoleGuard, globalRoleGuard, combinedRoleGuard } from '@core/authentication';

// Tenant-specific role check
{
  path: 'admin',
  canActivate: [tenantRoleGuard(['ADMIN', 'MANAGER'])],
  component: AdminComponent
}

// Global role check (system-wide)
{
  path: 'system-settings',
  canActivate: [globalRoleGuard(['GLOBAL_ADMIN'])],
  component: SystemSettingsComponent
}

// Combined check (tenant OR global)
{
  path: 'support',
  canActivate: [combinedRoleGuard(['ADMIN'], ['GLOBAL_SUPPORT'])],
  component: SupportComponent
}
```

## Migration Examples

### Example 1: Patient Routes (Current)
```typescript
// BEFORE - patient.routes.ts
{
  path: 'list',
  component: PatientListComponent,
  canActivate: [authGuard, ngxPermissionsGuard],
  data: {
    permissions: {
      only: ['ADMIN', 'MANAGER', 'DOCTOR', 'NURSE', 'SUPER_ADMIN'],
      redirectTo: '/dashboard'
    }
  }
}
```

### Option A: Keep ngx-permissions (No code change needed)
```typescript
// Works as-is because StartupService now loads tenant-specific roles
// The same code will now check roles in the current tenant context
```

### Option B: Migrate to Tenant-Aware Guards
```typescript
// AFTER - Using new tenant-aware guards
import { tenantRoleGuard } from '@core/authentication';

{
  path: 'list',
  component: PatientListComponent,
  canActivate: [tenantRoleGuard(['ADMIN', 'MANAGER', 'DOCTOR', 'NURSE', 'SUPER_ADMIN'])],
  data: {
    title: 'Patient List'
  }
}
```

## Component Migration

### Checking Roles in Components

#### Old Way (Still works but deprecated)
```typescript
constructor(private auth: AuthService) {}

checkAccess() {
  this.auth.user().subscribe(user => {
    if (user.realm_access?.roles?.includes('ADMIN')) {  // INSECURE
      // admin logic
    }
  });
}
```

#### New Way (Recommended)
```typescript
import { RoleService } from '@core/authentication';

constructor(private roleService: RoleService) {}

checkAccess() {
  this.roleService.hasRole('ADMIN').subscribe(isAdmin => {
    if (isAdmin) {  // Checks ADMIN in current tenant
      // admin logic
    }
  });
}

// Or use convenience methods
isAdmin$ = this.roleService.isAdmin();
isDoctor$ = this.roleService.isDoctor();
hasGlobalSupport$ = this.roleService.hasGlobalSupport();
```

### Template Migration

#### Old Way
```html
<!-- Using ngx-permissions (still works) -->
<button *ngxPermissionsOnly="['ADMIN']">Admin Button</button>
```

#### New Way (More explicit)
```html
<!-- Using RoleService -->
<button *ngIf="roleService.hasRole('ADMIN') | async">Admin Button</button>

<!-- Or with ngx-permissions (automatically tenant-aware now) -->
<button *ngxPermissionsOnly="['ADMIN']">Admin Button</button>
```

## Security Checklist

- [ ] StartupService updated to use tenant-specific roles ✅
- [ ] No direct usage of `user.realm_access.roles` except for GLOBAL_* roles
- [ ] No usage of `user.resource_access` for authorization
- [ ] All role checks use either:
  - ngx-permissions (automatically tenant-aware now)
  - New tenant-aware guards
  - RoleService methods
- [ ] Console warnings appear for deprecated realm roles

## Testing Your Migration

1. **Check Console Logs**: After login, you should see:
   ```
   Current tenant: tenant-123
   Tenant-specific roles: ['ADMIN', 'DOCTOR']
   Global roles: ['GLOBAL_SUPPORT']
   ```

2. **Test Cross-Tenant Access**: 
   - User with ADMIN in tenant-a should NOT have admin access in tenant-b
   - User with GLOBAL_SUPPORT should have support access in all tenants

3. **Verify ngx-permissions**: 
   - The `NgxPermissionsService` should only contain tenant-specific roles
   - Check with: `this.permissionsService.getPermissions()`

## Gradual Migration Strategy

1. **Phase 1** (Immediate): StartupService updated ✅
   - Existing ngx-permissions guards work with tenant context
   - No immediate code changes required

2. **Phase 2** (As needed): Update critical routes
   - Admin panels
   - Sensitive data access
   - Financial operations

3. **Phase 3** (Ongoing): Update remaining routes
   - Gradually replace with tenant-aware guards
   - Update components to use RoleService

## Common Pitfalls

1. **Don't Mix Old and New**: Avoid using `realm_access.roles` directly
2. **Global Roles**: Remember GLOBAL_* roles need globalRoleGuard
3. **Tenant Context**: Ensure tenant is set before role checks
4. **Testing**: Test with users having different roles in different tenants

## Need Help?

- Check `RoleService.debugRoles()` for current role state
- Look for console warnings about deprecated usage
- Review ANGULAR-AUTH-IMPLEMENTATION-SUMMARY.md for details