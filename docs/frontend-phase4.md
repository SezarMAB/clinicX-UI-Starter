# Phase 4: Frontend Updates Implementation Plan

## Overview
This document provides a detailed implementation plan for Phase 4 of the realm-per-type multi-tenant architecture. The frontend must be updated to handle the new multi-tenant capabilities, specialty-based features, and enhanced security implemented in Phases 1-3.

## Prerequisites
- Backend Phases 1-3 completed (Tenant Model Updates, Keycloak Integration, Security & Authorization)
- Frontend framework (React/Angular/Vue) with existing authentication
- Access to the updated backend APIs

## Implementation Tasks

### 1. JWT Token and Authentication Updates

#### 1.1 Update Token Parser
- **File**: `src/services/auth.service.js` (or equivalent)
- **Tasks**:
  - Parse new JWT claims: `active_tenant_id`, `accessible_tenants`, `user_tenant_roles`
  - Store parsed tenant information in application state
  - Create helper functions to extract tenant-specific data

```javascript
// Example structure to implement:
parseJwtToken(token) {
  const decoded = jwt_decode(token);
  return {
    userId: decoded.sub,
    activeTenantId: decoded.active_tenant_id,
    accessibleTenants: decoded.accessible_tenants || [],
    userTenantRoles: decoded.user_tenant_roles || {},
    specialty: decoded.specialty,
    // ... other claims
  };
}
```

#### 1.2 Update Authentication Context
- Create or update context/store to hold multi-tenant information
- Expose methods to:
  - Get current active tenant
  - Get list of accessible tenants
  - Get user role for specific tenant
  - Check if user has access to a tenant

### 2. Tenant Switching UI Component

#### 2.1 Create Tenant Switcher Component
- **Location**: `src/components/TenantSwitcher.jsx` (or equivalent)
- **Features**:
  - Dropdown/select showing accessible tenants
  - Display current active tenant
  - Show tenant specialty type icon/badge
  - Handle tenant switching action

#### 2.2 Implement Tenant Switching Logic
- **Endpoint**: `POST /api/auth/switch-tenant`
- **Request Body**: `{ "tenantId": "new-tenant-id" }`
- **Actions**:
  - Call backend to switch tenant
  - Update local storage with new token
  - Refresh application state
  - Redirect to appropriate landing page

```javascript
// Example implementation:
async switchTenant(newTenantId) {
  const response = await api.post('/api/auth/switch-tenant', { tenantId: newTenantId });
  const { token } = response.data;
  
  // Update token storage
  localStorage.setItem('auth_token', token);
  
  // Update application state
  updateAuthContext(token);
  
  // Refresh current page or redirect
  window.location.reload();
}
```

### 3. API Interceptor Updates

#### 3.1 Update HTTP Interceptor
- **File**: `src/services/api.interceptor.js` (or equivalent)
- **Tasks**:
  - Add `X-Tenant-ID` header to all requests
  - Use active tenant ID from authentication context
  - Handle 403 errors for tenant access denied

```javascript
// Example interceptor update:
axios.interceptors.request.use((config) => {
  const { activeTenantId } = getAuthContext();
  if (activeTenantId) {
    config.headers['X-Tenant-ID'] = activeTenantId;
  }
  return config;
});
```

### 4. Feature Flag System Based on Specialty

#### 4.1 Create Feature Flag Service
- **File**: `src/services/featureFlag.service.js`
- **Purpose**: Control UI elements based on tenant specialty features

```javascript
// Implementation structure:
class FeatureFlagService {
  constructor() {
    this.specialtyFeatures = {
      'CLINIC': ['ALL'],
      'DENTAL': ['DENTAL', 'APPOINTMENTS'],
      'APPOINTMENTS': ['APPOINTMENTS']
    };
  }
  
  hasFeature(featureCode) {
    const { specialty } = getCurrentTenant();
    const features = this.specialtyFeatures[specialty] || [];
    return features.includes('ALL') || features.includes(featureCode);
  }
}
```

#### 4.2 Create Feature Flag Component
- **File**: `src/components/FeatureFlag.jsx`
- **Usage**: Conditionally render components based on features

```jsx
// Example component:
<FeatureFlag feature="DENTAL">
  <DentalChartComponent />
</FeatureFlag>
```

### 5. Update Navigation and Routing

#### 5.1 Modify Main Navigation
- Update navigation menu to show/hide items based on specialty
- Add tenant switcher to header/navbar
- Show tenant name and specialty badge

#### 5.2 Update Route Guards
- **File**: `src/guards/auth.guard.js` (or equivalent)
- **Tasks**:
  - Verify tenant access before allowing route access
  - Check feature availability for specialty-specific routes
  - Redirect to appropriate page if access denied

### 6. Specialty-Specific UI Modules

