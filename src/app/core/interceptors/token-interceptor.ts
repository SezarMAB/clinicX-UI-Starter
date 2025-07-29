import { HttpErrorResponse, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService, KeycloakAuthService } from '@core/authentication';
import { catchError, switchMap, tap, throwError, of } from 'rxjs';
import { BASE_URL, hasHttpScheme } from './base-url-interceptor';

export function tokenInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const router = inject(Router);
  const baseUrl = inject(BASE_URL, { optional: true });
  const tokenService = inject(TokenService);
  const keycloakService = inject(KeycloakAuthService);

  const includeBaseUrl = (url: string) => {
    if (!baseUrl) {
      return false;
    }
    return new RegExp(`^${baseUrl.replace(/\/$/, '')}`, 'i').test(url);
  };

  const shouldAppendToken = (url: string) => !hasHttpScheme(url) || includeBaseUrl(url);

  const handler = () => {
    if (req.url.includes('/auth/logout')) {
      router.navigateByUrl('/auth/login');
    }

    if (router.url.includes('/auth/login')) {
      router.navigateByUrl('/dashboard');
    }
  };

  if (tokenService.valid() && shouldAppendToken(req.url)) {
    return next(
      req.clone({
        headers: req.headers.append('Authorization', tokenService.getBearerToken()),
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
                const newReq = req.clone({
                  headers: req.headers.set('Authorization', tokenService.getBearerToken()),
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
