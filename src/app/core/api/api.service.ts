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
      params?: Signal<any | HttpParams | undefined>;
      /** Signal of headers as plain object or HttpHeaders */
      headers?: Signal<Record<string, string> | HttpHeaders | undefined>;
    }
  ) {
    return httpResource<T>(() => {
      const pathValue = typeof path === 'string' ? path : path();

      // Don't make request if path is empty
      if (!pathValue) {
        // Return a config that httpResource will skip
        return null as any;
      }

      const url = this.normalizeUrl(pathValue);

      const paramsVal = opts?.params?.();
      const headersVal = opts?.headers?.();

      return {
        url,
        method: 'GET',
        withCredentials: this.config.withCredentials,
        params: paramsVal instanceof HttpParams ? paramsVal : this.createParams(paramsVal ?? {}),
        headers:
          headersVal instanceof HttpHeaders
            ? headersVal
            : this.mergeHeaders(this.config.headers, headersVal ?? {}),
      };
    });
  }

  /** POST */
  post<T>(
    url: string,
    body: unknown,
    params?: Record<string, unknown> | HttpParams,
    headers?: Record<string, string> | HttpHeaders
  ): Observable<T> {
    return this.http.post<T>(this.normalizeUrl(url), body, {
      params: params instanceof HttpParams ? params : this.createParams(params ?? {}),
      withCredentials: this.config.withCredentials,
      headers:
        headers instanceof HttpHeaders
          ? headers
          : this.mergeHeaders(this.config.headers, headers ?? {}),
    });
  }

  /** PUT */
  put<T>(
    url: string,
    body: unknown,
    params?: Record<string, unknown> | HttpParams,
    headers?: Record<string, string> | HttpHeaders
  ): Observable<T> {
    return this.http.put<T>(this.normalizeUrl(url), body, {
      params: params instanceof HttpParams ? params : this.createParams(params ?? {}),
      withCredentials: this.config.withCredentials,
      headers:
        headers instanceof HttpHeaders
          ? headers
          : this.mergeHeaders(this.config.headers, headers ?? {}),
    });
  }

  /** PATCH */
  patch<T>(
    url: string,
    body: unknown,
    params?: Record<string, unknown> | HttpParams,
    headers?: Record<string, string> | HttpHeaders
  ): Observable<T> {
    return this.http.patch<T>(this.normalizeUrl(url), body, {
      params: params instanceof HttpParams ? params : this.createParams(params ?? {}),
      withCredentials: this.config.withCredentials,
      headers:
        headers instanceof HttpHeaders
          ? headers
          : this.mergeHeaders(this.config.headers, headers ?? {}),
    });
  }

  /** DELETE */
  delete<T>(
    url: string,
    params?: Record<string, unknown> | HttpParams,
    headers?: Record<string, string> | HttpHeaders
  ): Observable<T> {
    return this.http.delete<T>(this.normalizeUrl(url), {
      params: params instanceof HttpParams ? params : this.createParams(params ?? {}),
      withCredentials: this.config.withCredentials,
      headers:
        headers instanceof HttpHeaders
          ? headers
          : this.mergeHeaders(this.config.headers, headers ?? {}),
    });
  }

  /** GET (Observable-based for non-signal use cases) */
  get<T>(
    url: string,
    params?: Record<string, unknown> | HttpParams,
    headers?: Record<string, string> | HttpHeaders
  ): Observable<T> {
    return this.http.get<T>(this.normalizeUrl(url), {
      params: params instanceof HttpParams ? params : this.createParams(params ?? {}),
      withCredentials: this.config.withCredentials,
      headers:
        headers instanceof HttpHeaders
          ? headers
          : this.mergeHeaders(this.config.headers, headers ?? {}),
    });
  }

  /** GET Blob */
  getBlob(
    url: string,
    params?: Record<string, unknown> | HttpParams,
    headers?: Record<string, string> | HttpHeaders
  ): Observable<Blob> {
    return this.http.get(this.normalizeUrl(url), {
      params: params instanceof HttpParams ? params : this.createParams(params ?? {}),
      withCredentials: this.config.withCredentials,
      headers:
        headers instanceof HttpHeaders
          ? headers
          : this.mergeHeaders(this.config.headers, headers ?? {}),
      responseType: 'blob',
    });
  }

  /** POST Blob */
  postBlob(
    url: string,
    body: unknown,
    params?: Record<string, unknown> | HttpParams,
    headers?: Record<string, string> | HttpHeaders
  ): Observable<Blob> {
    return this.http.post(this.normalizeUrl(url), body, {
      params: params instanceof HttpParams ? params : this.createParams(params ?? {}),
      withCredentials: this.config.withCredentials,
      headers:
        headers instanceof HttpHeaders
          ? headers
          : this.mergeHeaders(this.config.headers, headers ?? {}),
      responseType: 'blob',
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
