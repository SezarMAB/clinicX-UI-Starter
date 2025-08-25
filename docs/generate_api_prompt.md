Got it. Here’s a tightened, Angular-20-first prompt you can drop into your generator. I kept your intent (GET via `httpResource`, POST/PUT/PATCH/DELETE via `HttpClient` through a thin wrapper), modernized the language, and added a few best-practice constraints (standalone app, strict typing, signals, test shape, session-cookie-ready auth).

---

# You are a senior Angular 20 architect.

## Input

1. The file `{{public/arch/openapi.json}}` — an OpenAPI 3.1 spec with \~85 endpoints for a dental-clinic backend.

## Goal

Generate a **production-ready Angular 20 workspace** (standalone, strict) that compiles with:

```
ng build --configuration=production --strict
```

## Architecture & requirements

1. **Thin `ApiService` wrapper** (below, enhanced) — all feature services must use it; **no direct `HttpClient`**.
2. **One feature folder per OpenAPI tag**: service + DTO models + barrel (`index.ts`). Examples: `appointments/`, `patients/`, etc.
3. **Core** for cross-cutting concerns (config token, interceptors, error model, pagination, utilities).
4. **Angular 20 style**: standalone APIs (`bootstrapApplication`), `provideHttpClient`, new control flow, signals where applicable.
5. **Type safety**: strict TS, generated **interfaces** for schemas, `readonly` where possible, narrow unions for enums, `Nullable<T>` for `nullable: true`.
6. **Docs**: concise **JSDoc** on public APIs and models.
7. **Barrels**: every folder exposes a clean public surface via `index.ts`.
8. **GET → `httpResource`** returning a signal-backed resource; **POST/PUT/PATCH/DELETE → Observables** (through `ApiService`).
9. **Tests**: per-method unit tests using `HttpClientTestingModule` + `HttpTestingController`. Also test at least one `httpResource` flow.
10. **No third-party libs**; only Angular built-ins.
11. **Auth ready for session cookie** (Spring Boot + Keycloak): default to `withCredentials: true`, no `Authorization` header. Provide an easy switch to enable Bearer tokens later (disabled by default).
12. **Error handling**: global error interceptor + typed `ErrorModel`. Prefer non-throwing `httpResource` usage (surface errors via resource error signal).
13. **Pagination**: enhanced typed model (page, size, total, sort) + helper to build query params.
14. **OpenAPI fidelity**:

* Generate one service per **tag**, grouping only that tag’s paths.
* Exact overloads per verb with typed path params, query params, and body.
* Handle `multipart/form-data` (file upload) and `application/x-www-form-urlencoded`.
* Map `date` / `date-time` to `string` (ISO 8601); document in JSDoc.
* Resolve `allOf`/`oneOf`/`anyOf` sensibly into intersections/unions with discriminators where present.

## Folder layout to emit

```
starter/
├─ src/app/
│  ├─ core/
│  │  ├─ api/
│  │  │  ├─ api.service.ts
│  │  │  ├─ api.config.ts
│  │  │  └─ interceptors/
│  │  │     ├─ auth.interceptor.ts        # off by default; easy toggle for Bearer later
│  │  │     └─ error.interceptor.ts
│  │  ├─ models/
│  │  │  ├─ error.model.ts
│  │  │  └─ pagination.model.ts
│  │  └─ index.ts
│  ├─ features/
│  │  ├─ appointments/
│  │  │  ├─ appointments.service.ts
│  │  │  ├─ appointments.models.ts
│  │  │  ├─ appointments.service.spec.ts
│  │  │  └─ index.ts
│  │  ├─ patients/
│  │  │  └─ … (analogous)
│  │  └─ … (one folder per tag)
│  ├─ shared/                            # reusable pipes/directives/ui bits (if any)
│  ├─ app.config.ts                      # provideHttpClient + interceptors wire-up
│  └─ main.ts
├─ src/environments/                     # environment.ts / environment.prod.ts
├─ README.md
└─ …
```

## Thin ApiService (Angular 20) — **use exactly this surface**

Enhancements: typed options, object/array param serialization, per-call header overrides, session-cookie defaults, and `httpResource` for GET.

