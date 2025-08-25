import { inject, Injector, runInInjectionContext, signal, WritableSignal } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { filter, interval, Observable, of, take, tap, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { TenantsService } from '@features';
import { HttpResourceRef } from '@angular/common/http';
import { SubdomainAvailabilityDto } from '@features';

const SUBDOMAIN_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Async validator factory with lazy resource creation
 * The resource getter will be called only when validation is needed
 */
export function createSubdomainAvailabilityValidatorLazy(
  subdomainSig: WritableSignal<string>,
  getResource: () => HttpResourceRef<SubdomainAvailabilityDto | undefined>,
  excludeSubdomain?: string
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const raw = (control.value ?? '').toString().toLowerCase().trim();

    // Fast exits — let sync rules show messages
    if (!raw) return of(null);
    if (excludeSubdomain && raw === excludeSubdomain.toLowerCase()) return of(null);
    if (!SUBDOMAIN_PATTERN.test(raw)) return of(null);
    if (raw.length < 3 || raw.length > 50) return of(null);

    // Get or create the resource only when we have valid input
    const resource = getResource();

    // Debounce to reduce refetches while typing
    return timer(500).pipe(
      tap(() => {
        // Only set the signal if the value has changed
        if (subdomainSig() !== raw) {
          subdomainSig.set(raw); // triggers the resource fetch
        }
      }),
      switchMap(() => {
        // Don't check if the value is too short
        const currentValue = subdomainSig();
        if (currentValue.length < 3) {
          return of(null);
        }

        // Poll the resource state instead of using toObservable
        return interval(100).pipe(
          map(() => resource.isLoading()),
          filter(loading => !loading),
          take(1),
          map<unknown, ValidationErrors | null>(() => {
            // Never block on network/server errors
            if (resource.error()) return null;

            const res = resource.value(); // SubdomainAvailabilityDto | undefined
            // Only validate if we have a response for the current subdomain
            if (res && res.subdomain === raw) {
              return !res.available
                ? { unavailable: true, message: res.message ?? 'Subdomain is not available' }
                : null;
            }
            return null;
          })
        );
      })
    );
  };
}

/**
 * Async validator factory (NG0203-safe).
 * Uses polling instead of toObservable to avoid injection context issues.
 */
export function createSubdomainAvailabilityValidatorFromResource(
  subdomainSig: WritableSignal<string>,
  resource: HttpResourceRef<SubdomainAvailabilityDto | undefined>,
  excludeSubdomain?: string
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const raw = (control.value ?? '').toString().toLowerCase().trim();

    // Fast exits — let sync rules show messages
    if (!raw) return of(null);
    if (excludeSubdomain && raw === excludeSubdomain.toLowerCase()) return of(null);
    if (!SUBDOMAIN_PATTERN.test(raw)) return of(null);
    if (raw.length < 3 || raw.length > 50) return of(null);

    // Debounce to reduce refetches while typing
    return timer(500).pipe(
      tap(() => {
        // Only set the signal if the value has changed
        // This prevents unnecessary API calls
        const currentSigValue = subdomainSig();
        if (currentSigValue !== raw && currentSigValue !== '__INITIAL__') {
          subdomainSig.set(raw); // triggers the resource fetch
        } else if (currentSigValue === '__INITIAL__' && raw) {
          // First real input, replace the placeholder
          subdomainSig.set(raw);
        }
      }),
      switchMap(() => {
        // Don't check if the value is too short or is the placeholder
        const currentValue = subdomainSig();
        if (currentValue === '__INITIAL__' || currentValue.length < 3) {
          return of(null);
        }

        // Poll the resource state instead of using toObservable
        return interval(100).pipe(
          map(() => resource.isLoading()),
          filter(loading => !loading),
          take(1),
          map<unknown, ValidationErrors | null>(() => {
            // Never block on network/server errors
            if (resource.error()) return null;

            const res = resource.value(); // SubdomainAvailabilityDto | undefined
            // Only validate if we have a response for the current subdomain
            if (res && res.subdomain === raw) {
              return !res.available
                ? { unavailable: true, message: res.message ?? 'Subdomain is not available' }
                : null;
            }
            return null;
          })
        );
      })
    );
  };
}

// Keep your existing sync pattern/length validator as-is
export function subdomainPatternValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value ?? '').toString().toLowerCase().trim();
  if (!value) return null;
  if (!SUBDOMAIN_PATTERN.test(value)) {
    return {
      pattern: { message: 'Subdomain must contain only lowercase letters, numbers, and hyphens' },
    };
  }
  if (value.length < 3) {
    return {
      minlength: {
        requiredLength: 3,
        actualLength: value.length,
        message: 'Subdomain must be at least 3 characters long',
      },
    };
  }
  if (value.length > 50) {
    return {
      maxlength: {
        requiredLength: 50,
        actualLength: value.length,
        message: 'Subdomain must not exceed 50 characters',
      },
    };
  }
  return null;
}
