import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_CONFIG } from '../api.config';

/**
 * Off by default. When API_CONFIG.useAuthHeader = true, attaches Bearer token.
 * For session-cookie auth, leave disabled and rely on withCredentials.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const cfg = inject(API_CONFIG);
  if (!cfg.useAuthHeader) return next(req);
  const token = ''; // TODO: plug token source when JWT is enabled
  const cloned = req.clone({ setHeaders: token ? { Authorization: `Bearer ${token}` } : {} });
  return next(cloned);
};
