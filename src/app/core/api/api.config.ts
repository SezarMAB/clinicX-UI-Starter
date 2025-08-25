import { InjectionToken } from '@angular/core';

/**
 * Configuration interface for the API service
 * @interface ApiConfig
 */
export interface ApiConfig {
  /** Base URL for all API endpoints */
  baseUrl: string;
  /** Cache time in milliseconds for HTTP resources */
  cacheTimeMs?: number;
  /** Whether to include credentials in requests */
  withCredentials?: boolean;
  /** Custom headers to include in all requests */
  headers?: Record<string, string>;
  /** Toggle to enable Authorization: Bearer <token> in auth.interceptor (off by default). */
  useAuthHeader?: boolean;
}

/**
 * Injection token for API configuration
 * @constant API_CONFIG
 */
export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG');

/**
 * Default API configuration
 * @constant defaultApiConfig
 */
export const defaultApiConfig: ApiConfig = {
  baseUrl: 'http://localhost:8080',
  cacheTimeMs: 300000, // 5 minutes
  withCredentials: true, // Important for session-based auth with Keycloak
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  useAuthHeader: false,
};

/**
 * Provides the API configuration
 * Can be overridden in app.config.ts
 * @returns Provider for API configuration
 */
export function provideApiConfig(config?: Partial<ApiConfig>) {
  return {
    provide: API_CONFIG,
    useValue: { ...defaultApiConfig, ...config },
  };
}