#### 6.1 Dental Module Updates (if DENTAL specialty)
- Show dental-specific menu items
- Enable tooth chart component
- Show dental procedure codes
- Enable dental-specific workflows

#### 6.2 Appointments Module Updates (if APPOINTMENTS feature)
- Show appointment calendar
- Enable scheduling features
- Show appointment-specific reports

#### 6.3 Hide/Show Features Based on Specialty
- Financial module (if has financial features)
- Inventory module (if has inventory features)
- Reports (filter based on available features)

### 7. Multi-Tenant Data Handling

#### 7.1 Update Data Services
- Ensure all API calls include tenant context
- Clear cached data when switching tenants
- Update local storage keys to include tenant ID

#### 7.2 Update State Management
- If using Redux/Vuex/etc., partition state by tenant
- Clear tenant-specific state on tenant switch
- Implement tenant-aware selectors

### 8. User Profile and Settings Updates

#### 8.1 User Profile Component
- Show list of accessible tenants
- Display role for each tenant
- Show primary tenant indicator
- Allow setting preferences per tenant

#### 8.2 Tenant Settings Page
- Only show for users with admin role in current tenant
- Display tenant information and specialty
- Show tenant-specific configuration options

### 9. Error Handling and User Feedback

#### 9.1 Tenant Access Errors
- Handle 403 errors gracefully
- Show appropriate message: "You don't have access to this tenant"
- Provide option to switch to an accessible tenant

#### 9.2 Feature Access Errors
- Show message when feature not available for specialty
- Suggest upgrading or contacting support
- Hide unavailable features proactively

### 10. Testing Requirements

#### 10.1 Unit Tests
- Test JWT parsing with new claims
- Test feature flag logic
- Test tenant switching functionality
- Test API interceptor with tenant headers

#### 10.2 Integration Tests
- Test tenant switching flow end-to-end
- Test feature visibility based on specialty
- Test multi-tenant navigation
- Test error scenarios

#### 10.3 E2E Tests
- Test complete user journey with tenant switching
- Test specialty-specific workflows
- Test access control scenarios

## Implementation Order

1. **Week 1**: JWT and Authentication Updates (Tasks 1 & 3)
2. **Week 1**: Tenant Switching Component (Task 2)
3. **Week 2**: Feature Flag System (Task 4)
4. **Week 2**: Navigation and Routing Updates (Task 5)
5. **Week 3**: Specialty-Specific Modules (Task 6)
6. **Week 3**: Multi-Tenant Data Handling (Task 7)
7. **Week 4**: User Profile and Settings (Task 8)
8. **Week 4**: Error Handling (Task 9)
9. **Week 5**: Testing (Task 10)

## Key Files to Create/Modify

### New Files to Create:
- `src/components/TenantSwitcher.jsx`
- `src/services/featureFlag.service.js`
- `src/components/FeatureFlag.jsx`
- `src/contexts/TenantContext.jsx` (or equivalent)
- `src/utils/tenantUtils.js`

### Existing Files to Modify:
- `src/services/auth.service.js` - Add JWT parsing for new claims
- `src/services/api.interceptor.js` - Add X-Tenant-ID header
- `src/components/Layout/Header.jsx` - Add tenant switcher
- `src/components/Navigation/MainMenu.jsx` - Filter by features
- `src/guards/auth.guard.js` - Add tenant validation
- `src/store/auth.slice.js` (or equivalent) - Store tenant data

## API Endpoints to Integrate

1. `POST /api/auth/switch-tenant` - Switch active tenant
2. `GET /api/tenants/accessible` - Get list of accessible tenants
3. `GET /api/tenants/{tenantId}/features` - Get tenant features
4. `GET /api/specialty-types` - Get available specialties
5. `GET /api/users/me/tenants` - Get user's tenant access

## Environment Configuration

Add to frontend environment files:
```javascript
// .env.local or config.js
REACT_APP_ENABLE_MULTI_TENANT=true
REACT_APP_ENABLE_SPECIALTY_FEATURES=true
REACT_APP_DEFAULT_TENANT_ID=
```

## Success Criteria

1. Users can see and switch between their accessible tenants
2. UI adapts based on tenant specialty (CLINIC, DENTAL, APPOINTMENTS)
3. Features are shown/hidden based on specialty configuration
4. All API calls include proper tenant context
5. Tenant switching maintains user session
6. Proper error handling for access denied scenarios
7. Clean state management during tenant switches
8. Comprehensive test coverage for new features

## Notes for Implementation

- Ensure backward compatibility if single-tenant mode is still supported
- Consider performance impact of feature flag checks
- Implement proper loading states during tenant switching
- Cache tenant/specialty data appropriately
- Ensure all date/time displays consider tenant timezone
- Validate tenant access on route changes
- Clear sensitive data when switching tenants