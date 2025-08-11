import { Sort } from '@angular/material/sort';
import { HttpParams } from '@angular/common/http';
import { PageableOptions } from '../staff.models';

/**
 * Map MatSort to Spring Data sort params
 * @param sort MatSort object
 * @returns Array of sort strings in format 'property,direction'
 */
export function mapMatSortToSortParams(sort: Sort): string[] {
  if (!sort.active || !sort.direction) {
    return [];
  }
  return [`${sort.active},${sort.direction}`];
}

/**
 * Build HttpParams from PageableOptions
 * @param options Pageable options
 * @returns HttpParams object for Spring Data
 */
export function buildPageableParams(options: PageableOptions): HttpParams {
  let params = new HttpParams();

  params = params.set('page', options.page.toString());
  params = params.set('size', options.size.toString());

  if (options.sort) {
    const sorts = Array.isArray(options.sort) ? options.sort : [options.sort];
    sorts.forEach(s => {
      params = params.append('sort', s);
    });
  }

  return params;
}

/**
 * Convert object to HttpParams for query parameters
 * Arrays become repeated keys, null/undefined are skipped
 * @param obj Object to convert
 * @returns HttpParams
 */
export function objectToParams(obj: Record<string, unknown>): HttpParams {
  let params = new HttpParams();

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value === null || value === undefined) continue;

    if (Array.isArray(value)) {
      value.forEach(item => {
        params = params.append(key, String(item));
      });
    } else {
      params = params.set(key, String(value));
    }
  }

  return params;
}
