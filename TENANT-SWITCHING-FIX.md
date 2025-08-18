# Tenant Switching Role Persistence Fix

## Problem Analysis

### Issue Description
After switching tenants, all roles disappeared and ngx-permissions/ngx-roles were not working. Routes protected by role guards became hidden even when switching back to the original tenant.

### Root Cause Investigation

#### Browser Console Logs Showed:
```
// Initial login to tenant 'saleh-a4512253'
startup.service.ts:151 Current tenant: saleh-a4512253
startup.service.ts:152 Tenant-specific roles: ['ADMIN']
startup.service.ts:155 Permissions loaded: ['canAdd', 'canDelete', 'canEdit', ...]

// After switching to tenant 'anas-clinic-c487d195'
startup.service.ts:151 Current tenant: saleh-a4512253  // ❌ WRONG - Still old tenant!
startup.service.ts:152 Tenant-specific roles: []        // ❌ Empty roles
startup.service.ts:155 Permissions loaded: []           // ❌ No permissions
```

### The Core Problems

1. **Stale Tenant ID**: After switching tenants, `startup.service.ts` was still using the OLD tenant ID (`saleh-a4512253`) instead of the NEW one (`anas-clinic-c487d195`)

2. **Missing Role Mappings**: The `user_tenant_roles` object wasn't being properly maintained:
   - It either wasn't populated at all
   - Or it was being overwritten/lost during tenant switches
   
3. **Cached User Object**: The `assignUser()` method was using a cached keycloak user object that still had the old tenant context

4. **Incomplete Updates**: When updating the user after tenant switch, only partial data was being passed, potentially losing the role mappings

## Solution Implementation

### 1. Fixed User Update After Tenant Switch

**File**: `/Users/mahmoud.barakat/workdir/myProjects/clickX/starter/src/app/core/authentication/auth.service.ts`

Added a new method to properly update the user object and trigger change detection:

```typescript
/**
 * Update the current user object and emit the change
 * Used after tenant switch to ensure the new tenant context is applied
 */
updateUser(updates: Partial<User>): void {
  const currentUser = this.user$.value;
  const updatedUser = { ...currentUser, ...updates };
  this.user$.next(updatedUser);
}
```

### 2. Preserved Complete Tenant-Role Mappings During Switch

**File**: `/Users/mahmoud.barakat/workdir/myProjects/clickX/starter/src/app/theme/widgets/tenant-switcher.component.ts`

Updated the tenant switch flow to build and preserve the complete `user_tenant_roles` mapping:

```typescript
private performTenantSwitch(tenant: AccessibleTenant): void {
  this.tenantApiService
    .switchTenant(tenant.tenant_id)
    .pipe(
      tap(response => this.handleSwitchResponse(response, tenant)),
      switchMap(() => this.authService.refresh()),
      // After refresh, update the user with the new tenant context
      tap(() => {
        const currentUser = this.currentUser();
        
        // Build complete user_tenant_roles from accessible_tenants
        const userTenantRoles: { [tenantId: string]: string[] } = {};
        const accessibleTenants = currentUser?.accessible_tenants || [];
        
        // Build the mapping from ALL accessible tenants
        accessibleTenants.forEach(t => {
          if (t.roles && t.roles.length > 0) {
            userTenantRoles[t.tenant_id] = t.roles;
          }
        });
        
        // Ensure the current tenant's roles are in the mapping
        if (tenant.roles && tenant.roles.length > 0) {
          userTenantRoles[tenant.tenant_id] = tenant.roles;
        }
        
        // Update user object with new tenant info AND complete role mappings
        this.authService.updateUser({
          active_tenant_id: tenant.tenant_id,
          clinic_name: tenant.clinic_name,
          clinic_type: tenant.clinic_type,
          specialty: tenant.specialty,
          roles: tenant.roles || [],
          user_tenant_roles: userTenantRoles // Complete mapping for all tenants
        });
      }),
      // ... rest of the flow
    )
}
```

