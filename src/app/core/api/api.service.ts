import { inject, Injectable, Signal } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { httpResource } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from './api.config';

/**
 * Thin wrapper service for HTTP operations
 * All feature services should use this service instead of HttpClient directly
 * @class ApiService
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);

  /**
   * Signal-based GET that auto-refreshes when inputs change
   * @template T The expected response type
   * @param path URL path or Signal<string> that emits the path
   * @param params Optional Signal<HttpParams | undefined> for query parameters
   * @returns Resource with value, error, and status signals
   */
  apiGetResource<T>(path: string | Signal<string>, params?: Signal<HttpParams | undefined>) {
    // httpResource expects a function that returns an HttpResourceRequest object
    return httpResource<T>(() => {
      const pathValue = typeof path === 'string' ? path : path();
      const url = `${this.config.baseUrl}${pathValue}`;

      return {
        url,
        method: 'GET',
        params: params?.(),
        withCredentials: this.config.withCredentials,
        headers: this.config.headers,
      };
    });
  }

  /**
   * Performs a GET request
   * @template T The expected response type
   * @param url The endpoint URL (without base URL)
   * @param params Optional HTTP parameters
   * @returns Observable of the response
   */
  get<T>(url: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(`${this.config.baseUrl}${url}`, {
      params,
      withCredentials: this.config.withCredentials,
      headers: this.config.headers,
    });
  }

  /**
   * Performs a POST request
   * @template T The expected response type
   * @param url The endpoint URL (without base URL)
   * @param body The request body
   * @param params Optional HTTP parameters
   * @returns Observable of the response
   */
  post<T>(url: string, body: unknown, params?: HttpParams): Observable<T> {
    return this.http.post<T>(`${this.config.baseUrl}${url}`, body, {
      params,
      withCredentials: this.config.withCredentials,
      headers: this.config.headers,
    });
  }

  /**
   * Performs a PUT request
   * @template T The expected response type
   * @param url The endpoint URL (without base URL)
   * @param body The request body
   * @param params Optional HTTP parameters
   * @returns Observable of the response
   */
  put<T>(url: string, body: unknown, params?: HttpParams): Observable<T> {
    return this.http.put<T>(`${this.config.baseUrl}${url}`, body, {
      params,
      withCredentials: this.config.withCredentials,
      headers: this.config.headers,
    });
  }

  /**
   * Performs a DELETE request
   * @template T The expected response type
   * @param url The endpoint URL (without base URL)
   * @param params Optional HTTP parameters
   * @returns Observable of the response
   */
  delete<T>(url: string, params?: HttpParams): Observable<T> {
    return this.http.delete<T>(`${this.config.baseUrl}${url}`, {
      params,
      withCredentials: this.config.withCredentials,
      headers: this.config.headers,
    });
  }

  /**
   * Performs a PATCH request
   * @template T The expected response type
   * @param url The endpoint URL (without base URL)
   * @param body The request body
   * @param params Optional HTTP parameters
   * @returns Observable of the response
   */
  patch<T>(url: string, body: unknown, params?: HttpParams): Observable<T> {
    return this.http.patch<T>(`${this.config.baseUrl}${url}`, body, {
      params,
      withCredentials: this.config.withCredentials,
      headers: this.config.headers,
    });
  }

  /**
   * Creates HttpParams from an object
   * @param params Object with key-value pairs
   * @returns HttpParams instance
   */
  createParams(params: Record<string, any>): HttpParams {
    let httpParams = new HttpParams();

    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(item => {
            httpParams = httpParams.append(key, String(item));
          });
        } else {
          httpParams = httpParams.set(key, String(value));
        }
      }
    });

    return httpParams;
  }

  /**
   * Creates HttpHeaders from an object
   * @param headers Object with key-value pairs
   * @returns HttpHeaders instance
   */
  createHeaders(headers: Record<string, string>): HttpHeaders {
    return new HttpHeaders(headers);
  }
}