```ts
// src/app/core/api/api.service.ts
import { inject, Injectable, Signal } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { httpResource } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG, ApiConfig } from './api.config';

/** Utility type for nullable OpenAPI fields. */
export type Nullable<T> = T | null;

/**
 * Thin HTTP wrapper used by all feature services.
 * - GET uses httpResource → signal-backed auto-refresh when inputs change.
 * - Other verbs return Observables.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject<ApiConfig>(API_CONFIG);

  /**
   * Signal-based GET that auto-refreshes when inputs (path/params/headers) change.
   * @template T Response type
   * @param path Absolute or relative path, or a Signal producing it (e.g., `/patients/${id()}`)
   * @param opts Optional reactive params/headers
   */
  apiGetResource<T>(
    path: string | Signal<string>,
    opts?: {
      /** Signal of query params as plain object or HttpParams */
      params?: Signal<Record<string, unknown> | HttpParams | undefined>;
      /** Signal of headers as plain object or HttpHeaders */
      headers?: Signal<Record<string, string> | HttpHeaders | undefined>;
    }
  ) {
    return httpResource<T>(() => {
      const pathValue = typeof path === 'string' ? path : path();
      const url = this.normalizeUrl(pathValue);

      const paramsVal = opts?.params?.();
      const headersVal = opts?.headers?.();

      return {
        url,
        method: 'GET',
        withCredentials: this.config.withCredentials,
        params: paramsVal instanceof HttpParams ? paramsVal : this.createParams(paramsVal ?? {}),
        headers: headersVal instanceof HttpHeaders
          ? headersVal
          : this.mergeHeaders(this.config.headers, headersVal ?? {}),
      };
    });
  }

  /** POST */
  post<T>(url: string, body: unknown, params?: Record<string, unknown> | HttpParams, headers?: Record<string, string> | HttpHeaders): Observable<T> {
    return this.http.post<T>(this.normalizeUrl(url), body, {
      params: params instanceof HttpParams ? params : this.createParams(params ?? {}),
      withCredentials: this.config.withCredentials,
      headers: headers instanceof HttpHeaders ? headers : this.mergeHeaders(this.config.headers, headers ?? {}),
    });
  }

  /** PUT */
  put<T>(url: string, body: unknown, params?: Record<string, unknown> | HttpParams, headers?: Record<string, string> | HttpHeaders): Observable<T> {
    return this.http.put<T>(this.normalizeUrl(url), body, {
      params: params instanceof HttpParams ? params : this.createParams(params ?? {}),
      withCredentials: this.config.withCredentials,
      headers: headers instanceof HttpHeaders ? headers : this.mergeHeaders(this.config.headers, headers ?? {}),
    });
  }

  /** PATCH */
  patch<T>(url: string, body: unknown, params?: Record<string, unknown> | HttpParams, headers?: Record<string, string> | HttpHeaders): Observable<T> {
    return this.http.patch<T>(this.normalizeUrl(url), body, {
      params: params instanceof HttpParams ? params : this.createParams(params ?? {}),
      withCredentials: this.config.withCredentials,
      headers: headers instanceof HttpHeaders ? headers : this.mergeHeaders(this.config.headers, headers ?? {}),
    });
  }

  /** DELETE */
  delete<T>(url: string, params?: Record<string, unknown> | HttpParams, headers?: Record<string, string> | HttpHeaders): Observable<T> {
    return this.http.delete<T>(this.normalizeUrl(url), {
      params: params instanceof HttpParams ? params : this.createParams(params ?? {}),
      withCredentials: this.config.withCredentials,
      headers: headers instanceof HttpHeaders ? headers : this.mergeHeaders(this.config.headers, headers ?? {}),
    });
  }

  /** Create HttpParams from object; arrays → repeated keys; booleans/numbers are stringified. */
  createParams(params: Record<string, unknown>): HttpParams {
    let hp = new HttpParams();
    for (const key of Object.keys(params)) {
      const v = params[key];
      if (v === null || v === undefined) continue;
      if (Array.isArray(v)) {
        for (const item of v) hp = hp.append(key, String(item));
      } else {
        hp = hp.set(key, String(v));
      }
    }
    return hp;
  }

  /** Merge default headers with per-call overrides (objects). */
  private mergeHeaders(base?: Record<string, string>, extra?: Record<string, string>): HttpHeaders {
    const merged: Record<string, string> = { ...(base ?? {}), ...(extra ?? {}) };
    return new HttpHeaders(merged);
  }

  /** Normalize to absolute URL against baseUrl. */
  private normalizeUrl(path: string): string {
    const rel = path.startsWith('/') ? path : `/${path}`;
    return `${this.config.baseUrl}${rel}`;
  }
}
```