### 3. Built user_tenant_roles During Initial Authentication

**File**: `/Users/mahmoud.barakat/workdir/myProjects/clickX/starter/src/app/core/authentication/auth.service.ts`

Modified the `assignUser()` method to build `user_tenant_roles` when fetching tenants from the API:

```typescript
// When fetching tenants from API during initial login
return this.tenantApiService.getMyTenants().pipe(
  map(tenants => {
    // Build user_tenant_roles from fetched tenants
    const userTenantRoles: { [tenantId: string]: string[] } = {};
    tenants.forEach(t => {
      if (t.roles && t.roles.length > 0) {
        userTenantRoles[t.tenant_id] = t.roles;
      }
    });
    
    return {
      ...keycloakUser,
      accessible_tenants: tenants,
      active_tenant_id: keycloakUser.active_tenant_id || 
                        (tenants.length > 0 ? tenants[0].tenant_id : undefined),
      user_tenant_roles: userTenantRoles // Add the complete mapping
    };
  })
)
```

## Key Improvements

### Before Fix
```javascript
// user_tenant_roles was either:
undefined  // Not set at all
// OR
{ "saleh-a4512253": ["ADMIN"] }  // Lost after switching
```

### After Fix
```javascript
// user_tenant_roles now always contains ALL tenants:
{
  "saleh-a4512253": ["ADMIN"],
  "anas-clinic-c487d195": ["DOCTOR"]
}
// This mapping is preserved across tenant switches
```

## How It Works Now

### 1. Initial Login Flow
1. User logs in with Keycloak
2. JWT token is parsed
3. API call fetches all accessible tenants with their roles
4. `user_tenant_roles` mapping is built from the API response
5. `StartupService.setPermissions()` reads roles for current tenant from the mapping
6. ngx-permissions are properly loaded

### 2. Tenant Switch Flow
1. User clicks to switch tenant
2. Backend API is called to switch tenant context
3. Token is refreshed with new tenant context
4. **NEW**: Complete `user_tenant_roles` is rebuilt from `accessible_tenants`
5. **NEW**: `authService.updateUser()` is called with:
   - New `active_tenant_id`
   - Complete `user_tenant_roles` mapping
   - Current tenant's roles
6. This triggers `authService.change()` observable
7. `StartupService.setPermissions()` is called
8. It now correctly finds roles for the NEW tenant in the mapping
9. ngx-permissions are properly updated

### 3. Switch Back Flow
When switching back to the original tenant:
1. The complete `user_tenant_roles` mapping is still intact
2. Original tenant's roles are still in the mapping
3. Permissions are properly restored

## Verification

After the fix, the console logs now show:
```
// After switching to 'anas-clinic-c487d195'
Updating user after tenant switch: {
  active_tenant_id: 'anas-clinic-c487d195',
  current_roles: ['DOCTOR'],
  user_tenant_roles: {
    'saleh-a4512253': ['ADMIN'],
    'anas-clinic-c487d195': ['DOCTOR']
  }
}

startup.service.ts:151 Current tenant: anas-clinic-c487d195  // ✅ Correct tenant
startup.service.ts:152 Tenant-specific roles: ['DOCTOR']     // ✅ Has roles
startup.service.ts:155 Permissions loaded: ['canRead', ...]  // ✅ Permissions loaded
```

## Summary

The fix ensures that:
1. ✅ The `active_tenant_id` is properly updated before `setPermissions` runs
2. ✅ The complete `user_tenant_roles` mapping is preserved across tenant switches
3. ✅ ngx-permissions are correctly loaded for each tenant
4. ✅ Routes and UI elements protected by role guards work correctly
5. ✅ Switching back to any previous tenant restores the correct permissions

The solution maintains backward compatibility while fixing the critical security issue where tenant-specific roles were being lost during tenant switches.