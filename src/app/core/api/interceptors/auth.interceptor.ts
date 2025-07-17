import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_CONFIG } from '@core';

/**
 * HTTP interceptor for authentication
 * Prepared for session-based authentication with Keycloak
 * Currently passes through requests with credentials
 *
 * To activate Keycloak session authentication:
 * 1. Ensure Keycloak is configured for session-based auth
 * 2. The session cookie will be automatically included due to withCredentials: true
 * 3. Add any additional session headers if required
 *
 * @param req The outgoing request
 * @param next The next handler in the chain
 * @returns The modified request
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const apiConfig = inject(API_CONFIG);

  // Session cookies are automatically included when withCredentials is true
  // No need to manually add session ID to headers

  // If your backend requires a specific session header, uncomment and modify:
  // const sessionId = getSessionIdFromSomewhere(); // e.g., from a service or storage
  // if (sessionId) {
  //   req = req.clone({
  //     setHeaders: {
  //       'X-Session-Id': sessionId
  //     }
  //   });
  // }

  // For CSRF protection with session-based auth
  // const csrfToken = getCsrfToken(); // Get CSRF token if required
  // if (csrfToken) {
  //   req = req.clone({
  //     setHeaders: {
  //       'X-CSRF-Token': csrfToken
  //     }
  //   });
  // }

  return next(req);
};