### API config + interceptors (session cookie ready)

```ts
// src/app/core/api/api.config.ts
import { InjectionToken } from '@angular/core';

export interface ApiConfig {
  baseUrl: string;
  /** Keep true for session-cookie auth; set false only for same-origin without cookies. */
  withCredentials: boolean;
  /** Default headers for all requests (Accept, Content-Type if applicable). */
  headers?: Record<string, string>;
  /** Toggle to enable Authorization: Bearer <token> in auth.interceptor (off by default). */
  useAuthHeader?: boolean;
}

export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG', {
  factory: () => ({
    baseUrl: '/api',
    withCredentials: true,
    headers: { Accept: 'application/json' },
    useAuthHeader: false,
  }),
});
```

```ts
// src/app/core/api/interceptors/auth.interceptor.ts
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
```

```ts
// src/app/core/api/interceptors/error.interceptor.ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ErrorModel } from '../../models/error.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(/* Optionally map HttpErrorResponse → ErrorModel, or centralize logging */);
```

```ts
// src/app/core/models/pagination.model.ts
/** Enhanced pagination model shared across services. */
export interface PageRequest {
  readonly page?: number;   // 0-based
  readonly size?: number;   // items per page
  readonly sort?: readonly string[]; // e.g., ['createdAt,desc']
}
export interface PageResponse<T> {
  readonly content: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
  readonly sort?: readonly string[];
}
```

### Code-generation rules

* **Services per tag**: Only include endpoints with that tag. Name: `<tag>.service.ts`.
* **Methods**:

  * **GET** → `apiGetResource<T>(path, { params, headers })` returning the `httpResource` result.

    * Accept reactive `Signal` inputs for path/query when useful (e.g., filters, pagination).
  * **POST/PUT/PATCH/DELETE** → delegate to `ApiService.post/put/patch/delete`, returning `Observable<T>`.
  * Overloads must exactly match path params, query params, and body schema from OpenAPI.
* **Models**:

  * Convert every `components.schemas.*` to `interfaces` in `*.models.ts`.
  * Use discriminated unions for `oneOf`/`anyOf` with `discriminator`.
  * Map `nullable` → `Nullable<T>`.
  * Emit `export type` unions for enums; reference them in DTOs.
* **Files**:

  * Every feature folder exports via `index.ts`.
  * Each service gets `*.service.spec.ts` with `HttpTestingController` tests covering:

    * URL construction, method, query param serialization, headers, body shape.
    * For one GET method per service: verify `httpResource` emits after a mocked response and re-emits when a dependency signal changes.
* **Testing**:

  * Use `HttpClientTestingModule` only; no third-party helpers.
  * No flakiness: complete all pending requests in specs; assert `req.flush(...)` and verify.
* **Environments**:

  * `environment.ts` / `environment.prod.ts` provide `apiBaseUrl` and wire to `API_CONFIG.baseUrl`.
* **Bootstrap**:

  * Standalone `main.ts` + `app.config.ts` using:

    * `provideHttpClient()` with `withInterceptors([errorInterceptor, authInterceptor])`.
    * Provide `API_CONFIG` with `useAuthHeader: false` (session-cookie defaults).
* **Lint/format**:

  * Angular ESLint recommended configs, no unused identifiers, strict TS compiler options.

### README

* Include `ng serve`, `ng test`, `ng build --configuration=production --strict`, and a short note on enabling JWT:

  * Set `useAuthHeader: true` and provide token source.

---

**Definition of Done**

* The workspace builds with `ng build --configuration=production --strict`.
* All generated tests pass.
* Each GET endpoint returns a signal-based resource via `httpResource`.
* No service directly uses `HttpClient` (only `ApiService`).
* Default auth works with **session cookies** (`withCredentials: true`), JWT can be enabled later by flipping `useAuthHeader`.
