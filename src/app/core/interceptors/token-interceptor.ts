import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService, KeycloakAuthService, AuthService } from '@core/authentication';
import { catchError, switchMap, tap, throwError, of, firstValueFrom } from 'rxjs';
import { BASE_URL, hasHttpScheme } from './base-url-interceptor';

export function tokenInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const router = inject(Router);
  const baseUrl = inject(BASE_URL, { optional: true });
  const tokenService = inject(TokenService);
  const keycloakService = inject(KeycloakAuthService);
  const authService = inject(AuthService);

  // console.log('Token interceptor called for:', req.url);
  // console.log('Token valid:', tokenService.valid());
  // console.log('Bearer token:', tokenService.getBearerToken());

  const includeBaseUrl = (url: string) => {
    if (!baseUrl) {
      return false;
    }
    return new RegExp(`^${baseUrl.replace(/\/$/, '')}`, 'i').test(url);
  };

  const shouldAppendToken = (url: string) => {
    // Skip token for static assets
    if (url.includes('/i18n/') || url.includes('/assets/') || url.endsWith('.json')) {
      console.log('Static asset detected, skipping token for:', url);
      return false;
    }

    // Always add token for API calls
    if (url.includes('/api/')) {
      console.log('API call detected, will add token');
      return true;
    }

    const result = !hasHttpScheme(url) || includeBaseUrl(url);
    console.log('Should append token to', url, '?', result);
    console.log('  - hasHttpScheme:', hasHttpScheme(url));
    console.log('  - includeBaseUrl:', includeBaseUrl(url));
    console.log('  - baseUrl:', baseUrl);
    return result;
  };

  const handler = () => {
    if (req.url.includes('/auth/logout')) {
      router.navigateByUrl('/auth/login');
    }

    if (router.url.includes('/auth/login')) {
      router.navigateByUrl('/dashboard');
    }
  };

  if (tokenService.valid() && shouldAppendToken(req.url)) {
    // Add Authorization header
    let headers = req.headers.append('Authorization', tokenService.getBearerToken());

    // Try to get tenant ID from the token directly
    const token = tokenService.getBearerToken();
    if (token) {
      try {
        const accessToken = token.replace('Bearer ', '');
        const payload = keycloakService.parseJWT(accessToken);
        const tenantId = payload?.active_tenant_id || payload?.tenant_id;
        console.log(tenantId);
        if (tenantId) {
          headers = headers.append('X-Tenant-ID', tenantId);
        }
      } catch (error) {
        console.error('Failed to parse JWT for tenant ID:', error);
      }
    }

    return next(
      req.clone({
        headers,
        withCredentials: true,
      })
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !req.url.includes('/token')) {
          // Try to refresh the token
          const refreshToken = tokenService.getRefreshToken();
          if (refreshToken) {
            return keycloakService.refreshToken().pipe(
              switchMap(() => {
                // Retry the original request with the new token
                let headers = req.headers.set('Authorization', tokenService.getBearerToken());

                // Try to get tenant ID from the refreshed token
                const newToken = tokenService.getBearerToken();
                if (newToken) {
                  try {
                    const accessToken = newToken.replace('Bearer ', '');
                    const payload = keycloakService.parseJWT(accessToken);
                    const tenantId = payload?.active_tenant_id || payload?.tenant_id;
                    if (tenantId) {
                      headers = headers.set('X-Tenant-ID', tenantId);
                    }
                  } catch (error) {
                    console.error('Failed to parse refreshed JWT for tenant ID:', error);
                  }
                }

                const newReq = req.clone({
                  headers,
                  withCredentials: true,
                });
                return next(newReq);
              }),
              catchError(refreshError => {
                // Refresh failed, clear tokens and redirect to login
                tokenService.clear();
                router.navigateByUrl('/auth/login');
                return throwError(() => error);
              })
            );
          } else {
            // No refresh token available, clear and redirect
            tokenService.clear();
            router.navigateByUrl('/auth/login');
          }
        }
        return throwError(() => error);
      }),
      tap(() => handler())
    );
  }

  return next(req).pipe(tap(() => handler()));
}
