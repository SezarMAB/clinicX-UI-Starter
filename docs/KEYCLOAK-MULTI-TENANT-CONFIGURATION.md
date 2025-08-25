# Keycloak 26 Multi-Tenant Configuration Guide

## Overview

This guide provides detailed instructions for configuring Keycloak 26 to support multi-tenant functionality in the ClickX medical application, enabling users to switch between different tenants (clinics) they have access to.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [User Attributes Configuration](#user-attributes-configuration)
3. [Protocol Mappers](#protocol-mappers)
4. [Client Configuration](#client-configuration)
5. [Backend Integration](#backend-integration)
6. [User Management](#user-management)
7. [Testing Guide](#testing-guide)
8. [Troubleshooting](#troubleshooting)

## Architecture Overview

### Multi-Tenant Model
- **One Realm Per Tenant**: Each clinic gets its own Keycloak realm (e.g., `clinic-smile-dental`)
- **Tenant Identification**: Based on subdomain (e.g., `smile-dental.clinicx.com`)
- **Cross-Tenant Access**: Users can have access to multiple tenants with different roles

### Key Components
```
┌─────────────────────────────────────────────────────────────┐
│                        Keycloak Server                        │
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ Realm:          │  │ Realm:          │  │ Realm:      │ │
│  │ clinic-smile-   │  │ clinic-happy-   │  │ clinic-xyz  │ │
│  │ dental          │  │ teeth           │  │             │ │
│  │                 │  │                 │  │             │ │
│  │ Users ────────┐ │  │ Users ────────┐ │  │ Users       │ │
│  │ Clients       │ │  │ Clients       │ │  │ Clients     │ │
│  │ Mappers       │ │  │ Mappers       │ │  │ Mappers     │ │
│  └────────────────┘ │  └────────────────┘ │  └─────────────┘ │
│                     │                     │                   │
│                     └──────────┬──────────┘                   │
│                                │                              │
│                      Shared User Attributes                   │
│                      for Multi-Tenant Access                  │
└─────────────────────────────────────────────────────────────┘
```

## User Attributes Configuration

### Configuring User Profile in Keycloak 26

In Keycloak 26, user attributes must first be defined in the User Profile configuration before they can be used.

#### Step 1: Define Attributes in User Profile

1. Navigate to Keycloak Admin Console
2. Select the appropriate realm
3. Go to **Realm settings** → **User profile** tab
4. Click **Create attribute** for each required attribute

### Required User Attributes

Create the following attributes in the User Profile:

| Attribute | Display Name | Type | Required | Description |
|-----------|--------------|------|----------|-------------|
| `tenant_id` | Tenant ID | String | Yes | Primary tenant ID |
| `clinic_name` | Clinic Name | String | Yes | Primary clinic name |
| `clinic_type` | Clinic Type | String | Yes | Primary clinic type/specialty |
| `active_tenant_id` | Active Tenant ID | String | Yes | Currently active tenant |
| `accessible_tenants` | Accessible Tenants | String | No | JSON list of accessible tenants |
| `user_tenant_roles` | User Tenant Roles | String | No | JSON roles per tenant |

#### Attribute Configuration Example

For each attribute, configure as follows:

```yaml
Name: tenant_id
Display name: Tenant ID
Required field: ON
Enabled when: Always
Required when: Always
Permissions:
  - Who can edit: admin
  - Who can view: admin, user
Validations: (optional)
  - Length: min 1, max 255
Annotations: (optional)
  - inputType: text
```

#### Step 2: Configure JSON Attributes

For JSON string attributes (`accessible_tenants` and `user_tenant_roles`):

```yaml
Name: accessible_tenants
Display name: Accessible Tenants
Required field: OFF
Enabled when: Always
Permissions:
  - Who can edit: admin
  - Who can view: admin, user
Validations:
  - Length: max 4000
Annotations:
  - inputType: textarea
  - inputHelperTextBefore: JSON array of accessible tenants
```

### Example User Attributes Values

After configuring the User Profile, set these values for users:

```json
{
  "tenant_id": "smile-dental-123",
  "clinic_name": "Smile Dental Clinic",
  "clinic_type": "DENTAL",
  "active_tenant_id": "smile-dental-123",
  "accessible_tenants": "[{\"tenant_id\":\"smile-dental-123\",\"clinic_name\":\"Smile Dental\",\"clinic_type\":\"DENTAL\",\"specialty\":\"DENTAL\",\"roles\":[\"ADMIN\"]},{\"tenant_id\":\"happy-teeth-456\",\"clinic_name\":\"Happy Teeth\",\"clinic_type\":\"DENTAL\",\"specialty\":\"DENTAL\",\"roles\":[\"DOCTOR\"]}]",
  "user_tenant_roles": "{\"smile-dental-123\":[\"ADMIN\",\"DOCTOR\"],\"happy-teeth-456\":[\"DOCTOR\"]}"
}
```

### Setting User Attributes via Admin Console

1. Navigate to Keycloak Admin Console
2. Select the appropriate realm
3. Go to **Users** → Select a user
4. In the user details, you'll now see the custom attributes defined in User Profile
5. Fill in the values for each attribute
6. Click **Save**

### Alternative: Setting Attributes via User Registration

To include these attributes in user registration forms:

1. In **User Profile** configuration, set:
   - **Required when**: User creation
   - **Who can edit**: admin, user
2. The attributes will appear in the registration form
3. Configure visibility and validation as needed

### Programmatic User Profile Configuration (Keycloak 26)

You can also configure the User Profile programmatically via REST API:

```bash
# Get current user profile configuration
curl -X GET "http://localhost:18081/admin/realms/{realm}/users/profile" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Update user profile with custom attributes
curl -X PUT "http://localhost:18081/admin/realms/{realm}/users/profile" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attributes": [
      {
        "name": "tenant_id",
        "displayName": "Tenant ID",
        "required": {
          "roles": ["admin"],
          "scopes": []
        },
        "permissions": {
          "view": ["admin", "user"],
          "edit": ["admin"]
        },
        "validations": {
          "length": {
            "min": 1,
            "max": 255
          }
        }
      },
      {
        "name": "accessible_tenants",
        "displayName": "Accessible Tenants",
        "required": null,
        "permissions": {
          "view": ["admin", "user"],
          "edit": ["admin"]
        },
        "validations": {
          "length": {
            "max": 4000
          }
        },
        "annotations": {
          "inputType": "textarea"
        }
      }
    ]
  }'
```

## Protocol Mappers

Protocol mappers are required to include user attributes in JWT tokens. Create these mappers for the `clinicx-frontend` client in each realm.

### 1. Tenant ID Mapper

```yaml
Name: tenant_id
Mapper Type: User Attribute
User Attribute: tenant_id
Token Claim Name: tenant_id
Claim JSON Type: String
Add to ID token: ✓
Add to access token: ✓
Add to userinfo: ✓
```

### 2. Active Tenant ID Mapper

```yaml
Name: active_tenant_id
Mapper Type: User Attribute
User Attribute: active_tenant_id
Token Claim Name: active_tenant_id
Claim JSON Type: String
Add to ID token: ✗
Add to access token: ✓
Add to userinfo: ✓
```

### 3. Accessible Tenants Mapper

```yaml
Name: accessible_tenants
Mapper Type: User Attribute
User Attribute: accessible_tenants
Token Claim Name: accessible_tenants
Claim JSON Type: JSON
Add to ID token: ✗
Add to access token: ✓
Add to userinfo: ✓
```

### 4. Specialty Mapper

```yaml
Name: specialty
Mapper Type: User Attribute
User Attribute: clinic_type
Token Claim Name: specialty
Claim JSON Type: String
Add to ID token: ✗
Add to access token: ✓
Add to userinfo: ✓
```

### 5. User Tenant Roles Mapper

```yaml
Name: user_tenant_roles
Mapper Type: User Attribute
User Attribute: user_tenant_roles
Token Claim Name: user_tenant_roles
Claim JSON Type: JSON
Add to ID token: ✗
Add to access token: ✓
Add to userinfo: ✓
```

### 6. Clinic Name Mapper

```yaml
Name: clinic_name
Mapper Type: User Attribute
User Attribute: clinic_name
Token Claim Name: clinic_name
Claim JSON Type: String
Add to ID token: ✓
Add to access token: ✓
Add to userinfo: ✓
```

### Creating Mappers via Admin Console

1. Navigate to realm → Clients → `clinicx-frontend`
2. Go to "Client scopes" tab
3. Click on the dedicated scope (usually named after the client)
4. Go to "Mappers" tab
5. Click "Add mapper" → "By configuration"
6. Select "User Attribute" and configure as above
7. Save each mapper

## Client Configuration

### Frontend Client (`clinicx-frontend`)

Configure the public client for frontend authentication:

```yaml
Client ID: clinicx-frontend
Enabled: ON
Client Protocol: openid-connect
Access Type: public
Standard Flow Enabled: ✓
Direct Access Grants Enabled: ✓
Valid Redirect URIs:
  - https://smile-dental.clinicx.com/*
  - https://happy-teeth.clinicx.com/*
  - https://*.clinicx.com/*
  - http://localhost:4200/* (for development)
Web Origins:
  - https://smile-dental.clinicx.com
  - https://happy-teeth.clinicx.com
  - https://*.clinicx.com
  - http://localhost:4200 (for development)
```

### Backend Client (`clinicx-backend`)

Configure the confidential client for backend API:

```yaml
Client ID: clinicx-backend
Enabled: ON
Client Protocol: openid-connect
Access Type: confidential
Service Accounts Enabled: ✓
Authorization Enabled: ✗
Client Authenticator: Client Id and Secret
Secret: [Generated Secret]
```

## Backend Integration

### 1. Tenant Switch Endpoint

The backend must implement an endpoint to handle tenant switching:

```java
@RestController
@RequestMapping("/api/auth")
public class TenantSwitchController {
    
    @Autowired
    private KeycloakAdminService keycloakAdminService;
    
    @Autowired
    private TokenService tokenService;
    
    @PostMapping("/switch-tenant")
    public ResponseEntity<TokenResponse> switchTenant(
            @RequestBody TenantSwitchRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        
        String userId = jwt.getSubject();
        String requestedTenantId = request.getTenantId();
        
        // 1. Verify user has access to requested tenant
        List<AccessibleTenant> accessibleTenants = extractAccessibleTenants(jwt);
        boolean hasAccess = accessibleTenants.stream()
            .anyMatch(t -> t.getTenantId().equals(requestedTenantId));
        
        if (!hasAccess) {
            return ResponseEntity.status(403).build();
        }
        
        // 2. Update user's active_tenant_id in Keycloak
        keycloakAdminService.updateUserActiveTenant(userId, requestedTenantId);
        
        // 3. Generate new token with updated claims
        String newToken = tokenService.generateTokenWithUpdatedClaims(
            userId, requestedTenantId
        );
        
        return ResponseEntity.ok(new TokenResponse(newToken));
    }
}
```

### 2. Keycloak Admin Service

Service to interact with Keycloak Admin API:

```java
@Service
public class KeycloakAdminService {
    
    private final Keycloak keycloak;
    
    public KeycloakAdminService(
            @Value("${keycloak.auth-server-url}") String serverUrl,
            @Value("${keycloak.realm}") String realm,
            @Value("${keycloak.admin.client-id}") String clientId,
            @Value("${keycloak.admin.client-secret}") String clientSecret) {
        
        this.keycloak = KeycloakBuilder.builder()
            .serverUrl(serverUrl)
            .realm(realm)
            .clientId(clientId)
            .clientSecret(clientSecret)
            .grantType(OAuth2Constants.CLIENT_CREDENTIALS)
            .build();
    }
    
    public void updateUserActiveTenant(String userId, String tenantId) {
        // Get the tenant's realm name
        String realmName = "clinic-" + getTenantSubdomain(tenantId);
        
        // Get user resource
        UserResource userResource = keycloak
            .realm(realmName)
            .users()
            .get(userId);
        
        // Update user attributes
        UserRepresentation user = userResource.toRepresentation();
        Map<String, List<String>> attributes = user.getAttributes();
        attributes.put("active_tenant_id", Arrays.asList(tenantId));
        user.setAttributes(attributes);
        
        // Update user
        userResource.update(user);
    }
}
```

### 3. Token Generation

Generate new tokens after tenant switch:

```java
@Service
public class TokenService {
    
    @Autowired
    private KeycloakProperties keycloakProperties;
    
    public String generateTokenWithUpdatedClaims(String userId, String tenantId) {
        // This would typically involve:
        // 1. Getting a service account token
        // 2. Using token exchange to get a new token for the user
        // 3. Or triggering a refresh with updated attributes
        
        // Example using direct token generation (simplified)
        return requestNewToken(userId, tenantId);
    }
    
    private String requestNewToken(String userId, String tenantId) {
        // Implementation depends on your specific setup
        // Could use token exchange, impersonation, or custom token endpoint
    }
}
```

## User Management

### Creating Multi-Tenant Users

#### Option 1: Shared User Federation (Recommended)

Configure all tenant realms to use the same user federation provider:

1. **LDAP Configuration**
   ```yaml
   Connection URL: ldap://ldap.clinicx.com:389
   Users DN: ou=users,dc=clinicx,dc=com
   Bind Type: simple
   Bind DN: cn=admin,dc=clinicx,dc=com
   ```

2. **Custom User Storage Provider**
   ```java
   public class MultiTenantUserStorageProvider implements UserStorageProvider {
       // Implementation to fetch users from central database
       // Include tenant access information in attributes
   }
   ```

#### Option 2: User Synchronization

Synchronize users across realms:

```bash
# Script to create user in multiple realms
#!/bin/bash
USER_JSON='{
  "username": "john.doe@clinicx.com",
  "email": "john.doe@clinicx.com",
  "enabled": true,
  "attributes": {
    "tenant_id": ["smile-dental-123"],
    "active_tenant_id": ["smile-dental-123"],
    "accessible_tenants": ["[...]"]
  }
}'

# Create in each realm
for realm in "clinic-smile-dental" "clinic-happy-teeth"; do
  curl -X POST "http://localhost:18081/admin/realms/$realm/users" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$USER_JSON"
done
```

### Managing User Access

#### Adding Tenant Access

```java
public void grantTenantAccess(String userId, String newTenantId, List<String> roles) {
    // 1. Get current accessible_tenants
    UserRepresentation user = getUserById(userId);
    String accessibleTenantsJson = user.getAttributes()
        .get("accessible_tenants").get(0);
    
    // 2. Parse and add new tenant
    List<AccessibleTenant> tenants = parseAccessibleTenants(accessibleTenantsJson);
    tenants.add(new AccessibleTenant(newTenantId, getTenantName(newTenantId), 
        getTenantSpecialty(newTenantId), roles));
    
    // 3. Update user attributes
    user.getAttributes().put("accessible_tenants", 
        Arrays.asList(toJson(tenants)));
    updateUser(user);
}
```

#### Removing Tenant Access

```java
public void revokeTenantAccess(String userId, String tenantId) {
    // Similar to above, but remove tenant from list
}
```

## Testing Guide

### 1. Single Tenant Access Test

```bash
# 1. Get token for single-tenant user
TOKEN=$(curl -s -X POST \
  "http://localhost:18081/realms/clinic-smile-dental/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=clinicx-frontend" \
  -d "username=single.user@clinic.com" \
  -d "password=password" \
  -d "grant_type=password" | jq -r '.access_token')

# 2. Decode and verify claims
echo $TOKEN | cut -d. -f2 | base64 --decode | jq .
```

### 2. Multi-Tenant Access Test

```bash
# 1. Login as multi-tenant user
TOKEN=$(curl -s -X POST \
  "http://localhost:18081/realms/clinic-smile-dental/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=clinicx-frontend" \
  -d "username=multi.user@clinic.com" \
  -d "password=password" \
  -d "grant_type=password" | jq -r '.access_token')

# 2. Check accessible_tenants claim
echo $TOKEN | cut -d. -f2 | base64 --decode | jq '.accessible_tenants'

# 3. Switch tenant
NEW_TOKEN=$(curl -s -X POST \
  "http://localhost:8080/api/auth/switch-tenant" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tenantId":"happy-teeth-456"}' | jq -r '.token')

# 4. Verify active_tenant_id changed
echo $NEW_TOKEN | cut -d. -f2 | base64 --decode | jq '.active_tenant_id'
```

### 3. Frontend Testing

```javascript
// Test tenant switching in browser console
async function testTenantSwitch() {
  // 1. Check current tenant
  const currentUser = await authService.user().toPromise();
  console.log('Current tenant:', currentUser.active_tenant_id);
  console.log('Accessible tenants:', currentUser.accessible_tenants);
  
  // 2. Switch tenant
  const response = await fetch('/api/auth/switch-tenant', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ tenantId: 'happy-teeth-456' })
  });
  
  const { token } = await response.json();
  
  // 3. Update token
  localStorage.setItem('access_token', token);
  
  // 4. Refresh page to see changes
  window.location.reload();
}
```

## Troubleshooting

### Keycloak 26 Specific Notes

#### User Profile Configuration
In Keycloak 26, user attributes must be defined in the User Profile (Realm settings → User profile) before they can be used. If you can't see or set user attributes:

1. Check that attributes are defined in User Profile configuration
2. Verify the permissions allow the current user role to view/edit
3. Ensure attributes are enabled for the appropriate contexts

### Common Issues

#### 1. Missing Claims in JWT Token

**Problem**: Custom attributes not appearing in token

**Solution**:
- Verify protocol mappers are configured correctly
- Check that mappers are added to the client's dedicated scope
- Ensure "Add to access token" is checked
- Verify user has the attributes set
- **Keycloak 26**: Ensure attributes are defined in User Profile first

#### 2. Tenant Switch Fails

**Problem**: 403 error when switching tenants

**Solution**:
- Check `accessible_tenants` attribute is properly formatted JSON
- Verify requested tenant ID exists in accessible_tenants list
- Check backend logs for validation errors
- Ensure user exists in target tenant's realm

#### 3. CORS Issues

**Problem**: Cross-origin errors when switching between tenant subdomains

**Solution**:
- Add all tenant domains to Web Origins in client configuration
- Configure backend CORS to accept all tenant subdomains
- Use wildcard if appropriate: `https://*.clinicx.com`

#### 4. Token Refresh Issues

**Problem**: Token refresh fails after tenant switch

**Solution**:
- Ensure refresh token is included in token response
- Check refresh token isn't expired
- Verify client has refresh token grant enabled

### Debug Checklist

- [ ] User attributes are set correctly in Keycloak
- [ ] Protocol mappers are configured for all required claims
- [ ] Client redirect URIs include all tenant domains
- [ ] Backend endpoint properly validates tenant access
- [ ] Frontend updates token after successful switch
- [ ] User exists in target tenant realm (if using separate users)
- [ ] Keycloak admin credentials are correct for API access

### Logging

Enable debug logging for troubleshooting:

```yaml
# Backend application.yml
logging:
  level:
    org.keycloak: DEBUG
    org.springframework.security: DEBUG
    com.clinicx.auth: DEBUG

# Keycloak standalone.xml
<logger category="org.keycloak">
    <level name="DEBUG"/>
</logger>
```

## Security Considerations

1. **Validate Tenant Access**: Always verify user has access to requested tenant
2. **Audit Logging**: Log all tenant switch operations
3. **Token Expiry**: Use short-lived tokens with refresh capability
4. **Rate Limiting**: Implement rate limiting on tenant switch endpoint
5. **Secure Storage**: Never store sensitive tenant data in frontend
6. **HTTPS Only**: Always use HTTPS in production
7. **CSRF Protection**: Implement CSRF tokens for tenant switch requests

## References

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [OpenID Connect Specification](https://openid.net/connect/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)