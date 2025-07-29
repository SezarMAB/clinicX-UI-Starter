# AuthCallbackComponent

## Overview
The AuthCallbackComponent handles OAuth2/OpenID Connect authentication callbacks from Keycloak. It processes authorization codes, exchanges them for tokens, and manages the user's post-authentication navigation.

## Features
- Extracts authorization code and state from URL parameters
- Handles OAuth error responses (access_denied, unauthorized_client, etc.)
- Exchanges authorization code for access/refresh tokens via KeycloakAuthService
- Shows loading state during token exchange
- Displays user-friendly error messages with retry options
- Navigates to intended route after successful authentication
- Supports PKCE (Proof Key for Code Exchange) for enhanced security
- Responsive design with Angular Material components

## Usage

### Route Configuration
The component is accessible at `/auth/callback` and is configured in the app routes:

```typescript
{
  path: 'auth',
  component: AuthLayoutComponent,
  children: [
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'callback', component: AuthCallbackComponent },
  ],
}
```

### Keycloak Redirect URI
Configure your Keycloak client to use the following redirect URI:
```
http://localhost:4200/auth/callback
```

For production environments:
```
https://your-domain.com/auth/callback
```

### Component States

1. **Loading State**: Displayed while processing the authentication callback
   - Shows a material spinner
   - Displays "Processing authentication..." message

2. **Error State**: Shown when authentication fails
   - Displays specific error message
   - Shows error details if available
   - Provides "Retry" button to navigate back to login
   - Provides "Go Home" button to navigate to homepage

3. **Success State**: Brief display before automatic redirect
   - Shows success icon and message
   - Auto-redirects to intended route or dashboard

### Error Handling
The component handles various OAuth2 error scenarios:
- `access_denied`: User denied permission
- `unauthorized_client`: Client not authorized
- `invalid_request`: Invalid authentication request
- `unsupported_response_type`: Unsupported auth method
- `server_error`: Authentication server error
- `temporarily_unavailable`: Service temporarily unavailable

### Session Storage
- Stores intended return URL in `auth_return_url` key
- Automatically cleans up after successful authentication

### Translation Keys
Add these translation keys to your i18n files:

```json
{
  "auth": {
    "callback": {
      "processing": "Processing authentication",
      "please_wait": "Please wait while we complete your login...",
      "error_title": "Authentication Error",
      "retry": "Try Again",
      "go_home": "Go to Home",
      "success": "Authentication Successful",
      "redirecting": "Redirecting you to the application..."
    }
  }
}
```

## Dependencies
- Angular 20 with standalone components
- Angular Material 20
- RxJS for reactive programming
- KeycloakAuthService for token exchange
- ToastrService for notifications
- Angular Router for navigation

## Testing
The component includes comprehensive unit tests covering:
- Successful authentication flow
- Failed authentication scenarios
- OAuth error handling
- Missing authorization code handling
- Return URL management
- Retry and navigation functionality

Run tests with:
```bash
ng test AuthCallbackComponent
```